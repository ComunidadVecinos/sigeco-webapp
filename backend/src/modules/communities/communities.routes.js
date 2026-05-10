const express = require('express');

// Router de communities: junta la administración de comunidades y el montaje de sus subrecursos.
// Flujo cubierto: sesión -> validación de params/body -> controlador o subrouter de comunidad.
// Expone el router de Express para administración de comunidad y montaje de subrecursos funcionales.
// Lo consume app.js bajo "/api/communities".
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

// --- Submódulos comunitarios ---
// Todos estos módulos comparten communityId en la URL y centralizan la navegación bajo communities.
router.use('/:communityId/members', membersRoutes);
router.use('/:communityId/help', helpCommunityRoutes);
router.use('/:communityId/calendar', calendarRoutes);
router.use('/:communityId/voting', votingRoutes);
router.use('/:communityId/forum', forumRoutes);
router.use('/:communityId/news', newsRoutes);
router.use('/:communityId/incidents', incidentsRoutes);
router.use('/:communityId/documents', documentsRoutes);
router.use('/:communityId/reservations', reservationsRoutes);

// --- Comunidades: GET de consulta ---
router.get(
  '/:communityId/summary', 
  requireSession, 
  validate({ params: communityIdParamSchema }), 
  asyncHandler(communitiesController.getCommunitySummary)
);

// --- Comunidades: POST de creación y acciones administrativas ---
router.post(
  '/:communityId/admin/access-code/regenerate',
  requireSession,
  validate({ params: communityIdParamSchema }),
  asyncHandler(communitiesController.regenerateCommunityAccessCode)
);

router.post(
  '/',
  requireSession,
  validate({ body: createCommunitySchema }),
  asyncHandler(communitiesController.createCommunity)
);

// --- Comunidades: PATCH de edición ---
router.patch(
  '/:communityId',
  requireSession,
  validate({ params: communityIdParamSchema, body: updateCommunitySchema }),
  asyncHandler(communitiesController.updateCommunity)
);

// --- Comunidades: PUT de avatar ---
router.put(
  '/:communityId/avatar',
  requireSession,
  validate({ params: communityIdParamSchema }),
  uploadAvatar,
  asyncHandler(communitiesController.updateCommunityAvatar)
);

// --- Comunidades: DELETE de avatar y borrado lógico ---
router.delete(
  '/:communityId/avatar',
  requireSession,
  validate({ params: communityIdParamSchema }),
  asyncHandler(communitiesController.deleteCommunityAvatar)
);

router.delete(
  '/:communityId',
  requireSession,
  validate({ params: communityIdParamSchema, body: deleteCommunitySchema }),
  asyncHandler(communitiesController.deleteCommunity)
);

module.exports = router;