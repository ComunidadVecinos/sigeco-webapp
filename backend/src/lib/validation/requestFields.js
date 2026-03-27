const { z } = require('zod');

/**
 * Helpers reutilizables para params y query strings compartidos entre módulos.
 */

const optionalTrimmedStringSchema = z.union([z.string(), z.undefined()])
  .transform((value) => {
    if (value === undefined) { return undefined; }
    const trimmedValue = String(value).trim();
    return trimmedValue === '' ? undefined : trimmedValue;
  });

const uuidFieldSchema = (fieldName) => z.string().uuid(`El campo ${fieldName} debe ser un UUID válido`);

const uuidParamSchema = (...fieldNames) => z.object(Object.fromEntries(fieldNames.map((fieldName) => [fieldName, uuidFieldSchema(fieldName)])));

// Los query params se normalizan a número aquí.
const positiveIntegerQuerySchema = (
  fieldName, { min = 1, max = Number.MAX_SAFE_INTEGER, defaultValue } = {}
) =>
  z.union([z.string(), z.number(), z.undefined()])
    .transform((value) => {
      if (value === undefined) {
        return defaultValue;
      }
      return Number(value);
    })
    .refine((value) => Number.isInteger(value), `El campo ${fieldName} debe ser un número entero`)
    .refine((value) => value >= min, `El campo ${fieldName} debe ser como mínimo ${min}`)
    .refine((value) => value <= max, `El campo ${fieldName} debe ser como máximo ${max}`);

// Parsea fechas solo después de validar que Date no devuelve un valor inválido.
const optionalDateQuerySchema = (fieldName) =>
  optionalTrimmedStringSchema
    .refine(
      (value) => value === undefined || !Number.isNaN(new Date(value).getTime()),
      `El campo ${fieldName} debe ser una fecha válida`
    )
    .transform((value) => (value === undefined ? undefined : new Date(value)));

module.exports = {
  optionalTrimmedStringSchema,
  uuidFieldSchema,
  uuidParamSchema,
  positiveIntegerQuerySchema,
  optionalDateQuerySchema
};
