const express = require('express');

const validate = require('../../lib/validation/validate');
const asyncHandler = require('../../lib/http/asyncHandler');
const { requireSession } = require('../auth/auth.middleware');
const { uploadDocument } = require('../../lib/storage/documentUpload');

const documentsController = require('./documents.controller');
const {
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
} = require('./documents.validation');

/**
 * Rutas HTTP del módulo documents.
 * Se monta como subrecurso de comunidad y reutiliza `communityId` desde la URL padre `/api/communities/:communityId/documents`.
 */

const router = express.Router({ mergeParams: true });

// GET /api/communities/:communityId/documents
// Lista carpetas y documentos del ámbito actual, con soporte de navegación por parentId.
router.get(
  '/',
  requireSession,
  validate({ params: communityIdParamSchema, query: listDocumentsQuerySchema }),
  asyncHandler(documentsController.listDocuments)
);

// GET /api/communities/:communityId/documents/folders/tree
// Devuelve el árbol completo de carpetas activas para navegación jerárquica.
router.get(
  '/folders/tree',
  requireSession,
  validate({ params: communityIdParamSchema }),
  asyncHandler(documentsController.getFolderTree)
);

// POST /api/communities/:communityId/documents/folders
// Crea una carpeta raíz o una subcarpeta (si se proporciona parentId).
router.post(
  '/folders',
  requireSession,
  validate({ params: communityIdParamSchema, body: createFolderSchema }),
  asyncHandler(documentsController.createFolder)
);

// PATCH /api/communities/:communityId/documents/folders/:folderId
router.patch(
  '/folders/:folderId',
  requireSession,
  validate({ params: folderParamsSchema, body: renameFolderSchema }),
  asyncHandler(documentsController.renameFolder)
);

// DELETE /api/communities/:communityId/documents/folders/:folderId
// Elimina una carpeta y todo su contenido descendiente.
router.delete(
  '/folders/:folderId',
  requireSession,
  validate({ params: folderParamsSchema }),
  asyncHandler(documentsController.deleteFolder)
);

// POST /api/communities/:communityId/documents/files
// Sube un PDF, opcionalmente dentro de una carpeta.
router.post(
  '/files',
  requireSession,
  uploadDocument,
  sanitizeCreateDocumentBody,
  validate({ params: communityIdParamSchema, body: createDocumentSchema }),
  asyncHandler(documentsController.createDocument)
);

//PATCH /api/communities/:communityId/documents/move
//Mueve una carpeta o documento a otra carpeta o la raíz.
router.patch(
  '/move',
  requireSession,
  validate({params: communityIdParamSchema, body: moveItemSchema}),
  asyncHandler(documentsController.moveItem)
);

// PATCH /api/communities/:communityId/documents/files/:documentId
// Renombra un documento existente (sin modificar el fichero físico).
router.patch(
  '/files/:documentId',
  requireSession,
  validate({ params: documentParamsSchema, body: renameDocumentSchema }),
  asyncHandler(documentsController.renameDocument)
);

// DELETE /api/communities/:communityId/documents/files/:documentId
// Elimina el documento en BD, libera cuota usada y borra el PDF.
router.delete(
  '/files/:documentId',
  requireSession,
  validate({ params: documentParamsSchema }),
  asyncHandler(documentsController.deleteDocument)
);

// GET /api/communities/:communityId/documents/files/:documentId/content
// Sirve el PDF en inline o descarga forzada según download.
router.get(
  '/files/:documentId/content',
  requireSession,
  validate({ params: documentParamsSchema, query: documentContentQuerySchema }),
  asyncHandler(documentsController.streamDocument)
);

module.exports = router;