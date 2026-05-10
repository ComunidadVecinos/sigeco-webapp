// Router de incidents: agrupa alta, seguimiento y cierre de incidencias comunitarias.
// Flujo cubierto: sesión -> validación de params/query/body -> controlador.
// Expone el router de Express para alta, listado, detalle, edición, borrado y cambio de estado.
// Lo consume el router de communities como subrecurso con communityId.
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

const router = express.Router({ mergeParams: true });
const uploadIncidentImage = createImageUpload('image');

// --- Incidencias: GET de consulta ---
router.get(
  '/',
  requireSession,
  validate({ params: communityIdParamSchema, query: listIncidentsQuerySchema }),
  asyncHandler(incidentsController.getIncidentList)
);

router.get(
  '/:incidentId',
  requireSession,
  validate({ params: incidentParamsSchema }),
  asyncHandler(incidentsController.getIncidentDetail)
);

// --- Incidencias: POST de creación y acciones administrativas ---
router.post(
  '/',
  requireSession,
  uploadIncidentImage,
  normalizeCreateIncidentMultipartBody,
  validate({ params: communityIdParamSchema, body: createIncidentSchema }),
  asyncHandler(incidentsController.createIncident)
);

router.post(
  '/:incidentId/status',
  requireSession,
  validate({ params: incidentParamsSchema, body: updateIncidentStatusSchema }),
  asyncHandler(incidentsController.updateIncidentStatus)
);

// --- Incidencias: PATCH de edición ---
router.patch(
  '/:incidentId',
  requireSession,
  uploadIncidentImage,
  normalizeUpdateIncidentMultipartBody,
  validate({ params: incidentParamsSchema, body: updateIncidentSchema }),
  ensureUpdateIncidentHasChanges,
  asyncHandler(incidentsController.updateIncident)
);

// --- Incidencias: DELETE de imagen y borrado lógico ---
router.delete(
  '/:incidentId/image',
  requireSession,
  validate({ params: incidentParamsSchema }),
  asyncHandler(incidentsController.deleteIncidentImage)
);

router.delete(
  '/:incidentId',
  requireSession,
  validate({ params: incidentParamsSchema }),
  asyncHandler(incidentsController.deleteIncident)
);

module.exports = router;