const { z } = require('zod');

// Validaciones de incidents: dejan listas las incidencias y sus cambios antes de llegar al servicio.
// Flujo cubierto: entrada Express -> schemas Zod -> datos listos para el servicio.
// Expone schemas de alta, edición, cambio de estado y helpers de multipart.
// Lo consumen las rutas antes de llegar a los controladores.
const { ValidationError } = require('../../lib/errors');
const { requiredTextSchema } = require('../../lib/validation/communityFields');
const { positiveIntegerQuerySchema, uuidParamSchema } = require('../../lib/validation/requestFields');

const INCIDENT_EDITABLE_FIELDS = ['title', 'description'];

function validationDetail(field, message, location = 'body') {
  return { field, location, message };
}

// --- Params de ruta ---
// Params para rutas que operan sobre una comunidad concreta.
const communityIdParamSchema = uuidParamSchema('communityId');
// Params para rutas que operan sobre una incidencia concreta de una comunidad.
const incidentParamsSchema = uuidParamSchema('communityId', 'incidentId');

// --- Bodies JSON y multipart ---
// Body de POST /: alta completa de la incidencia con título y descripción obligatorios.
const createIncidentSchema = z.object({
  title: requiredTextSchema('title', 160),
  description: requiredTextSchema('description', 4000)
}).strict();

// Body de PATCH /:incidentId: edición parcial del contenido visible de la incidencia.
const updateIncidentSchema = z.object({
  title: requiredTextSchema('title', 160).optional(),
  description: requiredTextSchema('description', 4000).optional()
}).strict();

// --- Query params ---
// Query de GET /: filtro público por estado y paginación del listado.
const listIncidentsQuerySchema = z.object({
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 10 }),
  status: z.enum(['open', 'pending', 'inProgress', 'resolved', 'cancelled', 'all']).default('open')
}).strict();

// Body de POST /:incidentId/status: transiciones administrativas permitidas del estado.
const updateIncidentStatusSchema = z.object({ status: z.enum(['inProgress', 'resolved', 'cancelled']) }).strict();

function sanitizeMultipartBody(allowedFields) {
  return function sanitizeBody(req, res, next) {
    if (!req.is('multipart/form-data')) {
      return next();
    }

    const body = req.body || {};
    const extraFields = Object.keys(body).filter((field) => !allowedFields.includes(field));

    // En multipart el fichero viaja por req.file, así que aquí solo se permiten campos de texto conocidos.
    if (extraFields.length > 0) {
      return next(new ValidationError(extraFields.map((field) => validationDetail(field, 'El campo no está permitido'))));
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

// En edición debe llegar al menos un cambio textual o un fichero nuevo.
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