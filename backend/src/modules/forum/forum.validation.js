// Validaciones HTTP del módulo forum.
const { z } = require('zod');

const { dateOnlyStringToUtcDate, isValidDateOnlyString, isValidInstantString, parseInstantToUtcDate } = require('../../lib/datetime/businessTime');
const { requiredTextSchema } = require('../../lib/validation/communityFields');
const { positiveIntegerQuerySchema, uuidFieldSchema, uuidParamSchema } = require('../../lib/validation/requestFields');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const FORUM_CATEGORY_MAP = { announcement: 'ANNOUNCEMENT', request: 'REQUEST', question: 'QUESTION', poll: 'POLL' };
const FORUM_CATEGORY_VALUES = Object.keys(FORUM_CATEGORY_MAP);

function normalizeOptionalString(value) {
  if (value === undefined) {
    return undefined;
  }

  const trimmedValue = String(value).trim();
  return trimmedValue === '' ? undefined : trimmedValue;
}

function buildDateFieldSchema(fieldName) {
  return z.string().trim()
    .regex(DATE_REGEX, `El campo ${fieldName} debe tener formato YYYY-MM-DD`)
    .refine((value) => isValidDateOnlyString(value), `El campo ${fieldName} debe ser una fecha válida`)
    .transform((value) => dateOnlyStringToUtcDate(value));
}

function buildOptionalDateFieldSchema(fieldName) {
  return z.union([z.string(), z.undefined()])
    .transform((value) => normalizeOptionalString(value))
    .refine((value) => value === undefined || DATE_REGEX.test(value), `El campo ${fieldName} debe tener formato YYYY-MM-DD`)
    .refine((value) => value === undefined || isValidDateOnlyString(value), `El campo ${fieldName} debe ser una fecha válida`)
    .transform((value) => (value === undefined ? undefined : dateOnlyStringToUtcDate(value)));
}

function buildOptionalInstantFieldSchema(fieldName) {
  return z.union([z.string(), z.undefined()])
    .transform((value) => normalizeOptionalString(value))
    .refine((value) => value === undefined || isValidInstantString(value), `El campo ${fieldName} debe ser un instante ISO 8601 válido`)
    .transform((value) => (value === undefined ? undefined : parseInstantToUtcDate(value)));
}

function mapForumCategory(value) {
  return FORUM_CATEGORY_MAP[value];
}

const forumCategorySchema = z.enum(FORUM_CATEGORY_VALUES).transform((value) => mapForumCategory(value));

const communityIdParamSchema = uuidParamSchema('communityId');
const postParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), postId: uuidFieldSchema('postId') });
const commentParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), commentId: uuidFieldSchema('commentId') });
const pollParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), pollId: uuidFieldSchema('pollId') });

const forumPollOptionSchema = z.object({ title: requiredTextSchema('title', 160) }).strict();

const forumPollSchema = z.object({
  title: requiredTextSchema('poll.title', 160),
  description: requiredTextSchema('poll.description', 2000).optional(),
  endsAt: buildOptionalInstantFieldSchema('poll.endsAt'),
  options: z.array(forumPollOptionSchema).min(2, 'Debes enviar al menos 2 opciones').max(5, 'No puedes enviar más de 5 opciones')
}).strict();

const createPostSchema = z.object({
  title: requiredTextSchema('title', 160),
  description: requiredTextSchema('description', 2000),
  category: forumCategorySchema,
  poll: forumPollSchema.optional()
}).strict()
  .refine((value) => value.category !== 'POLL' || Boolean(value.poll), {
    message: 'Las publicaciones de tipo encuesta requieren el bloque poll',
    path: ['poll']
  })
  .refine((value) => value.category === 'POLL' || value.poll === undefined, {
    message: 'Solo las publicaciones de tipo encuesta pueden incluir poll',
    path: ['poll']
  });

const listPostsQuerySchema = z.object({
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 20 }),
  sortBy: z.enum(['createdAt', 'likes', 'lastActivityAt']).default('createdAt'),
  category: z.enum(FORUM_CATEGORY_VALUES).optional().transform((value) => (value ? mapForumCategory(value) : undefined)),
  from: buildOptionalDateFieldSchema('from'),
  to: buildOptionalDateFieldSchema('to')
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: 'El rango de fechas no es válido',
  path: ['from']
});

const updatePostSchema = z.object({
  title: requiredTextSchema('title', 160).optional(),
  description: requiredTextSchema('description', 2000).optional()
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Debes enviar al menos un campo editable de la publicación'
});

const createCommentSchema = z.object({ content: requiredTextSchema('content', 2000) }).strict();

const listCommentsQuerySchema = z.object({
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 20 }),
  sortBy: z.enum(['createdAt', 'likes']).default('createdAt')
}).strict();

const updateCommentSchema = z.object({ content: requiredTextSchema('content', 2000) }).strict();
const voteOnPollSchema = z.object({ optionId: uuidFieldSchema('optionId') }).strict();

module.exports = {
  communityIdParamSchema,
  postParamsSchema,
  commentParamsSchema,
  pollParamsSchema,
  createPostSchema,
  listPostsQuerySchema,
  updatePostSchema,
  createCommentSchema,
  listCommentsQuerySchema,
  updateCommentSchema,
  voteOnPollSchema
};