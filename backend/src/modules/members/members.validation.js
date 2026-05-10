const { z } = require('zod');

// Validaciones de members: preparan filtros y acciones sobre miembros sin cargar de ruido al servicio.
// Flujo cubierto: entrada Express -> schemas Zod -> datos listos para el servicio.
// Expone schemas de listado, salida, expulsión, roles y suspensión.
// Lo consumen las rutas antes de llegar a los controladores.
const { optionalCommentSchema } = require('../../lib/validation/communityFields');
const { positiveIntegerQuerySchema, optionalTrimmedStringSchema, optionalDateQuerySchema, uuidParamSchema } = require('../../lib/validation/requestFields');

// Params para rutas que trabajan solo con una comunidad.
const communityIdParamSchema = uuidParamSchema('communityId');

// Params para rutas que operan sobre un miembro concreto de una comunidad.
const communityMemberParamsSchema = uuidParamSchema('communityId', 'memberId');

// Params de PUT /:memberId/roles/:role: restringe la reasignación a los roles válidos del sistema.
const communityMemberRoleParamsSchema = uuidParamSchema('communityId', 'memberId').extend({ role: z.enum(['PRESIDENT', 'VICE_PRESIDENT', 'MEMBER']) });

// Body de POST /me/leave: confirmación mínima para abandonar la comunidad.
const leaveCommunitySchema = z.object({ confirm: z.literal(true, { message: 'Debes confirmar la operación' }) });

// Body de POST /:memberId/expel: confirmación y motivo opcional para expulsión administrativa.
const expelMemberSchema = z.object({ confirm: z.literal(true, { message: 'Debes confirmar la operación' }), reason: optionalCommentSchema });

// Fecha de suspensión futura; el servicio se apoya en este dato como fuente única del bloqueo temporal.
const suspensionDateSchema = z
  .union([z.string(), z.date()])
  .transform((value) => new Date(value))
  .refine((value) => !Number.isNaN(value.getTime()), 'La fecha de suspensión debe ser válida')
  .refine((value) => value.getTime() > Date.now(), 'La fecha de suspensión debe ser posterior a la actual');

// Body de PUT /:memberId/suspension: suspensión temporal con fecha de fin y motivo opcional.
const suspendMemberSchema = z.object({ suspendedUntil: suspensionDateSchema, suspensionReason: optionalCommentSchema });

const DEFAULT_MEMBERS_PAGE = 1;
const DEFAULT_MEMBERS_PAGE_SIZE = 10;

// Query de GET /: filtros de listado administrativo por texto, fechas de alta y estado de suspensión.
const listCommunityMembersQuerySchema = z
  .object({
    page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: DEFAULT_MEMBERS_PAGE }),
    pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: DEFAULT_MEMBERS_PAGE_SIZE }),
    q: optionalTrimmedStringSchema,
    joinedBefore: optionalDateQuerySchema('joinedBefore'),
    joinedAfter: optionalDateQuerySchema('joinedAfter'),
    suspensionStatus: z.enum(['ACTIVE', 'INACTIVE']).optional()
  })
  .refine(
    (value) => !value.joinedAfter || !value.joinedBefore || value.joinedAfter.getTime() <= value.joinedBefore.getTime(),
    { message: 'La fecha inicial no puede ser posterior a la fecha final', path: ['joinedAfter'] }
  );

module.exports = {
  communityIdParamSchema,
  communityMemberParamsSchema,
  communityMemberRoleParamsSchema,
  leaveCommunitySchema,
  expelMemberSchema,
  suspendMemberSchema,
  listCommunityMembersQuerySchema
};