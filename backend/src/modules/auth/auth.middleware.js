// Middleware de sesión: levanta al usuario autenticado a partir de la cookie firmada.
// Flujo cubierto: cookie firmada -> sesión persistida -> reparación de contexto -> req.user/req.session.
// Expone requireSession, que protege rutas autenticadas del resto del backend. Lo consumen la mayoría de módulos funcionales.
const asyncHandler = require('../../lib/http/asyncHandler');
const { UnauthorizedError } = require('../../lib/errors');
const sessionService = require('../../lib/session');
const authRepository = require('./auth.repository');
const { resolveUserAccessContext } = require('./auth.context');

// Si detectamos una sesión inválida, limpiamos la cookie local para evitar reintentos inútiles del cliente.
function clearAuthCookie(res) {
  res.cookie('sid', '', { ...sessionService.getCookieConfig(), maxAge: 0 });
}

// --- Helpers de coherencia de contexto ---
function isStoredActiveMembershipValid(storedSession) {
  const activeMembership = storedSession.activeMembership;

  // Solo consideramos válida la membership activa persistida en sesión si: pertenece al mismo usuario, la membresía se mantiene y su comunidad existe.
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

// Si la membership activa ya no es válida o difiere del último contexto del usuario, se recalculan las referencias.
async function repairSessionAccessContext(storedSession) {
  if (!shouldRepairSessionAccessContext(storedSession)) {
    return storedSession;
  }

  const accessContext = await resolveUserAccessContext(
    storedSession.user,
    authRepository,
    storedSession.activeMembershipId || storedSession.user.lastActiveMembershipId
  );
  const repairedActiveMembershipId = accessContext.activeMembership?.id || null;
  if (repairedActiveMembershipId === storedSession.activeMembershipId && repairedActiveMembershipId === storedSession.user.lastActiveMembershipId) {
    return storedSession;
  }

  await authRepository.updateSessionAccessContext({ sessionId: storedSession.id, userId: storedSession.userId, activeMembershipId: repairedActiveMembershipId });

  return {
    ...storedSession,
    activeMembershipId: repairedActiveMembershipId,
    activeMembership: null,
    user: { ...storedSession.user, lastActiveMembershipId: repairedActiveMembershipId }
  };
}

// --- Resolución de autenticación ---
// La autenticación se apoya en una cookie `sid` firmada; la autoridad real sigue estando en la sesión de BD.
async function resolveAuthenticatedSession(req, res) {
  const sid = req.cookies?.sid;
  if (!sid) {
    throw new UnauthorizedError('Falta la cookie de sesión');
  }

  const session = sessionService.verifySessionToken(sid);
  if (!session) {
    clearAuthCookie(res);
    throw new UnauthorizedError('La sesión no es válida o ha caducado');
  }

  const storedSession = await authRepository.findSessionById(session.sessionId);
  if (!storedSession || storedSession.invalidatedAt || storedSession.expiresAt <= new Date() || !storedSession.user || storedSession.user.deletedAt) {
    clearAuthCookie(res);
    throw new UnauthorizedError('La sesión no es válida o ha caducado');
  }

  return repairSessionAccessContext(storedSession);
}

// Contrato de salida para el resto de módulos:
// - req.user contiene la identidad básica del usuario autenticado
// - req.session contiene solo los metadatos de sesión necesarios fuera de auth
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