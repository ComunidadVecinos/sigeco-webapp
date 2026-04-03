// Validaciones HTTP del módulo voting.
const { z } = require('zod');

const { isValidInstantString, parseInstantToUtcDate } = require('../../lib/datetime/businessTime');
const { optionalCommentSchema, requiredTextSchema } = require('../../lib/validation/communityFields');
const { positiveIntegerQuerySchema, uuidFieldSchema, uuidParamSchema } = require('../../lib/validation/requestFields');

function buildInstantFieldSchema(fieldName) {
  return z.string().trim()
    .refine((value) => isValidInstantString(value), `El campo ${fieldName} debe ser un instante ISO 8601 válido`)
    .transform((value) => parseInstantToUtcDate(value));
}

const votingOptionSchema = z.object({ title: requiredTextSchema('title', 160) }).strict();
const communityIdParamSchema = uuidParamSchema('communityId');
const votingParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), votingId: uuidFieldSchema('votingId') });

const createVotingSchema = z.object({
  title: requiredTextSchema('title', 160),
  description: optionalCommentSchema,
  endsAt: buildInstantFieldSchema('endsAt'),
  options: z.array(votingOptionSchema).min(2, 'Debes enviar al menos 2 opciones').max(5, 'No puedes enviar más de 5 opciones')
}).strict();

const listVotingQuerySchema = z.object({
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 8 }),
  status: z.enum(['open', 'closed']).optional()
}).strict();

const voteOnVotingSchema = z.object({ optionId: uuidFieldSchema('optionId') }).strict();

module.exports = { communityIdParamSchema, votingParamsSchema, createVotingSchema, listVotingQuerySchema, voteOnVotingSchema };