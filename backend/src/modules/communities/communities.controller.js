// Controladores HTTP del módulo communities.
const communitiesRepository = require('./communities.repository');
const communitiesService = require('./communities.service');

// Los controllers mantienen un contrato minimo de contexto:
// - operaciones de consulta/edición usan userId
// - operaciones que alteran la comunidad y el contexto activo requieren también sessionId
async function getCommunitySummary(req, res) {
  const result = await communitiesService.getCommunitySummary({ userId: req.user.id }, req.params.communityId, communitiesRepository);
  return res.status(200).json(result);
}

async function regenerateCommunityAccessCode(req, res) {
  const result = await communitiesService.regenerateCommunityAccessCode({ userId: req.user.id }, req.params.communityId, communitiesRepository);
  return res.status(200).json(result);
}

async function updateCommunity(req, res) {
  const result = await communitiesService.updateCommunity({ userId: req.user.id }, req.params.communityId, req.body, communitiesRepository);
  return res.status(200).json(result);
}

async function updateCommunityAvatar(req, res) {
  const result = await communitiesService.updateCommunityAvatar({ userId: req.user.id }, req.params.communityId, req.file, communitiesRepository);
  return res.status(200).json(result);
}

async function deleteCommunityAvatar(req, res) {
  const result = await communitiesService.deleteCommunityAvatar({ userId: req.user.id }, req.params.communityId, communitiesRepository);
  return res.status(200).json(result);
}

async function deleteCommunity(req, res) {
  // El service necesita la sesión actual para recalcular el contexto activo del actor tras el borrado.
  const result = await communitiesService.deleteCommunity(
    {
      userId: req.user.id,
      sessionId: req.session.id,
      activeMembershipId: req.session.activeMembershipId || null
    },
    req.params.communityId, req.body, communitiesRepository);

  return res.status(200).json(result);
}

// Crear comunidad también cambia el contexto activo de la sesión que hace la operación.
async function createCommunity(req, res) {
  const result = await communitiesService.createCommunity({ userId: req.user.id, sessionId: req.session.id }, req.body, communitiesRepository);
  return res.status(201).json(result);
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