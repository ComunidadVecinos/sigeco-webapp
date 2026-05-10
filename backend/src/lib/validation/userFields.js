// Validaciones reutilizables para datos personales.
// Las usan sobre todo auth y users para mantener el mismo criterio con nombre, correo UCM y teléfono.
const { z } = require('zod');

const UCM_EMAIL_DOMAIN = '@ucm.es';
const NAME_REGEX = /^[\p{L}\s'-]+$/u;

function normalizePhone(rawPhone) {
  if (!rawPhone) {
    return undefined;
  }
  if (!/^[\d\s]+$/.test(rawPhone)) {
    return null;
  }

  const compactPhone = rawPhone.replace(/\s/g, '');
  if (/^\d{9}$/.test(compactPhone)) {
    return compactPhone;
  }

  return null;
}


const personNameSchema = (fieldName) =>
  z.string().trim()
    .min(1, `El campo ${fieldName} es obligatorio`)
    .refine((value) => NAME_REGEX.test(value), `El campo ${fieldName} contiene caracteres no válidos`);

const ucmEmailSchema = z.string().trim()
  .email('El correo electrónico debe ser válido')
  .transform((value) => value.toLowerCase())
  .refine((value) => value.endsWith(UCM_EMAIL_DOMAIN), 'El dominio del correo electrónico debe ser @ucm.es');

const optionalPhoneSchema = z.string().trim().optional()
  .transform((value) => (value === '' ? undefined : value))
  .refine(
    (value) => value === undefined || normalizePhone(value) !== null,
    'El teléfono debe tener 9 dígitos y puede incluir espacios'
  )
  .transform((value) => normalizePhone(value));

module.exports = { personNameSchema, ucmEmailSchema, optionalPhoneSchema };