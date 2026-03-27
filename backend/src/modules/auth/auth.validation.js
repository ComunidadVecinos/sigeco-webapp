// Validaciones HTTP del modulo auth.
// Reutiliza reglas compartidas de usuario y añade dependencias entre campos.
const { z } = require('zod');
const { personNameSchema, ucmEmailSchema, optionalPhoneSchema } = require('../../lib/validation/userFields');

// Regex que valida contraseñas:
// - mínimo 8 caracteres
// - al menos una letra minúscula
// - al menos una letra mayúscula
// - al menos un número
// - al menos un carácter especial
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

// El reset usa email genérico (no se filtra existencia ni dominio; el registro requiere @ucm.es).
const publicEmailSchema = z.string().trim().email('El correo electrónico debe ser válido').transform((value) => value.toLowerCase());

// Política de complejidad de contraseña (registro, cambio y reseteo).
const passwordSchema = z.string().trim().min(1, 'La contraseña es obligatoria').min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(PASSWORD_REGEX, 'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial');

// Validación de registro: el service asume que la confirmación ya fue resuelta.
const registrationSchema = z
  .object({
    firstName: personNameSchema('firstName'),
    lastName: personNameSchema('lastName'),
    email: ucmEmailSchema,
    phone: optionalPhoneSchema,
    password: passwordSchema,
    passwordConfirmation: z.string().trim().min(1, 'La confirmación de la contraseña es obligatoria')
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.passwordConfirmation) {
      ctx.addIssue({ code: 'custom', path: ['passwordConfirmation'], message: 'Las contraseñas no coinciden' });
    }
  });

// Login valida presencia mínima. La interpretacion email/telefono se decide en service.
const loginSchema = z
  .object({
    identifier: z.string().trim().min(1, 'El identificador es obligatorio'),
    password: z.string().trim().min(1, 'La contraseña es obligatoria')
  }).transform((value) => ({ ...value, identifier: value.identifier.trim() }));

// Igual que en registro, se realiza confirmación de password (service centrado en identidad y efectos de sesión).
const changePasswordSchema = z.object({
  currentPassword: z.string().trim().min(1, 'La contraseña actual es obligatoria'),
  newPassword: passwordSchema,
  newPasswordConfirmation: z.string().trim().min(1, 'La confirmación de la nueva contraseña es obligatoria')
}).superRefine((value, ctx) => {
  if (value.newPassword !== value.newPasswordConfirmation) {
    ctx.addIssue({ code: 'custom', path: ['newPasswordConfirmation'], message: 'Las contraseñas no coinciden' });
  }
});

const passwordResetSchema = z.object({
  email: publicEmailSchema
});

module.exports = { registrationSchema, loginSchema, changePasswordSchema, passwordResetSchema };