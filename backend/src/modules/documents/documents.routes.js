// Router de documents: reúne carpetas, documentos y movimientos lógicos bajo un mismo subrecurso.
// Flujo cubierto: sesión -> validación de params/query/body -> controlador.
// Expone el router de Express para carpetas, documentos, contenido binario y reubicación lógica.
// Lo consume el router de communities como subrecurso con communityId.
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

const router = express.Router({ mergeParams: true });

// --- Documentos: GET de consulta ---
router.get(
  '/',
  requireSession,
  validate({ params: communityIdParamSchema, query: listDocumentsQuerySchema }),
  asyncHandler(documentsController.listDocuments)
);

router.get(
  '/folders/tree',
  requireSession,
  validate({ params: communityIdParamSchema }),
  asyncHandler(documentsController.getFolderTree)
);

router.get(
  '/files/:documentId/content',
  requireSession,
  validate({ params: documentParamsSchema, query: documentContentQuerySchema }),
  asyncHandler(documentsController.streamDocument)
);

// --- Documentos: POST de creación ---
router.post(
  '/folders',
  requireSession,
  validate({ params: communityIdParamSchema, body: createFolderSchema }),
  asyncHandler(documentsController.createFolder)
);

router.post(
  '/files',
  requireSession,
  uploadDocument,
  sanitizeCreateDocumentBody,
  validate({ params: communityIdParamSchema, body: createDocumentSchema }),
  asyncHandler(documentsController.createDocument)
);

// --- Documentos: PATCH de edición y movimiento ---
router.patch(
  '/folders/:folderId',
  requireSession,
  validate({ params: folderParamsSchema, body: renameFolderSchema }),
  asyncHandler(documentsController.renameFolder)
);

router.patch(
  '/move',
  requireSession,
  validate({ params: communityIdParamSchema, body: moveItemSchema }),
  asyncHandler(documentsController.moveItem)
);

router.patch(
  '/files/:documentId',
  requireSession,
  validate({ params: documentParamsSchema, body: renameDocumentSchema }),
  asyncHandler(documentsController.renameDocument)
);

// --- Documentos: DELETE de carpetas y documentos ---
router.delete(
  '/folders/:folderId',
  requireSession,
  validate({ params: folderParamsSchema }),
  asyncHandler(documentsController.deleteFolder)
);

router.delete(
  '/files/:documentId',
  requireSession,
  validate({ params: documentParamsSchema }),
  asyncHandler(documentsController.deleteDocument)
);

module.exports = router;