const { z } = require('zod');

// Validaciones de users: preparan los cambios de perfil y las acciones sensibles sobre la cuenta.
// Flujo cubierto: entrada Express -> schemas Zod -> datos listos para el controlador/servicio.
// Expone schemas de perfil/baja y el middleware validateChangeActiveCommunity.
// Lo consumen las rutas antes de llegar a los controladores.
const { ValidationError, errorCodes } = require('../../lib/errors');
const { uuidFieldSchema } = require('../../lib/validation/requestFields');
const { personNameSchema, emailSchema, optionalPhoneSchema } = require('../../lib/validation/userFields');

// Body de PATCH /me: actualización de los datos básicos del perfil del usuario autenticado.
const updateMyProfileSchema = z.object({
  firstName: personNameSchema('firstName'),
  lastName: personNameSchema('lastName'),
  email: emailSchema,
  phone: optionalPhoneSchema
});

// Body de DELETE /me: confirmación reforzada para evitar borrados accidentales de la cuenta.
const deleteMyAccountSchema = z.object({
  email: z.string().trim().email('El correo electrónico debe ser válido').transform((value) => value.toLowerCase()),
  confirmationText: z.string().trim().min(1, 'El texto de confirmación es obligatorio')
});

// Body de PUT /me/active-community: comunidad que el usuario quiere fijar como contexto activo.
const changeActiveCommunitySchema = z.object({ communityId: uuidFieldSchema('communityId') });

// Middleware específico para distinguir un UUID mal formado de una comunidad válida pero inexistente.
function validateChangeActiveCommunity(req, res, next) {
  // Aquí diferenciamos un UUID mal formado de una comunidad que simplemente no existe.
  const parsedBody = changeActiveCommunitySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return next(new ValidationError(parsedBody.error, { location: 'body', code: errorCodes.ACTIVE_COMMUNITY_INVALID }));
  }
  req.body = parsedBody.data;
  return next();
}

module.exports = { updateMyProfileSchema, deleteMyAccountSchema, changeActiveCommunitySchema, validateChangeActiveCommunity };