// Validaciones de calendar: afinan params, query y body antes de tocar el servicio.
// Flujo cubierto: entrada Express -> schemas Zod -> datos listos para el servicio.
// Expone schemas de consulta mensual y de creación/edición de eventos personales.
// Lo consumen las rutas antes de llegar a los controladores.
const { z } = require('zod');

const { isValidInstantString, parseInstantToUtcDate } = require('../../lib/datetime/businessTime');
const { requiredTextSchema } = require('../../lib/validation/communityFields');
const { uuidFieldSchema, uuidParamSchema } = require('../../lib/validation/requestFields');

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

// Valida instantes ISO 8601 y los convierte a Date UTC para el servicio.
function buildInstantFieldSchema(fieldName) {
  return z.string().trim()
    .refine((value) => isValidInstantString(value), `El campo ${fieldName} debe ser un instante ISO 8601 válido`)
    .transform((value) => parseInstantToUtcDate(value));
}

// Params para rutas montadas directamente bajo una comunidad.
const communityIdParamSchema = uuidParamSchema('communityId');
// Params para rutas que trabajan sobre un evento personal concreto.
const personalCalendarEventParamsSchema = z.object({
  communityId: uuidFieldSchema('communityId'),
  eventId: uuidFieldSchema('eventId')
});

// Query de GET /: mes natural del calendario comunitario en formato YYYY-MM.
const getCalendarMonthQuerySchema = z.object({ month: z.string().trim().regex(MONTH_REGEX, 'El campo month debe tener formato YYYY-MM') }).strict();

// Body de POST /personal: datos completos para crear un evento personal del usuario.
const createPersonalCalendarEventSchema = z.object({
  title: requiredTextSchema('title', 160),
  startsAt: buildInstantFieldSchema('startsAt'),
  endsAt: buildInstantFieldSchema('endsAt')
}).strict();

// Body de PATCH /personal/:eventId: edición parcial de título y rango horario del evento.
const updatePersonalCalendarEventSchema = z.object({
  title: requiredTextSchema('title', 160).optional(),
  startsAt: buildInstantFieldSchema('startsAt').optional(),
  endsAt: buildInstantFieldSchema('endsAt').optional()
}).strict().refine((value) => Object.keys(value).length > 0, { message: 'Debes enviar al menos un campo editable del evento personal' });

module.exports = {
  communityIdParamSchema,
  personalCalendarEventParamsSchema,
  getCalendarMonthQuerySchema,
  createPersonalCalendarEventSchema,
  updatePersonalCalendarEventSchema
};