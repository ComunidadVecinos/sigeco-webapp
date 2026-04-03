// Validaciones HTTP del módulo news.
// El contrato público usa ISO UTC para los campos horarios y mantiene filtros por día de negocio en Europe/Madrid.
const { z } = require('zod');

const { ValidationError } = require('../../lib/errors');
const {
  dateOnlyStringToUtcDate,
  isValidDateOnlyString,
  isValidInstantString,
  parseInstantToUtcDate
} = require('../../lib/datetime/businessTime');
const { requiredTextSchema } = require('../../lib/validation/communityFields');
const {
  optionalTrimmedStringSchema,
  positiveIntegerQuerySchema,
  uuidFieldSchema,
  uuidParamSchema
} = require('../../lib/validation/requestFields');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function buildOptionalDateFieldSchema(fieldName) {
  return optionalTrimmedStringSchema
    .refine((value) => value === undefined || DATE_REGEX.test(value), `El campo ${fieldName} debe tener formato YYYY-MM-DD`)
    .refine((value) => value === undefined || isValidDateOnlyString(value), `El campo ${fieldName} debe ser una fecha válida`)
    .transform((value) => (value === undefined ? undefined : dateOnlyStringToUtcDate(value)));
}

function buildOptionalInstantFieldSchema(fieldName) {
  return z.union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === undefined || value === null) {
        return value;
      }

      const trimmedValue = String(value).trim();
      return trimmedValue === '' ? undefined : trimmedValue;
    })
    .refine((value) => value === undefined || value === null || isValidInstantString(value), `El campo ${fieldName} debe ser un instante ISO 8601 válido`)
    .transform((value) => {
      if (value === undefined || value === null) {
        return value;
      }
      return parseInstantToUtcDate(value);
    });
}

function buildValidationDetail(field, message, location = 'body') {
  return { field, location, message };
}

function validateNewsEventPair(value) {
  if (value.eventEndsAt && !value.eventStartsAt) {
    return false;
  }
  if (value.eventStartsAt && value.eventEndsAt && value.eventEndsAt <= value.eventStartsAt) {
    return false;
  }
  return true;
}

const communityIdParamSchema = uuidParamSchema('communityId');
const newsParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), newsId: uuidFieldSchema('newsId') });

const createNewsSchema = z.object({
  title: requiredTextSchema('title', 160),
  description: requiredTextSchema('description', 4000),
  eventStartsAt: buildOptionalInstantFieldSchema('eventStartsAt'),
  eventEndsAt: buildOptionalInstantFieldSchema('eventEndsAt')
})
  .strict()
  .refine((value) => validateNewsEventPair(value), { message: 'El rango del evento no es válido', path: ['eventEndsAt'] });

const updateNewsSchema = z.object({
  title: requiredTextSchema('title', 160).optional(),
  description: requiredTextSchema('description', 4000).optional(),
  eventStartsAt: buildOptionalInstantFieldSchema('eventStartsAt'),
  eventEndsAt: buildOptionalInstantFieldSchema('eventEndsAt')
})
  .strict()
  .refine((value) => validateNewsEventPair(value), { message: 'El rango del evento no es válido', path: ['eventEndsAt'] });

const listNewsQuerySchema = z.object({
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 10 }),
  search: optionalTrimmedStringSchema,
  from: buildOptionalDateFieldSchema('from'),
  to: buildOptionalDateFieldSchema('to'),
  eventType: z.enum(['all', 'event', 'nonEvent']).default('all')
})
  .strict()
  .refine((value) => !value.from || !value.to || value.from <= value.to, { message: 'El rango de fechas no es válido', path: ['from'] });

function normalizeMultipartNewsBody(req, res, next) {
  if (!req.is('multipart/form-data')) {
    return next();
  }

  const body = req.body || {};
  const allowedFields = ['title', 'description', 'eventStartsAt', 'eventEndsAt'];
  const unexpectedFields = Object.keys(body).filter((field) => !allowedFields.includes(field));

  if (unexpectedFields.length > 0) {
    return next(new ValidationError(unexpectedFields.map((field) => buildValidationDetail(field, 'El campo no está permitido'))));
  }

  const normalizedBody = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      const rawValue = body[field];

      if ((field === 'eventStartsAt' || field === 'eventEndsAt') && typeof rawValue === 'string' && rawValue.trim().toLowerCase() === 'null') {
        normalizedBody[field] = null;
        continue;
      }
      normalizedBody[field] = rawValue;
    }
  }
  req.body = normalizedBody;
  return next();
}

function ensureUpdateNewsHasChanges(req, res, next) {
  if (Object.keys(req.body || {}).length > 0 || req.file) {
    return next();
  }
  return next(
    new ValidationError([buildValidationDetail('body', 'Debes enviar al menos un campo editable de la noticia')]));
}

module.exports = {
  communityIdParamSchema,
  newsParamsSchema,
  createNewsSchema,
  updateNewsSchema,
  listNewsQuerySchema,
  normalizeCreateNewsMultipartBody: normalizeMultipartNewsBody,
  normalizeUpdateNewsMultipartBody: normalizeMultipartNewsBody,
  ensureUpdateNewsHasChanges
};