// Validaciones HTTP del módulo reservations: normaliza y valida params, query y body.
// Flujo cubierto: entrada Express -> schemas Zod -> datos listos para el servicio.
// Expone schemas de espacios/reservas y normalizeNullableSpaceBody.
// Lo consumen las rutas antes de llegar a los controladores.
const { z } = require('zod');

const { dateOnlyStringToUtcDate, isValidDateOnlyString } = require('../../lib/datetime/businessTime');
const { optionalCommentSchema, requiredTextSchema } = require('../../lib/validation/communityFields');
const { optionalTrimmedStringSchema, positiveIntegerQuerySchema, uuidFieldSchema, uuidParamSchema } = require('../../lib/validation/requestFields');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const COLOR_HEX_REGEX = /^#[0-9A-F]{6}$/;

// Valida filtros opcionales por UUID, usado en queries con "spaceId".
function optionalUuidSchema(fieldName) {
  return optionalTrimmedStringSchema.refine((value) => value === undefined || z.string().uuid().safeParse(value).success, `El campo ${fieldName} debe ser un UUID válido`);
}

// Valida números enteros positivos de bodies; las queries usan positiveIntegerQuerySchema.
function positiveIntegerFieldSchema(fieldName, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  return z.number().int(`El campo ${fieldName} debe ser un número entero`).min(min, `El campo ${fieldName} debe ser como mínimo ${min}`).max(max, `El campo ${fieldName} debe ser como máximo ${max}`);
}

// Valida fechas de día completo y las convierte a Date UTC para el servicio.
function buildDateFieldSchema(fieldName) {
  return z.string().trim()
    .regex(DATE_REGEX, `El campo ${fieldName} debe tener formato YYYY-MM-DD`)
    .refine((value) => isValidDateOnlyString(value), `El campo ${fieldName} debe ser una fecha válida`)
    .transform((value) => dateOnlyStringToUtcDate(value));
}

// Valida rangos de fechas opcionales en consultas administrativas.
function buildOptionalDateFieldSchema(fieldName) {
  return optionalTrimmedStringSchema
    .refine((value) => value === undefined || DATE_REGEX.test(value), `El campo ${fieldName} debe tener formato YYYY-MM-DD`)
    .refine((value) => value === undefined || isValidDateOnlyString(value), `El campo ${fieldName} debe ser una fecha válida`)
    .transform((value) => (value === undefined ? undefined : dateOnlyStringToUtcDate(value)));
}

// Valida meses de calendario como YYYY-MM.
function buildMonthFieldSchema(fieldName) {
  return z.string().trim().regex(MONTH_REGEX, `El campo ${fieldName} debe tener formato YYYY-MM`);
}

// Valida horas de franja en formato HH:mm.
function buildTimeFieldSchema(fieldName) {
  return z.string().trim().regex(TIME_REGEX, `El campo ${fieldName} debe tener formato HH:mm`);
}

// Valida y normaliza colores de espacios a hexadecimal en mayúsculas.
function buildColorHexSchema(fieldName) {
  return z.string().trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => COLOR_HEX_REGEX.test(value), `El campo ${fieldName} debe ser un color hexadecimal válido`);
}

// Días obligatorios al crear un espacio: el servicio comprobará que al menos uno quede activo.
const allowedDaysCreateSchema = z.object({
  monday: z.boolean(),
  tuesday: z.boolean(),
  wednesday: z.boolean(),
  thursday: z.boolean(),
  friday: z.boolean(),
  saturday: z.boolean(),
  sunday: z.boolean()
}).strict();

// Días parciales al editar un espacio: solo obliga a que el objeto enviado no esté vacío.
const allowedDaysUpdateSchema = z.object({
  monday: z.boolean().optional(),
  tuesday: z.boolean().optional(),
  wednesday: z.boolean().optional(),
  thursday: z.boolean().optional(),
  friday: z.boolean().optional(),
  saturday: z.boolean().optional(),
  sunday: z.boolean().optional()
}).strict().refine((value) => Object.keys(value).length > 0, { message: 'Debes enviar al menos un día editable', path: ['allowedDays'] });

// Params para rutas colgadas directamente de una comunidad.
const communityIdParamSchema = uuidParamSchema('communityId');
// Params para rutas que trabajan sobre un espacio concreto.
const spaceParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), spaceId: uuidFieldSchema('spaceId') });
// Params para rutas que trabajan sobre una reserva concreta.
const bookingParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), bookingId: uuidFieldSchema('bookingId') });

// Body de POST /spaces: datos completos para crear un espacio reservable.
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
  minAdvanceMinutes: positiveIntegerFieldSchema('minAdvanceMinutes', { min: 0 }).default(60),
  maxAdvanceDays: positiveIntegerFieldSchema('maxAdvanceDays').default(30),
  cancellationNoticeMinutes: positiveIntegerFieldSchema('cancellationNoticeMinutes', { min: 0 }).default(120)
}).strict();

// Body de PATCH /spaces/:spaceId: edición parcial de la configuración del espacio.
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
  minAdvanceMinutes: positiveIntegerFieldSchema('minAdvanceMinutes', { min: 0 }).optional(),
  maxAdvanceDays: positiveIntegerFieldSchema('maxAdvanceDays').optional(),
  cancellationNoticeMinutes: positiveIntegerFieldSchema('cancellationNoticeMinutes', { min: 0 }).optional()
}).strict().refine((value) => Object.keys(value).length > 0, { message: 'Debes enviar al menos un campo editable del espacio' });

// Body de PATCH /spaces/:spaceId/status: activa o desactiva un espacio.
const updateSpaceStatusSchema = z.object({ isActive: z.boolean() }).strict();

// Query de GET /spaces: paginación, búsqueda y estado visible.
const listSpacesQuerySchema = z.object({
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 10 }),
  search: optionalTrimmedStringSchema,
  status: z.enum(['active', 'inactive', 'all']).default('active')
}).strict();

// Query de GET /spaces/:spaceId/availability: día para calcular franjas disponibles.
const availabilityQuerySchema = z.object({ date: buildDateFieldSchema('date') }).strict();

// Query de GET /spaces/:spaceId/calendar: mes cuyo calendario de reservas se consulta.
const spaceCalendarQuerySchema = z.object({ month: buildMonthFieldSchema('month') }).strict();

// Body de POST /bookings: petición de reserva para un espacio, día, hora y plazas.
const createBookingSchema = z.object({
  spaceId: uuidFieldSchema('spaceId'),
  date: buildDateFieldSchema('date'),
  startTime: buildTimeFieldSchema('startTime'),
  slotCount: positiveIntegerFieldSchema('slotCount'),
  requestedSeats: positiveIntegerFieldSchema('requestedSeats').default(1)
}).strict();

// Query de GET /bookings/me: reservas del usuario, filtradas por alcance y espacio opcional.
const listMyBookingsQuerySchema = z.object({
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 10 }),
  scope: z.enum(['upcoming', 'past', 'cancelled', 'all']).default('upcoming'),
  spaceId: optionalUuidSchema('spaceId')
}).strict();

// Query de GET /bookings admin: listado global por estado, espacio y rango de fechas.
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

// Body de POST /bookings/:bookingId/cancel: motivo opcional de cancelación.
const cancelBookingSchema = z.object({ reason: optionalCommentSchema }).strict().default({});

// Algunos clientes envían "null" como texto en formularios JSON; aquí se conserva el contrato aceptando ambos formatos.
function normalizeNullableSpaceBody(req, res, next) {
  if (!req.is('application/json')) {
    return next();
  }

  const normalizedBody = { ...(req.body || {}) };
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