// Middleware de autenticación del modulo auth.
// Resuelve la sesión persistida y repara el contexto activo si quedó desalineado.
const asyncHandler = require('../../lib/http/asyncHandler');
const { UnauthorizedError } = require('../../lib/errors');
const sessionService = require('../../lib/session');
const authRepository = require('./auth.repository');
const { resolveUserAccessContext } = require('./auth.context');

// Borra la cookie local cuando detecta un token inválido/expirado.
function clearSessionCookie(res) {
  res.cookie('sid', '', { ...sessionService.getCookieConfig(), maxAge: 0 });
}

function isStoredActiveMembershipValid(storedSession) {
  const activeMembership = storedSession.activeMembership;

  // Solo consideramos válida la membership activa persistida en sesión si:
  //   pertenece al mismo usuario, la membresía se mantiene y su comunidad existe.
  return Boolean(
    storedSession.activeMembershipId &&
    activeMembership &&
    activeMembership.id === storedSession.activeMembershipId &&
    activeMembership.userId === storedSession.userId &&
    !activeMembership.deletedAt &&
    !activeMembership.endedAt &&
    !activeMembership.community?.deletedAt
  );
}

// Detecta si hay inconsistencia entre la sesión y el usuario.
function shouldRepairSessionAccessContext(storedSession) {
  if (!storedSession.user) {
    return false;
  }

  // Hay membership pero no es válida: se repara para evitar redirigir a un contexto bloqueado.
  if (storedSession.activeMembershipId && !isStoredActiveMembershipValid(storedSession)) {
    return true;
  }

  // No hay membership pero el usuario tiene un último contexto activo: se repara para respetar la preferencia persistida.
  if (!storedSession.activeMembershipId && storedSession.user.lastActiveMembershipId) {
    return true;
  }

  return (storedSession.activeMembershipId !== null && storedSession.user.lastActiveMembershipId !== storedSession.activeMembershipId);
}

// Si la membership activa ya no es válida o difiere del último contexto del usuario, se recalculan las referencias
async function repairSessionAccessContext(storedSession) {
  if (!shouldRepairSessionAccessContext(storedSession)) {
    return storedSession;
  }

  const accessContext = await resolveUserAccessContext(storedSession.user, authRepository,storedSession.activeMembershipId || storedSession.user.lastActiveMembershipId);
  const repairedActiveMembershipId = accessContext.activeMembership?.id || null;

  if (repairedActiveMembershipId === storedSession.activeMembershipId && repairedActiveMembershipId === storedSession.user.lastActiveMembershipId) {
    return storedSession;
  }

  await authRepository.updateSessionAccessContext({ sessionId: storedSession.id, userId: storedSession.userId, activeMembershipId: repairedActiveMembershipId });

  return {
    ...storedSession,
    activeMembershipId: repairedActiveMembershipId,
    activeMembership: null,
    user: {
      ...storedSession.user,
      lastActiveMembershipId: repairedActiveMembershipId
    }
  };
}

// Resuelve la sesión autenticada a partir de la cookie sid (verifica token, carga sesión, comprueba expiración y estado, repara el contexto).
async function resolveAuthenticatedSession(req, res) {
  const sid = req.cookies?.sid;

  if (!sid) {
    // La ausencia de sesión es una respuesta visible para frontend y se devuelve localizada.
    throw new UnauthorizedError('Falta la cookie de sesión');
  }

  const session = sessionService.verifySessionToken(sid);

  if (!session) {
    clearSessionCookie(res);
    throw new UnauthorizedError('La sesión no es válida o ha caducado');
  }

  const storedSession = await authRepository.findSessionById(session.sessionId);
  if (!storedSession || storedSession.invalidatedAt || storedSession.expiresAt <= new Date() || !storedSession.user || storedSession.user.deletedAt) {
    clearSessionCookie(res);
    throw new UnauthorizedError('La sesión no es válida o ha caducado');
  }

  return repairSessionAccessContext(storedSession);
}

// Contrato de salida para el resto de módulos:
// - req.user contiene solo identidad básica del usuario autenticado
// - req.session contiene solo los datos de sesión necesarios fuera de auth
const requireSession = asyncHandler(async function requireSession(req, res, next) {
  const storedSession = await resolveAuthenticatedSession(req, res);
  const user = storedSession.user;

  req.user = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone
  };
  req.session = {
    id: storedSession.id,
    expiresAt: storedSession.expiresAt,
    activeMembershipId: storedSession.activeMembershipId
  };

  return next();
});

module.exports = { requireSession };