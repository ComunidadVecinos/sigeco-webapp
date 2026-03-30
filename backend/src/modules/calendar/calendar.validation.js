// Validaciones HTTP del modulo calendar.
// El contrato trabaja con fecha (YYYY-MM-DD) y horas (HH:mm) para evitar
// ambigüedad de zona horaria en la vista mensual y en el CRUD de eventos personales.
const { z } = require('zod');

const { requiredTextSchema } = require('../../lib/validation/communityFields');
const { uuidFieldSchema, uuidParamSchema } = require('../../lib/validation/requestFields');

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value) {
  // Se valida contra una fecha UTC canonica para aceptar solo dias reales del calendario.
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
}

function buildDateFieldSchema(fieldName) {
  return z.string().trim()
    .regex(DATE_REGEX, `El campo ${fieldName} debe tener formato YYYY-MM-DD`)
    .refine((value) => isValidDateOnly(value), `El campo ${fieldName} debe ser una fecha válida`)
    // El service y el repository operan ya con un Date normalizado a medianoche UTC.
    .transform((value) => new Date(`${value}T00:00:00.000Z`));
}

function buildTimeFieldSchema(fieldName) {
  return z.string().trim().regex(TIME_REGEX, `El campo ${fieldName} debe tener formato HH:mm`);
}

const communityIdParamSchema = uuidParamSchema('communityId');
const personalCalendarEventParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), eventId: uuidFieldSchema('eventId') });

const getCalendarMonthQuerySchema = z.object({
  month: z.string().trim().regex(MONTH_REGEX, 'El campo month debe tener formato YYYY-MM')
}).strict();

const createPersonalCalendarEventSchema = z.object({
  title: requiredTextSchema('title', 160),
  date: buildDateFieldSchema('date'),
  startTime: buildTimeFieldSchema('startTime'),
  endTime: buildTimeFieldSchema('endTime')
}).strict().refine((value) => value.startTime < value.endTime, {
  message: 'La hora de inicio debe ser anterior a la hora de fin',
  path: ['startTime']
});

const updatePersonalCalendarEventSchema = z.object({
  title: requiredTextSchema('title', 160).optional(),
  date: buildDateFieldSchema('date').optional(),
  startTime: buildTimeFieldSchema('startTime').optional(),
  endTime: buildTimeFieldSchema('endTime').optional()
}).strict()
  // PATCH acepta cualquier subconjunto editable, pero no un body vacio.
  .refine((value) => Object.keys(value).length > 0, { message: 'Debes enviar al menos un campo editable del evento personal' })
  .refine((value) => !value.startTime || !value.endTime || value.startTime < value.endTime, {
    message: 'La hora de inicio debe ser anterior a la hora de fin',
    path: ['startTime']
  });

module.exports = {
  communityIdParamSchema,
  personalCalendarEventParamsSchema,
  getCalendarMonthQuerySchema,
  createPersonalCalendarEventSchema,
  updatePersonalCalendarEventSchema
};
