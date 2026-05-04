// Capa HTTP de voting: baja las votaciones comunitarias a respuestas y formatos del API.
// Flujo cubierto: request autenticada y validada -> servicio -> JSON HTTP.
// Expone controladores para crear, listar, votar, cerrar y borrar votaciones.
// Lo consumen las rutas del módulo con asyncHandler.
const votingRepository = require('./voting.repository');
const votingService = require('./voting.service');

function requestContext(req) {
  return { userId: req.user.id };
}

// --- Votaciones comunitarias: POST ---
async function createVoting(req, res) {
  const result = await votingService.createVoting(requestContext(req), req.params.communityId, req.body, votingRepository);
  return res.status(201).json(result);
}

// --- Votaciones comunitarias: GET ---
async function getVotingList(req, res) {
  const result = await votingService.getVotingList(requestContext(req), req.params.communityId, req.query, votingRepository);
  return res.status(200).json(result);
}

// --- Votaciones comunitarias: POST de acciones ---
async function voteOnVoting(req, res) {
  const result = await votingService.voteOnVoting(
    requestContext(req),
    req.params.communityId,
    req.params.votingId,
    req.body,
    votingRepository
  );
  return res.status(200).json(result);
}

async function closeVoting(req, res) {
  const result = await votingService.closeVoting(
    requestContext(req),
    req.params.communityId,
    req.params.votingId,
    votingRepository
  );
  return res.status(200).json(result);
}

// --- Votaciones comunitarias: DELETE ---
async function deleteVoting(req, res) {
  const result = await votingService.deleteVoting(
    requestContext(req),
    req.params.communityId,
    req.params.votingId,
    votingRepository
  );
  return res.status(200).json(result);
}

module.exports = { createVoting, getVotingList, voteOnVoting, closeVoting, deleteVoting };