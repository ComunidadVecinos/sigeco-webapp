// Servicio del módulo auth.
// Orquesta credenciales, sesiones, contexto de acceso y recuperación de password.
const crypto = require('crypto');
const { Prisma } = require('@prisma/client');

const { EmailServiceUnavailableError, NotFoundError, UnauthorizedError, ValidationError, errorCodes } = require('../../lib/errors');
const mailService = require('../../lib/mail');
const sessionService = require('../../lib/session');
const passwordService = require('../../lib/password');
const authRepository = require('./auth.repository');
const { resolveUserAccessContext } = require('./auth.context');

// El registro no inicia sesión automáticamente: la respuesta solo confirma el alta.
function buildRegistrationResponse(user) {
  return {
    message: 'Registro completado correctamente. Inicia sesión para continuar.',
    email: user.email
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

function buildPasswordResetResponse() {
  return { message: 'Se ha enviado una nueva contraseña temporal.' };
}

// Login admite email o teléfono en el mismo campo para mantener un único punto de entrada.
function normalizeIdentifier(identifier) {
  const normalized = String(identifier || '').trim();

  if (!normalized) {
    return { email: null, phone: null };
  }

  if (normalized.includes('@')) {
    return { email: normalized.toLowerCase(), phone: null };
  }

  const compactPhone = normalized.replace(/\s/g, '');

  if (/^\d{9}$/.test(compactPhone)) {
    return { email: null, phone: compactPhone };
  }

  return { email: null, phone: null };
}

// La password temporal se genera localmente sin caracteres ambiguos y cumpliendo complejidad.
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

function buildValidationDetail(field, message) {
  return [{ field, location: 'body', message }];
}

function getUniqueConstraintField(error) {
  const target = error?.meta?.target;

  if (Array.isArray(target) && target.length > 0) {
    return target[0];
  }

  if (typeof target === 'string') {
    return target;
  }

  return null;
}

async function registerUser(input) {
  const existingUser = await authRepository.findUserByEmail(input.email);
  if (existingUser) {
    throw new ValidationError(buildValidationDetail('email', 'Este correo electrónico ya está registrado'), {
      message: 'Este correo electrónico ya está registrado',
      code: errorCodes.EMAIL_ALREADY_REGISTERED
    });
  }

  const passwordHash = await passwordService.hashPassword(input.password);

  try {
    const createdUser = await authRepository.createUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      passwordHash
    });

    return buildRegistrationResponse(createdUser);
  } 
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const field = getUniqueConstraintField(error);

      if (field === 'phone') {
        throw new ValidationError(buildValidationDetail('phone', 'Este teléfono ya está registrado'), {
          message: 'Este teléfono ya está registrado',
          code: errorCodes.PHONE_ALREADY_REGISTERED
        });
      }

      throw new ValidationError(buildValidationDetail('email', 'Este correo electrónico ya está registrado'), {
        message: 'Este correo electrónico ya está registrado',
        code: errorCodes.EMAIL_ALREADY_REGISTERED
      });
    }

    throw error;
  }
}

// Devuelve contexto de acceso inicial y periste la membership activa. La cookie solo transporta el sessionId firmado.
async function loginUser(input, context = {}) {
  const identifier = normalizeIdentifier(input.identifier);
  let user = null;

  if (identifier.email) {
    user = await authRepository.findUserByEmail(identifier.email);
  }

  if (!user && identifier.phone) {
    user = await authRepository.findUserByPhone(identifier.phone);
  }

  // El login no distingue entre usuario y contraseña para el error de acceso.
  if (!user) {
    throw new UnauthorizedError('Credenciales inválidas', { code: errorCodes.INVALID_CREDENTIALS });
  }

  const isValidPassword = await passwordService.verifyPassword(input.password, user.passwordHash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Credenciales inválidas', { code: errorCodes.INVALID_CREDENTIALS });
  }

  const accessContext = await resolveUserAccessContext(user, authRepository);
  const expiresAt = new Date(Date.now() + (context.ttlMs || sessionService.getSessionTtlMs()));
  const sessionId = sessionService.createSessionId();

  await authRepository.createSessionWithAccessContext({
    id: sessionId,
    userId: user.id,
    currentLastActiveMembershipId: user.lastActiveMembershipId,
    activeMembershipId: accessContext.activeMembership?.id || null,
    expiresAt
  });

  const session = sessionService.createSessionToken(sessionId);

  return {
    sid: session.token,
    user: buildAuthResponse(user),
    context: { actorType: accessContext.actorType, activeMembership: accessContext.activeMembership },
    session: { expiresAt: expiresAt.toISOString() }
  };
}

async function logoutUser() {
  return { message: 'Sesión cerrada correctamente.' };
}

// Logout falla en 401 si la sesión ya no era válida.
async function logoutSession(sessionId) {
  if (!sessionId) {
    throw new UnauthorizedError('No autorizado', { code: errorCodes.UNAUTHORIZED });
  }

  const result = await authRepository.invalidateSession(sessionId);
  if (result.count === 0) {
    throw new UnauthorizedError('No autorizado', { code: errorCodes.UNAUTHORIZED });
  }

  return logoutUser();
}

// Cambio de password invalida el resto de sesiones, pero conserva la sesión autenticada actual.
async function changePassword(userId, currentSessionId, currentPassword, newPassword) {
  const user = await authRepository.findUserAuthById(userId);
  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const currentMatches = await passwordService.verifyPassword(currentPassword, user.passwordHash);
  if (!currentMatches) {
    throw new ValidationError(buildValidationDetail('currentPassword', 'La contraseña actual no es válida'), {
      message: 'La contraseña actual no es válida',
      code: errorCodes.CURRENT_PASSWORD_INVALID
    });
  }

  const newHash = await passwordService.hashPassword(newPassword);
  await authRepository.updateUserPassword(userId, newHash);
  await authRepository.invalidateOtherActiveSessionsByUserId(userId, currentSessionId);

  return { message: 'Contraseña cambiada correctamente.' };
}

// Reset no revela si email existe (no se comprueba existencia en db ni se controla el dominio).
async function resetPassword(email) {
  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    return buildPasswordResetResponse();
  }

  const temporaryPassword = generateTemporaryPassword();
  const temporaryPasswordHash = await passwordService.hashPassword(temporaryPassword);
  const previousPasswordState = { passwordHash: user.passwordHash, passwordChangedAt: user.passwordChangedAt };

  await authRepository.updateUserPassword(user.id, temporaryPasswordHash);

  const appPublicUrl = process.env.APP_PUBLIC_URL || 'http://localhost';

  try {
    await mailService.sendMail({
      to: user.email,
      subject: 'SIGECO - Contraseña temporal',
      text: [
        `Hola ${user.firstName || ''},`.trim(),
        '',
        'Se ha solicitado un restablecimiento de contraseña para tu cuenta.',
        `Tu nueva contraseña temporal es: ${temporaryPassword}`,
        '',
        `Inicia sesión en: ${appPublicUrl}/access`,
        'Después de iniciar sesión, cambia tu contraseña lo antes posible.'
      ].join('\n')
    });
  } 
  catch (error) {
    await authRepository.restoreUserPasswordState(user.id, previousPasswordState);

    if (error instanceof EmailServiceUnavailableError) {
      throw error;
    }

    throw new EmailServiceUnavailableError(undefined, { cause: error });
  }

  // Todas las sesiones activas se invalidan tras persistencia de nueva password y envío de correo.
  await authRepository.invalidateActiveSessionsByUserId(user.id);

  return buildPasswordResetResponse();
}

module.exports = { registerUser, loginUser, logoutSession, changePassword, resetPassword };
