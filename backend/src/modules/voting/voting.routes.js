// Router de voting: reúne creación, listado, voto, cierre y borrado de votaciones.
// Flujo cubierto: sesión -> validación de params/query/body -> controlador.
// Expone el router de Express para crear, listar, votar, cerrar y borrar votaciones.
// Lo consume el router de comunidades como subrecurso con `communityId`.
const express = require('express');

const asyncHandler = require('../../lib/http/asyncHandler');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const votingController = require('./voting.controller');
const {
  communityIdParamSchema,
  votingParamsSchema,
  createVotingSchema,
  listVotingQuerySchema,
  voteOnVotingSchema
} = require('./voting.validation');

const router = express.Router({ mergeParams: true });

// --- Votaciones comunitarias: GET de consulta ---
router.get(
  '/', 
  requireSession, 
  validate({ params: communityIdParamSchema, query: listVotingQuerySchema }), 
  asyncHandler(votingController.getVotingList)
);

// --- Votaciones comunitarias: POST de creación y acciones ---
router.post(
  '/', 
  requireSession, 
  validate({ params: communityIdParamSchema, body: createVotingSchema }), 
  asyncHandler(votingController.createVoting)
);

router.post(
  '/:votingId/vote', 
  requireSession, 
  validate({ params: votingParamsSchema, body: voteOnVotingSchema }), 
  asyncHandler(votingController.voteOnVoting)
);

router.post(
  '/:votingId/close', 
  requireSession, 
  validate({ params: votingParamsSchema }), 
  asyncHandler(votingController.closeVoting)
);

// --- Votaciones comunitarias: DELETE de borrado lógico ---
router.delete(
  '/:votingId', 
  requireSession, 
  validate({ params: votingParamsSchema }), 
  asyncHandler(votingController.deleteVoting)
);

module.exports = router;