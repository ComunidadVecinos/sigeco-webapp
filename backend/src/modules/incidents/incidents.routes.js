const express = require('express');

const asyncHandler = require('../../lib/http/asyncHandler');
const { createImageUpload } = require('../../lib/storage/avatarUpload');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');

const incidentsController = require('./incidents.controller');
const {
  communityIdParamSchema,
  incidentParamsSchema,
  createIncidentSchema,
  updateIncidentSchema,
  listIncidentsQuerySchema,
  updateIncidentStatusSchema,
  normalizeCreateIncidentMultipartBody,
  normalizeUpdateIncidentMultipartBody,
  ensureUpdateIncidentHasChanges
} = require('./incidents.validation');

/**
 * Rutas HTTP del módulo incidents.
 * Se monta como subrecurso de comunidad y reutiliza communityId desde la URL padre "/api/communities/:communityId/incidents".
 */

const router = express.Router({ mergeParams: true });
const uploadIncidentImage = createImageUpload('image');

// POST /api/communities/:communityId/incidents
// Crea una incidencia con imagen opcional.
router.post(
  '/',
  requireSession,
  uploadIncidentImage,
  normalizeCreateIncidentMultipartBody,
  validate({ params: communityIdParamSchema, body: createIncidentSchema }),
  asyncHandler(incidentsController.createIncident)
);

// GET /api/communities/:communityId/incidents
// Lista incidencias con filtros por estado y paginación.
router.get(
  '/',
  requireSession,
  validate({ params: communityIdParamSchema, query: listIncidentsQuerySchema }),
  asyncHandler(incidentsController.getIncidentList)
);

// GET /api/communities/:communityId/incidents/:incidentId
// Devuelve el detalle de una incidencia activa.
router.get(
  '/:incidentId',
  requireSession,
  validate({ params: incidentParamsSchema }),
  asyncHandler(incidentsController.getIncidentDetail)
);

// DELETE /api/communities/:communityId/incidents/:incidentId/image
// Elimina solo la imagen asociada a una incidencia pendiente.
router.delete(
  '/:incidentId/image',
  requireSession,
  validate({ params: incidentParamsSchema }),
  asyncHandler(incidentsController.deleteIncidentImage)
);

// PATCH /api/communities/:communityId/incidents/:incidentId
// Permite editar título, descripción y/o imagen mientras la incidencia siga pendiente.
router.patch(
  '/:incidentId',
  requireSession,
  uploadIncidentImage,
  normalizeUpdateIncidentMultipartBody,
  validate({ params: incidentParamsSchema, body: updateIncidentSchema }),
  ensureUpdateIncidentHasChanges,
  asyncHandler(incidentsController.updateIncident)
);

// DELETE /api/communities/:communityId/incidents/:incidentId
// Hace borrado lógico de la incidencia y limpia la imagen si existe.
router.delete(
  '/:incidentId',
  requireSession,
  validate({ params: incidentParamsSchema }),
  asyncHandler(incidentsController.deleteIncident)
);

// POST /api/communities/:communityId/incidents/:incidentId/status
// Cambia el estado respetando las transiciones permitidas.
router.post(
  '/:incidentId/status',
  requireSession,
  validate({ params: incidentParamsSchema, body: updateIncidentStatusSchema }),
  asyncHandler(incidentsController.updateIncidentStatus)
);

module.exports = router;