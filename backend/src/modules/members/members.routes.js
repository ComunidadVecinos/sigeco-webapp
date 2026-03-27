const express = require('express');

// Rutas HTTP del módulo members.
// Todas las rutas cuelgan de /communities/:communityId/members

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

router.get('/', requireSession, validate({ params: communityIdParamSchema, query: listCommunityMembersQuerySchema }), asyncHandler(membersController.getCommunityMembers));
router.post('/me/leave', requireSession, validate({ params: communityIdParamSchema, body: leaveCommunitySchema }), asyncHandler(membersController.leaveMyCommunity));
router.post('/:memberId/expel', requireSession, validate({ params: communityMemberParamsSchema, body: expelMemberSchema }), asyncHandler(membersController.expelCommunityMember));
router.put('/:memberId/roles/:role', requireSession, validate({ params: communityMemberRoleParamsSchema }), asyncHandler(membersController.assignCommunityMemberRole));
router.put('/:memberId/suspension', requireSession, validate({ params: communityMemberParamsSchema, body: suspendMemberSchema }), asyncHandler(membersController.suspendCommunityMember));
router.delete('/:memberId/suspension', requireSession, validate({ params: communityMemberParamsSchema }), asyncHandler(membersController.cancelCommunityMemberSuspension));

module.exports = router;
