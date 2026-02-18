const { z } = require('zod');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const UCM_EMAIL_DOMAIN = '@ucm.es';

function normalizePhone(rawPhone) {
  if (!rawPhone) return undefined;

  if (!/^[\d\s]+$/.test(rawPhone)) {
    return null;
  }

  const compact = rawPhone.replace(/\s/g, '');

  if (/^\d{9}$/.test(compact)) return compact;

  return null;
}

const emailSchema = z
  .string()
  .trim()
  .email('email must be valid')
  .transform((value) => value.toLowerCase())
  .refine((value) => value.endsWith(UCM_EMAIL_DOMAIN), 'email domain must be @ucm.es');

const passwordSchema = z
  .string()
  .trim()
  .min(1, 'password is required')
  .min(8, 'password must be at least 8 characters')
  .regex(
    PASSWORD_REGEX,
    'password must include at least one uppercase letter, one lowercase letter and one number'
  );

const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'firstName is required'),
    lastName: z.string().trim().min(1, 'lastName is required'),
    email: emailSchema,
    phone: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value === '' ? undefined : value)),
    password: passwordSchema
  })
  .superRefine((value, ctx) => {
    if (!value.phone) return;

    if (normalizePhone(value.phone) === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'phone must be 9 digits (spaces allowed)'
      });
    }
  })
  .transform((value) => ({
    ...value,
    phone: normalizePhone(value.phone)
  }));

const loginSchema = z
  .object({
    email: emailSchema.optional(),
    phone: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value === '' ? undefined : value)),
    password: z.string().trim().min(1, 'password is required')
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'email or phone is required'
      });
    }

    if (value.phone) {
      const normalizedPhone = normalizePhone(value.phone);
      if (normalizedPhone === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['phone'],
          message: 'phone must be 9 digits (spaces allowed)'
        });
      }
    }
  })
  .transform((value) => ({
    ...value,
    phone: value.phone ? normalizePhone(value.phone) : undefined
  }));

const changePasswordSchema = z.object({
  currentPassword: z.string().trim().min(1, 'currentPassword is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().trim().min(1, 'confirmNewPassword is required')
}).superRefine((value, ctx) => {
  if (value.newPassword !== value.confirmNewPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirmNewPassword'],
      message: 'confirmNewPassword must match newPassword'
    });
  }
});

const forgotPasswordSchema = z.object({
  email: emailSchema
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema
};
