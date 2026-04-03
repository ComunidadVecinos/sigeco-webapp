// Validaciones HTTP del módulo calendar.
// El contrato público usa UTC ISO para cualquier campo con hora.
const { z } = require('zod');

const { isValidInstantString, parseInstantToUtcDate } = require('../../lib/datetime/businessTime');
const { requiredTextSchema } = require('../../lib/validation/communityFields');
const { uuidFieldSchema, uuidParamSchema } = require('../../lib/validation/requestFields');

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function buildInstantFieldSchema(fieldName) {
  return z.string().trim()
    .refine((value) => isValidInstantString(value), `El campo ${fieldName} debe ser un instante ISO 8601 válido`)
    .transform((value) => parseInstantToUtcDate(value));
}

const communityIdParamSchema = uuidParamSchema('communityId');
const personalCalendarEventParamsSchema = z.object({
  communityId: uuidFieldSchema('communityId'),
  eventId: uuidFieldSchema('eventId')
});

const getCalendarMonthQuerySchema = z.object({
  month: z.string().trim().regex(MONTH_REGEX, 'El campo month debe tener formato YYYY-MM')
}).strict();

const createPersonalCalendarEventSchema = z.object({
  title: requiredTextSchema('title', 160),
  startsAt: buildInstantFieldSchema('startsAt'),
  endsAt: buildInstantFieldSchema('endsAt')
}).strict();

const updatePersonalCalendarEventSchema = z.object({
  title: requiredTextSchema('title', 160).optional(),
  startsAt: buildInstantFieldSchema('startsAt').optional(),
  endsAt: buildInstantFieldSchema('endsAt').optional()
}).strict()
  .refine((value) => Object.keys(value).length > 0, { message: 'Debes enviar al menos un campo editable del evento personal' });

module.exports = {
  communityIdParamSchema,
  personalCalendarEventParamsSchema,
  getCalendarMonthQuerySchema,
  createPersonalCalendarEventSchema,
  updatePersonalCalendarEventSchema
};