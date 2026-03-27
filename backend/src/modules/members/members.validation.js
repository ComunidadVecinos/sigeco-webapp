const { z } = require('zod');

// Validaciones HTTP del módulo members.

const { optionalCommentSchema } = require('../../lib/validation/communityFields');
const { positiveIntegerQuerySchema, optionalTrimmedStringSchema, optionalDateQuerySchema, uuidParamSchema } = require('../../lib/validation/requestFields');

const communityIdParamSchema = uuidParamSchema('communityId');
const communityMemberParamsSchema = uuidParamSchema('communityId', 'memberId');
const communityMemberRoleParamsSchema = uuidParamSchema('communityId', 'memberId').extend({ role: z.enum(['PRESIDENT', 'VICE_PRESIDENT']) });

const leaveCommunitySchema = z.object({ confirm: z.literal(true, { message: 'Debes confirmar la operación' }) });
const expelMemberSchema = z.object({ confirm: z.literal(true, { message: 'Debes confirmar la operación' }), reason: optionalCommentSchema });

const suspensionDateSchema = z
  .union([z.string(), z.date()])
  .transform((value) => new Date(value))
  .refine((value) => !Number.isNaN(value.getTime()), 'La fecha de suspensión debe ser válida')
  .refine((value) => value.getTime() > Date.now(), 'La fecha de suspensión debe ser posterior a la actual');

const suspendMemberSchema = z.object({ suspendedUntil: suspensionDateSchema, suspensionReason: optionalCommentSchema });

const DEFAULT_MEMBERS_PAGE = 1;
const DEFAULT_MEMBERS_PAGE_SIZE = 10;

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

module.exports = { communityIdParamSchema, communityMemberParamsSchema, communityMemberRoleParamsSchema, leaveCommunitySchema, expelMemberSchema, suspendMemberSchema, listCommunityMembersQuerySchema };
