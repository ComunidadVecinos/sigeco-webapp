// Capa HTTP de members: lleva listados, salidas y sanciones al formato de respuesta del API.
// Flujo cubierto: request autenticada y validada -> servicio -> JSON HTTP.
// Expone controladores de listado, salida, expulsión, roles y suspensiones.
// Lo consumen las rutas del módulo con asyncHandler.
const membersRepository = require('./members.repository');
const membersService = require('./members.service');

function requestContext(req) {
  return { userId: req.user.id };
}

function requestContextWithSession(req) {
  return {
    userId: req.user.id,
    sessionId: req.session.id,
    activeMembershipId: req.session.activeMembershipId || null
  };
}

// --- Miembros: GET ---
async function getCommunityMembers(req, res) {
  const result = await membersService.getCommunityMembers(
    requestContext(req),
    { communityId: req.params.communityId, ...req.query },
    membersRepository
  );
  return res.status(200).json(result);
}

// --- Miembros: POST ---
// Abandonar una comunidad puede dejar inválida la membership activa de la sesión actual.
async function leaveMyCommunity(req, res) {
  const result = await membersService.leaveMyCommunity(
    requestContextWithSession(req),
    { communityId: req.params.communityId, ...req.body },
    membersRepository
  );
  return res.status(200).json(result);
}

async function expelCommunityMember(req, res) {
  const result = await membersService.expelCommunityMember(
    requestContext(req),
    { communityId: req.params.communityId, memberId: req.params.memberId, ...req.body },
    membersRepository
  );
  return res.status(200).json(result);
}

// --- Miembros: PUT ---
async function assignCommunityMemberRole(req, res) {
  const result = await membersService.assignCommunityMemberRole(
    requestContext(req),
    { communityId: req.params.communityId, memberId: req.params.memberId, role: req.params.role },
    membersRepository
  );
  return res.status(200).json(result);
}

async function suspendCommunityMember(req, res) {
  const result = await membersService.suspendCommunityMember(
    requestContext(req),
    { communityId: req.params.communityId, memberId: req.params.memberId, ...req.body },
    membersRepository
  );
  return res.status(200).json(result);
}

// --- Miembros: DELETE ---
async function cancelCommunityMemberSuspension(req, res) {
  const result = await membersService.cancelCommunityMemberSuspension(
    requestContext(req),
    { communityId: req.params.communityId, memberId: req.params.memberId },
    membersRepository
  );
  return res.status(200).json(result);
}

module.exports = {
  getCommunityMembers,
  leaveMyCommunity,
  expelCommunityMember,
  assignCommunityMemberRole,
  suspendCommunityMember,
  cancelCommunityMemberSuspension
};