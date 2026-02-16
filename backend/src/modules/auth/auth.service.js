const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const AppError = require('../../lib/errors/AppError');
const mailService = require('../../lib/mail/mail.service');
const sessionService = require('../../lib/session/session.service');
const authRepository = require('./auth.repository');

function buildRegisterResponse(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt.toISOString()
  };
}

function buildAuthResponse(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone
  };
}

function buildPhoneCandidates(phone) {
  if (!phone) return [];

  const normalized = phone.replace(/[\s-]/g, '');
  const local = normalized.startsWith('+34') ? normalized.slice(3) : normalized;
  return Array.from(new Set([normalized, local].filter(Boolean)));
}

function generateTemporaryPassword(length = 12) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*';

  const required = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    symbols[crypto.randomInt(symbols.length)]
  ];

  const allChars = `${upper}${lower}${digits}${symbols}`;
  while (required.length < length) {
    required.push(allChars[crypto.randomInt(allChars.length)]);
  }

  for (let i = required.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [required[i], required[j]] = [required[j], required[i]];
  }

  return required.join('');
}

async function registerUser(input, context = {}) {
  const existingUser = await authRepository.findUserByEmail(input.email);
  if (existingUser) {
    throw new AppError('Email already registered', 409, 'CONFLICT');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const createdUser = await authRepository.createUser({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    passwordHash
  });

  const session = await sessionService.createSession(
    createdUser.id,
    { ip: context.ip, userAgent: context.userAgent },
    context.ttlMs
  );

  return {
    sid: session.id,
    user: buildRegisterResponse(createdUser)
  };
}

async function loginUser(input, context = {}) {
  let user = null;

  if (input.email) {
    user = await authRepository.findUserByEmail(input.email);
  }

  if (!user && input.phone) {
    user = await authRepository.findUserByPhoneCandidates(buildPhoneCandidates(input.phone));
  }

  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const session = await sessionService.createSession(
    user.id,
    { ip: context.ip, userAgent: context.userAgent },
    context.ttlMs
  );

  return {
    sid: session.id,
    user: buildAuthResponse(user)
  };
}

async function logoutUser(sid) {
  if (sid) {
    await sessionService.revokeSession(sid);
  }

  return {
    message: 'Logged out successfully'
  };
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const fullUser = await authRepository.findUserByEmail(user.email);
  if (!fullUser) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const currentMatches = await bcrypt.compare(currentPassword, fullUser.passwordHash);
  if (!currentMatches) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await authRepository.updateUserPassword(userId, newHash);
  await sessionService.revokeAllUserSessions(userId);

  return {
    message: 'Password changed successfully. Please sign in again.'
  };
}

async function forgotPassword(email) {
  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    return {
      message: 'If the email exists, a new temporary password has been sent.'
    };
  }

  const temporaryPassword = generateTemporaryPassword();
  const temporaryPasswordHash = await bcrypt.hash(temporaryPassword, 10);

  await authRepository.updateUserPassword(user.id, temporaryPasswordHash);
  await sessionService.revokeAllUserSessions(user.id);

  const appPublicUrl = process.env.APP_PUBLIC_URL || 'http://localhost';
  await mailService.sendMail({
    to: user.email,
    subject: 'SIGECO - Temporary password',
    text: [
      `Hello ${user.firstName || ''},`.trim(),
      '',
      'A password reset was requested for your account.',
      `Your new temporary password is: ${temporaryPassword}`,
      '',
      `Sign in at: ${appPublicUrl}/access`,
      'After signing in, please change your password immediately.'
    ].join('\n')
  });

  return {
    message: 'If the email exists, a new temporary password has been sent.'
  };
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  changePassword,
  forgotPassword
};
