// Capa HTTP de communities: aterriza la gestión de comunidades en respuestas y payloads estables.
// Flujo cubierto: request autenticada y validada -> servicio -> JSON HTTP.
// Expone controladores de administración de comunidad y cambios de contexto asociados.
// Lo consumen las rutas del módulo con asyncHandler.
const communitiesRepository = require('./communities.repository');
const communitiesService = require('./communities.service');

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

// --- Comunidades: GET ---
async function getCommunitySummary(req, res) {
  const result = await communitiesService.getCommunitySummary(requestContext(req), req.params.communityId, communitiesRepository);
  return res.status(200).json(result);
}

// --- Comunidades: POST ---
async function regenerateCommunityAccessCode(req, res) {
  const result = await communitiesService.regenerateCommunityAccessCode(requestContext(req), req.params.communityId, communitiesRepository);
  return res.status(200).json(result);
}

// Crear comunidad también cambia el contexto activo de la sesión que hace la operación.
async function createCommunity(req, res) {
  const result = await communitiesService.createCommunity(
    { userId: req.user.id, sessionId: req.session.id },
    req.body,
    communitiesRepository
  );
  return res.status(201).json(result);
}

// --- Comunidades: PATCH ---
async function updateCommunity(req, res) {
  const result = await communitiesService.updateCommunity(requestContext(req), req.params.communityId, req.body, communitiesRepository);
  return res.status(200).json(result);
}

// --- Comunidades: PUT ---
async function updateCommunityAvatar(req, res) {
  const result = await communitiesService.updateCommunityAvatar(requestContext(req), req.params.communityId, req.file, communitiesRepository);
  return res.status(200).json(result);
}

// --- Comunidades: DELETE ---
async function deleteCommunityAvatar(req, res) {
  const result = await communitiesService.deleteCommunityAvatar(requestContext(req), req.params.communityId, communitiesRepository);
  return res.status(200).json(result);
}

async function deleteCommunity(req, res) {
  // El service necesita la sesión actual para recalcular el contexto activo del actor tras el borrado.
  const result = await communitiesService.deleteCommunity(
    requestContextWithSession(req),
    req.params.communityId,
    req.body,
    communitiesRepository
  );
  return res.status(200).json(result);
}

module.exports = {
  getCommunitySummary,
  regenerateCommunityAccessCode,
  updateCommunity,
  updateCommunityAvatar,
  deleteCommunityAvatar,
  deleteCommunity,
  createCommunity
};