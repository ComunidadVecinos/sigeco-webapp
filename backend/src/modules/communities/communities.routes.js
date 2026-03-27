const express = require('express');

// Rutas HTTP del módulo communities.
const asyncHandler = require('../../lib/http/asyncHandler');
const { uploadAvatar } = require('../../lib/storage/avatarUpload');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const helpCommunityRoutes = require('../help/help.community.routes');
const membersRoutes = require('../members/members.routes');
const communitiesController = require('./communities.controller');
const { createCommunitySchema, communityIdParamSchema, updateCommunitySchema, deleteCommunitySchema } = require('./communities.validation');

const router = express.Router();

// Members, help y el resto de módulos se montan como subrecursos de comunidad para compartir el mismo
// communityId de la URL y centralizar la navegacion administrativa bajo este modulo.
router.use('/:communityId/members', membersRoutes);
router.use('/:communityId/help', helpCommunityRoutes);

// Orden:
// - validate sanea entrada antes del controller
// - requireSession se aplica donde el contrato exige identidad autenticada
router.get('/:communityId/summary', requireSession, validate({ params: communityIdParamSchema }), asyncHandler(communitiesController.getCommunitySummary));
router.post('/:communityId/admin/access-code/regenerate', requireSession, validate({ params: communityIdParamSchema }), asyncHandler(communitiesController.regenerateCommunityAccessCode));
router.patch('/:communityId', requireSession, validate({ params: communityIdParamSchema, body: updateCommunitySchema }), asyncHandler(communitiesController.updateCommunity));
router.put('/:communityId/avatar', requireSession, validate({ params: communityIdParamSchema }), uploadAvatar, asyncHandler(communitiesController.updateCommunityAvatar));
router.delete('/:communityId', requireSession, validate({ params: communityIdParamSchema, body: deleteCommunitySchema }), asyncHandler(communitiesController.deleteCommunity));
router.post('/', requireSession, validate({ body: createCommunitySchema }), asyncHandler(communitiesController.createCommunity));

module.exports = router;