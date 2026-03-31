// Validaciones HTTP del módulo voting.
const { z } = require('zod');

const { optionalCommentSchema, requiredTextSchema } = require('../../lib/validation/communityFields');
const { positiveIntegerQuerySchema, uuidFieldSchema, uuidParamSchema } = require('../../lib/validation/requestFields');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function isValidDateOnly(value) {
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
}

function buildDateFieldSchema(fieldName) {
  return z.string().trim()
    .regex(DATE_REGEX, `El campo ${fieldName} debe tener formato YYYY-MM-DD`)
    .refine((value) => isValidDateOnly(value), `El campo ${fieldName} debe ser una fecha válida`)
    .transform((value) => new Date(`${value}T00:00:00.000Z`));
}

function buildTimeFieldSchema(fieldName) {
  return z.string().trim().regex(TIME_REGEX, `El campo ${fieldName} debe tener formato HH:mm`);
}

const votingOptionSchema = z.object({ title: requiredTextSchema('title', 160) }).strict();
const communityIdParamSchema = uuidParamSchema('communityId');
const votingParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), votingId: uuidFieldSchema('votingId') });

const createVotingSchema = z.object({
  title: requiredTextSchema('title', 160),
  description: optionalCommentSchema,
  endDate: buildDateFieldSchema('endDate'),
  endTime: buildTimeFieldSchema('endTime'),
  options: z.array(votingOptionSchema).min(2, 'Debes enviar al menos 2 opciones').max(5, 'No puedes enviar más de 5 opciones')
}).strict();

const listVotingQuerySchema = z.object({
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 8 }),
  status: z.enum(['open', 'closed']).optional()
}).strict();

const voteOnVotingSchema = z.object({ optionId: uuidFieldSchema('optionId') }).strict();

module.exports = { communityIdParamSchema, votingParamsSchema, createVotingSchema, listVotingQuerySchema, voteOnVotingSchema };