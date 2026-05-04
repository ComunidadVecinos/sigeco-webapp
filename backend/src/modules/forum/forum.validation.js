// Validaciones de forum: filtran la entrada del foro antes de crear posts, comentarios o votos.
// Flujo cubierto: entrada Express -> schemas Zod -> datos listos para el servicio.
// Expone schemas de publicaciones, comentarios, encuestas, filtros y votos.
// Lo consumen las rutas antes de llegar a los controladores.
const { z } = require('zod');

const { dateOnlyStringToUtcDate, isValidDateOnlyString, isValidInstantString, parseInstantToUtcDate } = require('../../lib/datetime/businessTime');
const { requiredTextSchema } = require('../../lib/validation/communityFields');
const { positiveIntegerQuerySchema, uuidFieldSchema, uuidParamSchema } = require('../../lib/validation/requestFields');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const FORUM_CATEGORY_MAP = { announcement: 'ANNOUNCEMENT', request: 'REQUEST', question: 'QUESTION', poll: 'POLL' };
const FORUM_CATEGORY_VALUES = Object.keys(FORUM_CATEGORY_MAP);

// Normaliza strings opcionales para que `''` no se trate como dato real.
function normalizeOptionalString(value) {
  if (value === undefined) {
    return undefined;
  }
  const trimmedValue = String(value).trim();
  return trimmedValue === '' ? undefined : trimmedValue;
}

// Fecha de día completo usada para filtros de listado.
function buildDateFieldSchema(fieldName) {
  return z.string().trim()
    .regex(DATE_REGEX, `El campo ${fieldName} debe tener formato YYYY-MM-DD`)
    .refine((value) => isValidDateOnlyString(value), `El campo ${fieldName} debe ser una fecha válida`)
    .transform((value) => dateOnlyStringToUtcDate(value));
}

// Fecha opcional de rango, expresada como YYYY-MM-DD.
function buildOptionalDateFieldSchema(fieldName) {
  return z.union([z.string(), z.undefined()])
    .transform((value) => normalizeOptionalString(value))
    .refine((value) => value === undefined || DATE_REGEX.test(value), `El campo ${fieldName} debe tener formato YYYY-MM-DD`)
    .refine((value) => value === undefined || isValidDateOnlyString(value), `El campo ${fieldName} debe ser una fecha válida`)
    .transform((value) => (value === undefined ? undefined : dateOnlyStringToUtcDate(value)));
}

// Instante ISO opcional usado para el cierre programado de encuestas.
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

// Params para rutas colgadas directamente de una comunidad.
const communityIdParamSchema = uuidParamSchema('communityId');
// Params para rutas que operan sobre una publicación concreta.
const postParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), postId: uuidFieldSchema('postId') });
// Params para rutas que operan sobre un comentario concreto.
const commentParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), commentId: uuidFieldSchema('commentId') });
// Params para rutas que operan sobre una encuesta concreta.
const pollParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), pollId: uuidFieldSchema('pollId') });

// Opción individual de una encuesta creada dentro del foro.
const forumPollOptionSchema = z.object({ title: requiredTextSchema('title', 160) }).strict();

// Bloque poll que acompaña a las publicaciones de categoría encuesta.
const forumPollSchema = z.object({
  title: requiredTextSchema('poll.title', 160),
  description: requiredTextSchema('poll.description', 2000).optional(),
  endsAt: buildOptionalInstantFieldSchema('poll.endsAt'),
  options: z.array(forumPollOptionSchema).min(2, 'Debes enviar al menos 2 opciones').max(5, 'No puedes enviar más de 5 opciones')
}).strict();

// Body de POST /posts: publicación simple o encuesta, según la categoría.
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

// Query de GET /posts: filtros públicos del listado por paginación, orden, categoría y rango de fechas.
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

// Body de PATCH /posts/:postId: edición parcial del contenido de la publicación.
const updatePostSchema = z.object({
  title: requiredTextSchema('title', 160).optional(),
  description: requiredTextSchema('description', 2000).optional()
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Debes enviar al menos un campo editable de la publicación'
});

// Body de POST /posts/:postId/comments: alta de un comentario nuevo en el hilo.
const createCommentSchema = z.object({ content: requiredTextSchema('content', 2000) }).strict();

// Query de GET /posts/:postId/comments: paginación y orden del hilo de comentarios.
const listCommentsQuerySchema = z.object({
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 20 }),
  sortBy: z.enum(['createdAt', 'likes']).default('createdAt')
}).strict();

// Body de PATCH /comments/:commentId: edición completa del contenido del comentario.
const updateCommentSchema = z.object({ content: requiredTextSchema('content', 2000) }).strict();

// Body de POST /polls/:pollId/vote: opción elegida por el usuario en una encuesta.
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