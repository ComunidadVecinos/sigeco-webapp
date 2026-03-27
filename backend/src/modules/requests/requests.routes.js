const express = require('express');

// Rutas HTTP del módulo requests.

const asyncHandler = require('../../lib/http/asyncHandler');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const requestsController = require('./requests.controller');
const { createRequestSchema,requestIdParamSchema, resolveRequestBodySchema, listCommunityRequestsQuerySchema } = require('./requests.validation');

const router = express.Router();

router.get('/mine', requireSession, asyncHandler(requestsController.getMyRequests));
router.get('/', requireSession, validate({ query: listCommunityRequestsQuerySchema }), asyncHandler(requestsController.getCommunityPendingRequests));
router.post('/', requireSession, validate({ body: createRequestSchema }), asyncHandler(requestsController.createRequest));
router.post('/:requestId/cancel', requireSession, validate({ params: requestIdParamSchema }), asyncHandler(requestsController.cancelRequest));
router.post('/:requestId/archive', requireSession, validate({ params: requestIdParamSchema }), asyncHandler(requestsController.archiveRequest));
router.post('/:requestId/approve', requireSession, validate({ params: requestIdParamSchema, body: resolveRequestBodySchema }), asyncHandler(requestsController.approveRequest));
router.post('/:requestId/reject', requireSession, validate({ params: requestIdParamSchema, body: resolveRequestBodySchema }), asyncHandler(requestsController.rejectRequest));

module.exports = router;