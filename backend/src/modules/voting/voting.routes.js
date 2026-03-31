// Rutas HTTP del módulo voting.
// Se monta como subrecurso de comunidad para reutilizar el communityId de la URL.
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

router.post('/', requireSession, validate({ params: communityIdParamSchema, body: createVotingSchema }), asyncHandler(votingController.createVoting));
router.get('/', requireSession, validate({ params: communityIdParamSchema, query: listVotingQuerySchema }), asyncHandler(votingController.getVotingList));
router.post('/:votingId/vote', requireSession, validate({ params: votingParamsSchema, body: voteOnVotingSchema }), asyncHandler(votingController.voteOnVoting));
router.post('/:votingId/close', requireSession, validate({ params: votingParamsSchema }), asyncHandler(votingController.closeVoting));
router.delete('/:votingId', requireSession, validate({ params: votingParamsSchema }), asyncHandler(votingController.deleteVoting));

module.exports = router;