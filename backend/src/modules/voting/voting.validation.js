// Validaciones de voting: dejan listas las votaciones, filtros y votos antes del servicio.
// Flujo cubierto: entrada Express -> schemas Zod -> datos listos para el controlador/servicio.
// Expone schemas de creación, listado, voto y params comunes del módulo.
// Lo consumen las rutas antes de llegar a los controladores.
const { z } = require('zod');

const { isValidInstantString, parseInstantToUtcDate } = require('../../lib/datetime/businessTime');
const { optionalCommentSchema, requiredTextSchema } = require('../../lib/validation/communityFields');
const { positiveIntegerQuerySchema, uuidFieldSchema, uuidParamSchema } = require('../../lib/validation/requestFields');

// Valida instantes ISO 8601 y los convierte a Date UTC para que el servicio trabaje con fechas reales.
function buildInstantFieldSchema(fieldName) {
  return z.string().trim()
    .refine((value) => isValidInstantString(value), `El campo ${fieldName} debe ser un instante ISO 8601 válido`)
    .transform((value) => parseInstantToUtcDate(value));
}

// Opción individual de una votación comunitaria.
const votingOptionSchema = z.object({ title: requiredTextSchema('title', 160) }).strict();
// Params para rutas montadas directamente bajo una comunidad.
const communityIdParamSchema = uuidParamSchema('communityId');
// Params para rutas que trabajan sobre una votación concreta.
const votingParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), votingId: uuidFieldSchema('votingId') });

// Body de POST /: datos completos para crear una nueva votación con sus opciones.
const createVotingSchema = z.object({
  title: requiredTextSchema('title', 160),
  description: optionalCommentSchema,
  endsAt: buildInstantFieldSchema('endsAt'),
  options: z.array(votingOptionSchema).min(2, 'Debes enviar al menos 2 opciones').max(5, 'No puedes enviar más de 5 opciones')
}).strict();

// Query de GET /: paginación y filtro opcional por estado de la votación.
const listVotingQuerySchema = z.object({
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 8 }),
  status: z.enum(['open', 'closed']).optional()
}).strict();

// Body de POST /:votingId/vote: opción concreta elegida por el usuario.
const voteOnVotingSchema = z.object({ optionId: uuidFieldSchema('optionId') }).strict();

module.exports = { communityIdParamSchema, votingParamsSchema, createVotingSchema, listVotingQuerySchema, voteOnVotingSchema };