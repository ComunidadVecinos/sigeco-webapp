// Router de requests: agrupa alta, seguimiento y bandeja de revisión de solicitudes.
// Flujo cubierto: sesión -> validación de params/query/body -> controlador.
// Expone el router de Express para solicitudes propias y bandeja administrativa comunitaria.
// Lo consume app.js bajo "/api/requests".
const express = require('express');

const asyncHandler = require('../../lib/http/asyncHandler');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const requestsController = require('./requests.controller');
const { createRequestSchema, requestIdParamSchema, resolveRequestBodySchema, listCommunityRequestsQuerySchema } = require('./requests.validation');

const router = express.Router();

// --- Solicitudes propias: GET de consulta ---
router.get('/mine', requireSession, asyncHandler(requestsController.getMyRequests));

// --- Bandeja comunitaria: GET de consulta ---
router.get(
  '/',
  requireSession,
  validate({ query: listCommunityRequestsQuerySchema }),
  asyncHandler(requestsController.getCommunityPendingRequests)
);

// --- Solicitudes propias: POST de creación y acciones del usuario ---
router.post(
  '/', 
  requireSession, 
  validate({ body: createRequestSchema }), 
  asyncHandler(requestsController.createRequest)
);

router.post(
  '/:requestId/cancel', 
  requireSession, 
  validate({ params: requestIdParamSchema }), 
  asyncHandler(requestsController.cancelRequest)
);

router.post(
  '/:requestId/archive', 
  requireSession, 
  validate({ params: requestIdParamSchema }), 
  asyncHandler(requestsController.archiveRequest)
);

// --- Revisión administrativa: POST de resolución ---
router.post(
  '/:requestId/approve',
  requireSession,
  validate({ params: requestIdParamSchema, body: resolveRequestBodySchema }),
  asyncHandler(requestsController.approveRequest)
);

router.post(
  '/:requestId/reject',
  requireSession,
  validate({ params: requestIdParamSchema, body: resolveRequestBodySchema }),
  asyncHandler(requestsController.rejectRequest)
);

module.exports = router;