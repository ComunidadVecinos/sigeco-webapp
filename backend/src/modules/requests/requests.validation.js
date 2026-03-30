const { z } = require('zod');

// Validaciones HTTP del módulo requests.

const { addressSchema, accessCodeSchema, optionalAddressDetailSchema, optionalCommentSchema, requiredTextSchema } = require('../../lib/validation/communityFields');
const { positiveIntegerQuerySchema, uuidFieldSchema, uuidParamSchema } = require('../../lib/validation/requestFields');

const requestDetailsFields = {
  proposedAlias: requiredTextSchema('proposedAlias', 120),
  country: addressSchema.shape.country,
  province: addressSchema.shape.province,
  municipality: addressSchema.shape.municipality,
  streetType: addressSchema.shape.streetType,
  streetName: addressSchema.shape.streetName,
  postalCode: addressSchema.shape.postalCode,
  streetNumberKm: addressSchema.shape.streetNumberKm,
  block: optionalAddressDetailSchema,
  floor: optionalAddressDetailSchema,
  door: optionalAddressDetailSchema,
  requestComment: optionalCommentSchema
};

const joinRequestSchema = z.object({ type: z.literal('JOIN'), accessCode: accessCodeSchema, ...requestDetailsFields });
const updateInfoRequestSchema = z.object({ type: z.literal('UPDATE_INFO'), communityId: uuidFieldSchema('communityId'), ...requestDetailsFields });

const createRequestSchema = z.discriminatedUnion('type', [joinRequestSchema, updateInfoRequestSchema]);
const requestIdParamSchema = uuidParamSchema('requestId');
const resolveRequestBodySchema = z.object({ resolutionMessage: optionalCommentSchema });

const listCommunityRequestsQuerySchema = z.object({
  communityId: uuidFieldSchema('communityId'),
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 10 }),
  type: z.enum(['JOIN', 'UPDATE_INFO']).optional()
});

module.exports = { createRequestSchema, requestIdParamSchema, resolveRequestBodySchema, listCommunityRequestsQuerySchema };