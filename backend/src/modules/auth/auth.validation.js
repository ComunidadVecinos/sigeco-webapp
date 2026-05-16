// Validaciones de auth: preparan los cuerpos de registro, login y gestión de contraseña.
// Flujo cubierto: entrada Express -> schemas Zod -> datos listos para el servicio.
// Expone schemas de alta, login, cambio de contraseña y reseteo. Lo consumen las rutas antes de llegar a los controladores.
const { z } = require('zod');
const { personNameSchema, emailSchema, optionalPhoneSchema } = require('../../lib/validation/userFields');

// Regex que valida contraseñas:
// - mínimo 8 caracteres
// - al menos una letra minúscula
// - al menos una letra mayúscula
// - al menos un número
// - al menos un carácter especial
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

// El reset usa email genérico; el registro sí exige el dominio institucional.
const publicEmailSchema = z.string().trim().email('El correo electrónico debe ser válido').transform((value) => value.toLowerCase());

// Política de complejidad compartida por registro y cambio de contraseña.
const passwordSchema = z.string().trim().min(1, 'La contraseña es obligatoria').min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(PASSWORD_REGEX, 'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial');

// Body de POST /registrations: alta completa del usuario con confirmación de contraseña.
const registrationSchema = z
  .object({
    firstName: personNameSchema('firstName'),
    lastName: personNameSchema('lastName'),
    email: emailSchema,
    phone: optionalPhoneSchema,
    password: passwordSchema,
    passwordConfirmation: z.string().trim().min(1, 'La confirmación de la contraseña es obligatoria')
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.passwordConfirmation) {
      ctx.addIssue({ code: 'custom', path: ['passwordConfirmation'], message: 'Las contraseñas no coinciden' });
    }
  });

// Body de POST /sessions: presencia mínima; la interpretación email/teléfono se decide en service.
const loginSchema = z
  .object({
    identifier: z.string().trim().min(1, 'El identificador es obligatorio'),
    password: z.string().trim().min(1, 'La contraseña es obligatoria')
  }).transform((value) => ({ ...value, identifier: value.identifier.trim() }));

// Body de POST /password/change: cambio autenticado de contraseña con doble confirmación.
const changePasswordSchema = z.object({
  currentPassword: z.string().trim().min(1, 'La contraseña actual es obligatoria'),
  newPassword: passwordSchema,
  newPasswordConfirmation: z.string().trim().min(1, 'La confirmación de la nueva contraseña es obligatoria')
}).superRefine((value, ctx) => {
  if (value.newPassword !== value.newPasswordConfirmation) {
    ctx.addIssue({ code: 'custom', path: ['newPasswordConfirmation'], message: 'Las contraseñas no coinciden' });
  }
});

// Body de POST /password/reset: correo genérico para no revelar existencia de cuenta.
const passwordResetSchema = z.object({ email: publicEmailSchema });

module.exports = { registrationSchema, loginSchema, changePasswordSchema, passwordResetSchema };