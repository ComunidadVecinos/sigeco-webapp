const { z } = require('zod');

// Validaciones de requests: dejan encajados los datos de alta, revisión y filtros administrativos.
// Flujo cubierto: entrada Express -> schemas Zod -> datos listos para el servicio.
// Expone schemas de alta, resolución, filtros administrativos y params base.
// Lo consumen las rutas antes de llegar a los controladores.
const {
  addressSchema,
  accessCodeSchema,
  optionalAddressDetailSchema,
  optionalCommentSchema,
  requiredTextSchema
} = require('../../lib/validation/communityFields');
const { positiveIntegerQuerySchema, uuidFieldSchema, uuidParamSchema } = require('../../lib/validation/requestFields');

// Campos compartidos entre alta por código y solicitud de actualización de datos.
const requestDetailsFields = {
  proposedAlias: requiredTextSchema('proposedAlias', 120),
  country: addressSchema.shape.country,
  province: addressSchema.shape.province,
  municipality: addressSchema.shape.municipality,
  streetType: addressSchema.shape.streetType,
  streetName: addressSchema.shape.streetName,
  postalCode: addressSchema.shape.postalCode,
  streetNumberKm: addressSchema.shape.streetNumberKm,
  block: optionalAddressDetailSchema,
  floor: optionalAddressDetailSchema,
  door: optionalAddressDetailSchema,
  requestComment: optionalCommentSchema
};

// Body de POST / para altas en comunidad a partir de un código de acceso.
const joinRequestSchema = z.object({ type: z.literal('JOIN'), accessCode: accessCodeSchema, ...requestDetailsFields });

// Body de POST / para solicitar que administración actualice los datos visibles de una membership existente.
const updateInfoRequestSchema = z.object({ type: z.literal('UPDATE_INFO'), communityId: uuidFieldSchema('communityId'), ...requestDetailsFields });

// Body de POST /: unión discriminada por tipo de solicitud.
const createRequestSchema = z.discriminatedUnion('type', [joinRequestSchema, updateInfoRequestSchema]);

// Params para rutas que operan sobre una solicitud concreta.
const requestIdParamSchema = uuidParamSchema('requestId');

// Body de POST /:requestId/approve y /reject: comentario opcional de resolución.
const resolveRequestBodySchema = z.object({ resolutionMessage: optionalCommentSchema });

// Query de GET /: bandeja pendiente de una comunidad concreta, con paginación y filtro por tipo.
const listCommunityRequestsQuerySchema = z.object({
  communityId: uuidFieldSchema('communityId'),
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 10 }),
  type: z.enum(['JOIN', 'UPDATE_INFO']).optional()
});

module.exports = {
  createRequestSchema,
  requestIdParamSchema,
  resolveRequestBodySchema,
  listCommunityRequestsQuerySchema
};