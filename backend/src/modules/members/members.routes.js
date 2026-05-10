// Router de members: agrupa el mantenimiento de miembros, cargos y suspensiones de la comunidad.
// Flujo cubierto: sesión -> validación de params/query/body -> controlador.
// Expone el router de Express para listado, salida, expulsión, roles y suspensiones.
// Lo consume el router de communities como subrecurso con communityId.
const express = require('express');

const asyncHandler = require('../../lib/http/asyncHandler');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const membersController = require('./members.controller');
const {
  communityIdParamSchema,
  communityMemberParamsSchema,
  communityMemberRoleParamsSchema,
  leaveCommunitySchema,
  expelMemberSchema,
  suspendMemberSchema,
  listCommunityMembersQuerySchema
} = require('./members.validation');

const router = express.Router({ mergeParams: true });

// --- Miembros: GET de consulta ---
router.get(
  '/',
  requireSession,
  validate({ params: communityIdParamSchema, query: listCommunityMembersQuerySchema }),
  asyncHandler(membersController.getCommunityMembers)
);

// --- Miembros: POST de salida y expulsión ---
router.post(
  '/me/leave',
  requireSession,
  validate({ params: communityIdParamSchema, body: leaveCommunitySchema }),
  asyncHandler(membersController.leaveMyCommunity)
);

router.post(
  '/:memberId/expel',
  requireSession,
  validate({ params: communityMemberParamsSchema, body: expelMemberSchema }),
  asyncHandler(membersController.expelCommunityMember)
);

// --- Miembros: PUT de roles y suspensión ---
router.put(
  '/:memberId/roles/:role',
  requireSession,
  validate({ params: communityMemberRoleParamsSchema }),
  asyncHandler(membersController.assignCommunityMemberRole)
);

router.put(
  '/:memberId/suspension',
  requireSession,
  validate({ params: communityMemberParamsSchema, body: suspendMemberSchema }),
  asyncHandler(membersController.suspendCommunityMember)
);

// --- Miembros: DELETE de cancelación de suspensión ---
router.delete(
  '/:memberId/suspension',
  requireSession,
  validate({ params: communityMemberParamsSchema }),
  asyncHandler(membersController.cancelCommunityMemberSuspension)
);

module.exports = router;