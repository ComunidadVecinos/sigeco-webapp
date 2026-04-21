// Validaciones HTTP del módulo reservations.
// Combina fechas de negocio (YYYY-MM-DD / YYYY-MM) con horas simples HH:mm y reglas compactas para el CRUD.
const { z } = require('zod');

const { dateOnlyStringToUtcDate, isValidDateOnlyString } = require('../../lib/datetime/businessTime');
const { optionalCommentSchema, requiredTextSchema } = require('../../lib/validation/communityFields');
const {
  optionalTrimmedStringSchema,
  positiveIntegerQuerySchema,
  uuidFieldSchema,
  uuidParamSchema
} = require('../../lib/validation/requestFields');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const COLOR_HEX_REGEX = /^#[0-9A-F]{6}$/;

function optionalUuidSchema(fieldName) {
  return optionalTrimmedStringSchema.refine((value) => value === undefined || z.string().uuid().safeParse(value).success, `El campo ${fieldName} debe ser un UUID válido`);
}

function positiveIntegerFieldSchema(fieldName, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  return z.number()
    .int(`El campo ${fieldName} debe ser un número entero`)
    .min(min, `El campo ${fieldName} debe ser como mínimo ${min}`)
    .max(max, `El campo ${fieldName} debe ser como máximo ${max}`);
}

function buildDateFieldSchema(fieldName) {
  return z.string().trim()
    .regex(DATE_REGEX, `El campo ${fieldName} debe tener formato YYYY-MM-DD`)
    .refine((value) => isValidDateOnlyString(value), `El campo ${fieldName} debe ser una fecha válida`)
    .transform((value) => dateOnlyStringToUtcDate(value));
}

function buildOptionalDateFieldSchema(fieldName) {
  return optionalTrimmedStringSchema
    .refine((value) => value === undefined || DATE_REGEX.test(value), `El campo ${fieldName} debe tener formato YYYY-MM-DD`)
    .refine((value) => value === undefined || isValidDateOnlyString(value), `El campo ${fieldName} debe ser una fecha válida`)
    .transform((value) => (value === undefined ? undefined : dateOnlyStringToUtcDate(value)));
}

function buildMonthFieldSchema(fieldName) {
  return z.string().trim().regex(MONTH_REGEX, `El campo ${fieldName} debe tener formato YYYY-MM`);
}

function buildTimeFieldSchema(fieldName) {
  return z.string().trim().regex(TIME_REGEX, `El campo ${fieldName} debe tener formato HH:mm`);
}

function buildColorHexSchema(fieldName) {
  return z.string().trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => COLOR_HEX_REGEX.test(value), `El campo ${fieldName} debe ser un color hexadecimal válido`);
}

const allowedDaysCreateSchema = z.object({
  monday: z.boolean(),
  tuesday: z.boolean(),
  wednesday: z.boolean(),
  thursday: z.boolean(),
  friday: z.boolean(),
  saturday: z.boolean(),
  sunday: z.boolean()
}).strict();

const allowedDaysUpdateSchema = z.object({
  monday: z.boolean().optional(),
  tuesday: z.boolean().optional(),
  wednesday: z.boolean().optional(),
  thursday: z.boolean().optional(),
  friday: z.boolean().optional(),
  saturday: z.boolean().optional(),
  sunday: z.boolean().optional()
}).strict().refine((value) => Object.keys(value).length > 0, { message: 'Debes enviar al menos un día editable', path: ['allowedDays'] });

const communityIdParamSchema = uuidParamSchema('communityId');
const spaceParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), spaceId: uuidFieldSchema('spaceId') });
const bookingParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), bookingId: uuidFieldSchema('bookingId') });

const createSpaceSchema = z.object({
  name: requiredTextSchema('name', 160),
  description: optionalCommentSchema,
  colorHex: buildColorHexSchema('colorHex'),
  isActive: z.boolean().default(true),
  totalCapacity: positiveIntegerFieldSchema('totalCapacity'),
  occupancyMode: z.enum(['EXCLUSIVE', 'SHARED']),
  maxSeatsPerBooking: positiveIntegerFieldSchema('maxSeatsPerBooking').optional(),
  openingTime: buildTimeFieldSchema('openingTime'),
  closingTime: buildTimeFieldSchema('closingTime'),
  slotMinutes: positiveIntegerFieldSchema('slotMinutes'),
  allowedDays: allowedDaysCreateSchema,
  maxConsecutiveSlots: positiveIntegerFieldSchema('maxConsecutiveSlots').default(1),
  minAdvanceMinutes: positiveIntegerFieldSchema('minAdvanceMinutes').default(60),
  maxAdvanceDays: positiveIntegerFieldSchema('maxAdvanceDays').default(30),
  cancellationNoticeMinutes: positiveIntegerFieldSchema('cancellationNoticeMinutes').default(120)
}).strict();

const updateSpaceSchema = z.object({
  name: requiredTextSchema('name', 160).optional(),
  description: z.union([optionalCommentSchema, z.null()]).optional(),
  colorHex: buildColorHexSchema('colorHex').optional(),
  totalCapacity: positiveIntegerFieldSchema('totalCapacity').optional(),
  occupancyMode: z.enum(['EXCLUSIVE', 'SHARED']).optional(),
  maxSeatsPerBooking: z.union([positiveIntegerFieldSchema('maxSeatsPerBooking'), z.null()]).optional(),
  openingTime: buildTimeFieldSchema('openingTime').optional(),
  closingTime: buildTimeFieldSchema('closingTime').optional(),
  slotMinutes: positiveIntegerFieldSchema('slotMinutes').optional(),
  allowedDays: allowedDaysUpdateSchema.optional(),
  maxConsecutiveSlots: positiveIntegerFieldSchema('maxConsecutiveSlots').optional(),
  minAdvanceMinutes: positiveIntegerFieldSchema('minAdvanceMinutes').optional(),
  maxAdvanceDays: positiveIntegerFieldSchema('maxAdvanceDays').optional(),
  cancellationNoticeMinutes: positiveIntegerFieldSchema('cancellationNoticeMinutes').optional()
}).strict().refine((value) => Object.keys(value).length > 0, { message: 'Debes enviar al menos un campo editable del espacio' });

const updateSpaceStatusSchema = z.object({ isActive: z.boolean() }).strict();

const listSpacesQuerySchema = z.object({
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 10 }),
  search: optionalTrimmedStringSchema,
  status: z.enum(['active', 'inactive', 'all']).default('active')
}).strict();

const availabilityQuerySchema = z.object({ date: buildDateFieldSchema('date') }).strict();
const spaceCalendarQuerySchema = z.object({ month: buildMonthFieldSchema('month') }).strict();

const createBookingSchema = z.object({
  spaceId: uuidFieldSchema('spaceId'),
  date: buildDateFieldSchema('date'),
  startTime: buildTimeFieldSchema('startTime'),
  slotCount: positiveIntegerFieldSchema('slotCount'),
  requestedSeats: positiveIntegerFieldSchema('requestedSeats').default(1)
}).strict();

const listMyBookingsQuerySchema = z.object({
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 10 }),
  scope: z.enum(['upcoming', 'past', 'cancelled', 'all']).default('upcoming'),
  spaceId: optionalUuidSchema('spaceId')
}).strict();

const listBookingsQuerySchema = z.object({
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 10 }),
  status: z.enum(['active', 'cancelled', 'all']).default('active'),
  spaceId: optionalUuidSchema('spaceId'),
  from: buildOptionalDateFieldSchema('from'),
  to: buildOptionalDateFieldSchema('to')
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: 'El rango de fechas no es válido',
  path: ['from']
});

const cancelBookingSchema = z.object({ reason: optionalCommentSchema }).strict().default({});

function normalizeNullableSpaceBody(req, res, next) {
  if (!req.is('application/json')) {
    return next();
  }
  const body = req.body || {};
  const normalizedBody = { ...body };
  for (const field of ['description', 'maxSeatsPerBooking']) {
    if (typeof normalizedBody[field] === 'string' && normalizedBody[field].trim().toLowerCase() === 'null') {
      normalizedBody[field] = null;
    }
  }
  req.body = normalizedBody;
  return next();
}

module.exports = {
  communityIdParamSchema,
  spaceParamsSchema,
  bookingParamsSchema,
  createSpaceSchema,
  updateSpaceSchema,
  updateSpaceStatusSchema,
  listSpacesQuerySchema,
  availabilityQuerySchema,
  spaceCalendarQuerySchema,
  createBookingSchema,
  listMyBookingsQuerySchema,
  listBookingsQuerySchema,
  cancelBookingSchema,
  normalizeNullableSpaceBody
};