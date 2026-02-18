const crypto = require('crypto');

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error('SESSION_SECRET is required');
  }

  return secret;
}

function getSessionTtlDays() {
  const raw = process.env.SESSION_TTL_DAYS;
  const days = Number(raw ?? 7);
  if (!Number.isFinite(days) || days <= 0) return 7;
  return days;
}

function getSessionTtlMs() {
  return getSessionTtlDays() * 24 * 60 * 60 * 1000;
}

function getCookieConfig() {
  const sameSiteRaw = String(process.env.SESSION_SAMESITE || 'lax').toLowerCase();
  const sameSite = ['lax', 'strict', 'none'].includes(sameSiteRaw) ? sameSiteRaw : 'lax';
  const secure = String(process.env.SESSION_SECURE || 'false').toLowerCase() === 'true';

  return {
    httpOnly: true,
    sameSite,
    path: '/',
    secure
  };
}

function signValue(value) {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function hasValidSignature(value, signature) {
  const expectedSignature = signValue(value);
  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

function buildPayload({ userId, authVersion, expiresAtMs }) {
  return Buffer.from(
    JSON.stringify({
      uid: userId,
      ver: authVersion,
      exp: expiresAtMs
    }),
    'utf8'
  ).toString('base64url');
}

function parsePayload(payload) {
  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded);

    if (!parsed || typeof parsed.uid !== 'string') return null;
    if (!Number.isInteger(parsed.ver)) return null;
    if (!Number.isFinite(parsed.exp)) return null;

    return {
      userId: parsed.uid,
      authVersion: parsed.ver,
      expiresAtMs: parsed.exp
    };
  } catch (error) {
    return null;
  }
}

function createSessionToken({ userId, authVersion }, ttlMs = getSessionTtlMs()) {
  const expiresAtMs = Date.now() + ttlMs;
  const payload = buildPayload({ userId, authVersion, expiresAtMs });
  const signature = signValue(payload);

  return {
    token: `${payload}.${signature}`,
    expiresAt: new Date(expiresAtMs)
  };
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  const separator = token.indexOf('.');
  if (separator <= 0 || separator === token.length - 1) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!hasValidSignature(payload, signature)) return null;

  const parsed = parsePayload(payload);
  if (!parsed) return null;
  if (parsed.expiresAtMs <= Date.now()) return null;

  return {
    userId: parsed.userId,
    authVersion: parsed.authVersion,
    expiresAt: new Date(parsed.expiresAtMs)
  };
}

module.exports = {
  getSessionSecret,
  getSessionTtlDays,
  getSessionTtlMs,
  getCookieConfig,
  createSessionToken,
  verifySessionToken
};
