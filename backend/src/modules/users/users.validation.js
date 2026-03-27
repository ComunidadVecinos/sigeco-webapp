const { z } = require('zod');

// Validaciones HTTP del módulo users.
const { ValidationError, errorCodes } = require('../../lib/errors');
const { uuidFieldSchema } = require('../../lib/validation/requestFields');
const { personNameSchema, ucmEmailSchema, optionalPhoneSchema } = require('../../lib/validation/userFields');

const updateMyProfileSchema = z.object({
  firstName: personNameSchema('firstName'),
  lastName: personNameSchema('lastName'),
  email: ucmEmailSchema,
  phone: optionalPhoneSchema
});

const deleteMyAccountSchema = z.object({
  email: z.string().trim().email('El correo electrónico debe ser válido').transform((value) => value.toLowerCase()),
  confirmationText: z.string().trim().min(1, 'El texto de confirmación es obligatorio')
});

const changeActiveCommunitySchema = z.object({ communityId: uuidFieldSchema('communityId') });

function validateChangeActiveCommunity(req, res, next) {
  // Distinguir un UUID inválido de una comunidad válida pero "inexistente".
  const result = changeActiveCommunitySchema.safeParse(req.body);

  if (!result.success) {
    return next(new ValidationError(result.error, { location: 'body', code: errorCodes.ACTIVE_COMMUNITY_INVALID }));
  }

  req.body = result.data;
  return next();
}

module.exports = { updateMyProfileSchema, deleteMyAccountSchema, changeActiveCommunitySchema, validateChangeActiveCommunity };