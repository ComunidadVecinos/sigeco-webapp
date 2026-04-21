const { z } = require('zod');

const { ValidationError } = require('../../lib/errors');
const { requiredTextSchema } = require('../../lib/validation/communityFields');
const { positiveIntegerQuerySchema, uuidParamSchema } = require('../../lib/validation/requestFields');

/**
 * Validaciones HTTP del módulo incidents.
 * Agrupa params, query, body JSON y el saneado del body multipart.
 */

const INCIDENT_EDITABLE_FIELDS = ['title', 'description'];

function validationDetail(field, message, location = 'body') {
  return { field, location, message };
}

// --- Params de ruta ---
const communityIdParamSchema = uuidParamSchema('communityId');
const incidentParamsSchema = uuidParamSchema('communityId', 'incidentId');

// --- Bodies JSON y multipart ---
const createIncidentSchema = z.object({
  title: requiredTextSchema('title', 160),
  description: requiredTextSchema('description', 4000)
}).strict();

const updateIncidentSchema = z.object({
  title: requiredTextSchema('title', 160).optional(),
  description: requiredTextSchema('description', 4000).optional()
}).strict();

// --- Query params ---
const listIncidentsQuerySchema = z.object({
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 10 }),
  status: z.enum(['open', 'pending', 'inProgress', 'resolved', 'cancelled', 'all']).default('open')
}).strict();

const updateIncidentStatusSchema = z.object({ status: z.enum(['inProgress', 'resolved', 'cancelled']) }).strict();

function sanitizeMultipartBody(allowedFields) {
  return function sanitizeBody(req, res, next) {
    if (!req.is('multipart/form-data')) {
      return next();
    }

    const body = req.body || {};
    const extraFields = Object.keys(body).filter((field) => !allowedFields.includes(field));

    // En multipart se blinda el contrato para que solo entren campos conocidos; el fichero viaja por req.file.
    if (extraFields.length > 0) {
      return next(new ValidationError(extraFields.map((field) => validationDetail(field, 'El campo no esta permitido'))));
    }

    const cleanBody = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        cleanBody[field] = body[field];
      }
    }

    req.body = cleanBody;
    return next();
  };
}

function ensureUpdateIncidentHasChanges(req, res, next) {
  if (Object.keys(req.body || {}).length > 0 || req.file) {
    return next();
  }
  return next(new ValidationError([validationDetail('body', 'Debes enviar al menos un campo editable de la incidencia')]));
}

const normalizeCreateIncidentMultipartBody = sanitizeMultipartBody(INCIDENT_EDITABLE_FIELDS);
const normalizeUpdateIncidentMultipartBody = sanitizeMultipartBody(INCIDENT_EDITABLE_FIELDS);

module.exports = {
  communityIdParamSchema,
  incidentParamsSchema,
  createIncidentSchema,
  updateIncidentSchema,
  listIncidentsQuerySchema,
  updateIncidentStatusSchema,
  normalizeCreateIncidentMultipartBody,
  normalizeUpdateIncidentMultipartBody,
  ensureUpdateIncidentHasChanges
};