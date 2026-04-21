const express = require('express');

// Rutas HTTP del módulo communities.
const asyncHandler = require('../../lib/http/asyncHandler');
const { uploadAvatar } = require('../../lib/storage/avatarUpload');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');

const membersRoutes = require('../members/members.routes');
const helpCommunityRoutes = require('../help/help.community.routes');
const calendarRoutes = require('../calendar/calendar.routes');
const votingRoutes = require('../voting/voting.routes');
const forumRoutes = require('../forum/forum.routes');
const newsRoutes = require('../news/news.routes');
const incidentsRoutes = require('../incidents/incidents.routes');
const documentsRoutes = require('../documents/documents.routes');
const reservationsRoutes = require('../reservations/reservations.routes');

const communitiesController = require('./communities.controller');
const { createCommunitySchema, communityIdParamSchema, updateCommunitySchema, deleteCommunitySchema } = require('./communities.validation');

const router = express.Router();

// Forum, help y el resto de módulos se montan como subrecursos de comunidad, compartiendo communityId de la URL y centralizando la navegación bajo este módulo.
router.use('/:communityId/members', membersRoutes);
router.use('/:communityId/help', helpCommunityRoutes);
router.use('/:communityId/calendar', calendarRoutes);
router.use('/:communityId/voting', votingRoutes);
router.use('/:communityId/forum', forumRoutes);
router.use('/:communityId/news', newsRoutes);
router.use('/:communityId/incidents', incidentsRoutes);
router.use('/:communityId/documents', documentsRoutes);
router.use('/:communityId/reservations', reservationsRoutes);

// Orden:
// - validate sanea entrada antes del controller
// - requireSession se aplica donde el contrato exige identidad autenticada
router.get('/:communityId/summary', requireSession, validate({ params: communityIdParamSchema }), asyncHandler(communitiesController.getCommunitySummary));
router.post('/:communityId/admin/access-code/regenerate', requireSession, validate({ params: communityIdParamSchema }), asyncHandler(communitiesController.regenerateCommunityAccessCode));
router.patch('/:communityId', requireSession, validate({ params: communityIdParamSchema, body: updateCommunitySchema }), asyncHandler(communitiesController.updateCommunity));
router.put('/:communityId/avatar', requireSession, validate({ params: communityIdParamSchema }), uploadAvatar, asyncHandler(communitiesController.updateCommunityAvatar));
router.delete('/:communityId/avatar', requireSession, validate({ params: communityIdParamSchema }), asyncHandler(communitiesController.deleteCommunityAvatar));
router.delete('/:communityId', requireSession, validate({ params: communityIdParamSchema, body: deleteCommunitySchema }), asyncHandler(communitiesController.deleteCommunity));
router.post('/', requireSession, validate({ body: createCommunitySchema }), asyncHandler(communitiesController.createCommunity));

module.exports = router;
