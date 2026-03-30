const crypto = require('crypto');
const { randomUUID } = require('crypto');

/**
 * Helpers de sesión compartidos entre auth, controllers y middleware HTTP.
 * La cookie solo transporta un identificador opaco firmado. El contexto de acceso se resuelve siempre desde base de datos para no duplicar 
 * estado entre cookie, session y memberships.
 */

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error('SESSION_SECRET is required');
  }

  return secret;
}

// Devuelve el TTL de la sesión en días, con un valor predeterminado de 7 días si la configuración es inválida o no se proporciona.
function getSessionTtlDays() {
  const raw = process.env.SESSION_TTL_DAYS;
  const days = Number(raw ?? 7);

  if (!Number.isFinite(days) || days <= 0) {
    return 7;
  }

  return days;
}

// Expone el TTL de sesión en milisegundos para cookies y expiración persistida.
function getSessionTtlMs() {
  return getSessionTtlDays() * 24 * 60 * 60 * 1000;
}

// Define el contrato común de la cookie sid, reutilizado por auth y users para garantizar consistencia entre creación y limpieza de la cookie.
function getCookieConfig() {
  const sameSiteRaw = String(process.env.SESSION_SAMESITE || 'lax').toLowerCase();
  const sameSite = ['lax', 'strict', 'none'].includes(sameSiteRaw) ? sameSiteRaw : 'lax';
  const secure = sameSite === 'none' || String(process.env.SESSION_SECURE || 'false').toLowerCase() === 'true';

  return { httpOnly: true, sameSite, path: '/', secure };
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

// Genera el identificador persistido de la sesión.
function createSessionId() {
  return randomUUID();
}

// Serializa el identificador de sesión en un token firmado apto para cookie.
// Se firma solo el sessionID para que cualquier cambio de membreesía o expiración se controle desde la sesión persistida y no desde la cookie.
function createSessionToken(sessionId) {
  const signature = signValue(sessionId);

  return {
    token: `${sessionId}.${signature}`
  };
}

// Valida la firma de la cookie de sesión y extrae el identificador persistido. Devuelve un objeto con sessionId o null si el token no es fiable.
function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  const separator = token.indexOf('.');
  if (separator <= 0 || separator === token.length - 1) return null;

  const sessionId = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!hasValidSignature(sessionId, signature)) return null;

  return {
    sessionId
  };
}

module.exports = { createSessionId, getSessionSecret, getSessionTtlDays, getSessionTtlMs, getCookieConfig, createSessionToken, verifySessionToken };