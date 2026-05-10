// Reglas de validación compartidas por módulos de comunidad.
// Aquí viven formatos reutilizables de dirección, comentarios, CIF y código de acceso.
const { z } = require('zod');

const REQUIRED_TEXT_MAX = 255;
const SPAIN_POSTAL_CODE_REGEX = /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/;
const COMMUNITY_OWNERS_CIF_REGEX = /^H\d{8}$/;
const ACCESS_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;

const optionalAddressDetailSchema = z.string().trim().max(30).optional().transform((value) => (value === '' ? undefined : value));
const optionalCommentSchema = z.string().trim().max(2000, 'No puede superar los 2000 caracteres').optional().transform((value) => (value === '' ? undefined : value));

const requiredTextSchema = (fieldName, maxLength = REQUIRED_TEXT_MAX) =>
  z.string().trim()
    .min(1, `El campo ${fieldName} es obligatorio`)
    .max(maxLength, `El campo ${fieldName} no puede superar los ${maxLength} caracteres`);

function normalizeCommunityCif(value) {
  const compactValue = String(value).trim().toUpperCase().replace(/[\s-]+/g, '');
  if (compactValue.length !== 9) {
    return compactValue;
  }
  return `${compactValue[0]}-${compactValue.slice(1)}`;
}

// Valida el formato simplificado de CIF que usa la aplicación.
function isValidCommunityOwnersCif(value) {
  const compactValue = String(value).trim().toUpperCase().replace(/[\s-]+/g, '');
  return COMMUNITY_OWNERS_CIF_REGEX.test(compactValue);
}

function normalizeStreetNumberKm(value) {
  return String(value).trim().toUpperCase().replace(/\s+/g, ' ');
}

// Valida formatos habituales de número de vía (ej: "12", "12B", "12-14", "12/3").
function isValidSpanishStreetNumberKm(value) {
  return /^(?:S\/N|KM ?\d+(?:[.,]\d+)?|\d+[A-Z0-9\/ -]*)$/.test(value);
}

const streetNumberKmSchema = z.string().trim()
  .min(1, 'El campo Nº/Km es obligatorio')
  .max(30, 'El campo Nº/Km no puede superar los 30 caracteres')
  .transform(normalizeStreetNumberKm)
  .refine(isValidSpanishStreetNumberKm, 'El campo Nº/Km debe ajustarse a un formato de dirección válido');

const postalCodeSchema = z.string().trim().refine((value) => SPAIN_POSTAL_CODE_REGEX.test(value), 'El código postal debe ser un código postal válido');
const accessCodeSchema = z.string().trim().transform((value) => value.toUpperCase()).refine((value) => ACCESS_CODE_REGEX.test(value), 'El código de acceso debe ser un código de comunidad válido');

const addressSchema = z.object({
  country: requiredTextSchema('country', 100),
  province: requiredTextSchema('province', 120),
  municipality: requiredTextSchema('municipality', 120),
  streetType: requiredTextSchema('streetType', 50),
  streetName: requiredTextSchema('streetName', 255),
  postalCode: postalCodeSchema,
  streetNumberKm: streetNumberKmSchema
});

module.exports = {
  addressSchema,
  accessCodeSchema,
  optionalAddressDetailSchema,
  optionalCommentSchema,
  postalCodeSchema,
  requiredTextSchema,
  normalizeCommunityCif,
  isValidCommunityOwnersCif,
  streetNumberKmSchema
};