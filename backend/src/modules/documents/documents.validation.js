const { z } = require('zod');

const { ValidationError } = require('../../lib/errors');
const { requiredTextSchema } = require('../../lib/validation/communityFields');
const { optionalTrimmedStringSchema, positiveIntegerQuerySchema, uuidParamSchema } = require('../../lib/validation/requestFields');

/**
 * Validaciones HTTP del módulo documents.
 * Agrupa params, query, body JSON y el saneado del body multipart.
 */

function validationDetail(field, message, location = 'body') {
  return { field, location, message };
}

// Reutiliza el helper base y solo añade la regla concreta del campo.
const optionalUuidSchema = (fieldName) =>
  optionalTrimmedStringSchema.refine(
    (value) => value === undefined || z.string().uuid().safeParse(value).success,
    `El campo ${fieldName} debe ser un UUID válido`
  );

// La descripción llega como texto libre opcional y se normaliza a undefined si vacía.
const optionalDescriptionSchema = optionalTrimmedStringSchema.refine(
  (value) => value === undefined || value.length <= 2000,
  'El campo description no puede superar los 2000 caracteres'
);

const booleanQuerySchema = (fieldName) =>
  optionalTrimmedStringSchema
    .transform((value) => {
      if (value === undefined) {
        return false;
      }
      const normalizedValue = value.toLowerCase();

      if (['1', 'true', 'yes'].includes(normalizedValue)) {
        return true;
      }
      if (['0', 'false', 'no', ''].includes(normalizedValue)) {
        return false;
      }

      return value;
    }).refine((value) => typeof value === 'boolean', `El campo ${fieldName} debe ser un booleano válido`);

// --- Params de ruta ---
const communityIdParamSchema = uuidParamSchema('communityId');
const folderParamsSchema = uuidParamSchema('communityId', 'folderId');
const documentParamsSchema = uuidParamSchema('communityId', 'documentId');

// --- Query params ---
const listDocumentsQuerySchema = z.object({
  parentId: optionalUuidSchema('parentId'),
  search: optionalTrimmedStringSchema,
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 20 })
}).strict();

const documentContentQuerySchema = z.object({ download: booleanQuerySchema('download') }).strict();

// --- Bodies JSON ---
const createFolderSchema = z.object({ name: requiredTextSchema('name', 255), parentId: optionalUuidSchema('parentId') }).strict();
const renameFolderSchema = z.object({ name: requiredTextSchema('name', 255) }).strict();
const renameDocumentSchema = z.object({ name: requiredTextSchema('name', 255) }).strict();

const createDocumentSchema = z.object({
  name: requiredTextSchema('name', 255),
  description: optionalDescriptionSchema,
  folderId: optionalUuidSchema('folderId')
}).strict();

// --- Body para mover carpetas/documentos ---
const nullableUuidSchema = z.string().uuid('El campo targetFolderId debe ser un UUID válido').nullable();

const moveItemSchema = z.object({
  itemId: z.string().uuid('El campo itemId debe ser un UUID válido'),
  itemType: z.enum(['folder', 'file'], { errorMap: () => ({ message: 'itemType debe ser "folder" o "file"' }) }),
  targetFolderId: nullableUuidSchema
}).strict();

function sanitizeMultipartBody(allowedFields) {
  return function sanitizeBody(req, res, next) {
    if (!req.is('multipart/form-data')) {
      return next();
    }
    const body = req.body || {};
    const extraFields = Object.keys(body).filter((field) => !allowedFields.includes(field));

    // En multipart se blinda el contrato para que solo entren campos conocidos; el fichero viaja por req.file.
    if (extraFields.length > 0) {
      return next(new ValidationError(extraFields.map((field) => validationDetail(field, 'El campo no está permitido'))));
    }
    const cleanBody = {};

    // Se reconstruye el body con solo los campos soportados.
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        cleanBody[field] = body[field];
      }
    }
    req.body = cleanBody;

    return next();
  };
}

const sanitizeCreateDocumentBody = sanitizeMultipartBody(['name', 'description', 'folderId']);

module.exports = {
  communityIdParamSchema,
  folderParamsSchema,
  documentParamsSchema,
  listDocumentsQuerySchema,
  documentContentQuerySchema,
  createFolderSchema,
  renameFolderSchema,
  renameDocumentSchema,
  createDocumentSchema,
  moveItemSchema,
  sanitizeCreateDocumentBody
};