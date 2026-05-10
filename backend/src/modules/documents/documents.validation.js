const { z } = require('zod');

// Validaciones de documents: revisan navegación, carpetas, PDFs y movimientos dentro del árbol.
// Flujo cubierto: entrada Express -> schemas Zod -> datos listos para el servicio.
// Expone schemas de carpetas, documentos, navegación, contenido y movimiento lógico.
// Lo consumen las rutas antes de llegar a los controladores.
const { ValidationError } = require('../../lib/errors');
const { requiredTextSchema } = require('../../lib/validation/communityFields');
const { optionalTrimmedStringSchema, positiveIntegerQuerySchema, uuidParamSchema } = require('../../lib/validation/requestFields');

function validationDetail(field, message, location = 'body') {
  return { field, location, message };
}

// UUID opcional usado en parentId/folderId: acepta undefined para raíz.
const optionalUuidSchema = (fieldName) =>
  optionalTrimmedStringSchema.refine(
    (value) => value === undefined || z.string().uuid().safeParse(value).success,
    `El campo ${fieldName} debe ser un UUID válido`
  );

// La descripción llega como texto libre opcional y se vacía a undefined si no tiene contenido real.
const optionalDescriptionSchema = optionalTrimmedStringSchema.refine(
  (value) => value === undefined || value.length <= 2000,
  'El campo description no puede superar los 2000 caracteres'
);

// Query download: se acepta el contrato booleano habitual de la app en texto.
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
// Params para rutas colgadas directamente de una comunidad.
const communityIdParamSchema = uuidParamSchema('communityId');
// Params para rutas que operan sobre una carpeta concreta.
const folderParamsSchema = uuidParamSchema('communityId', 'folderId');
// Params para rutas que operan sobre un documento concreto.
const documentParamsSchema = uuidParamSchema('communityId', 'documentId');

// --- Query params ---
// Query de GET /: navegación por parentId, búsqueda y paginación del ámbito actual.
const listDocumentsQuerySchema = z.object({
  parentId: optionalUuidSchema('parentId'),
  search: optionalTrimmedStringSchema,
  page: positiveIntegerQuerySchema('page', { min: 1, defaultValue: 1 }),
  pageSize: positiveIntegerQuerySchema('pageSize', { min: 1, max: 100, defaultValue: 20 })
}).strict();

// Query de GET /files/:documentId/content: inline o descarga forzada.
const documentContentQuerySchema = z.object({ download: booleanQuerySchema('download') }).strict();

// --- Bodies JSON ---
// Body de POST /folders: crea una carpeta raíz o hija.
const createFolderSchema = z.object({ name: requiredTextSchema('name', 255), parentId: optionalUuidSchema('parentId') }).strict();
// Body de PATCH /folders/:folderId: renombrado simple.
const renameFolderSchema = z.object({ name: requiredTextSchema('name', 255) }).strict();
// Body de PATCH /files/:documentId: renombrado lógico del documento, sin tocar el fichero físico.
const renameDocumentSchema = z.object({ name: requiredTextSchema('name', 255).optional(), description: z.union([optionalDescriptionSchema, z.null()]).optional() }).strict().refine((value) => Object.keys(value).length > 0, {message: 'Debes enviar al menos un campo editable'});

// Body de POST /files: alta de documento PDF con metadatos lógicos.
const createDocumentSchema = z.object({
  name: requiredTextSchema('name', 255),
  description: optionalDescriptionSchema,
  folderId: optionalUuidSchema('folderId')
}).strict();

// --- Body para mover carpetas/documentos ---
// "targetFolderId: null" representa mover a la raíz documental.
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

    // En multipart el fichero viaja por req.file, así que aquí solo se permite el subconjunto textual esperado.
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