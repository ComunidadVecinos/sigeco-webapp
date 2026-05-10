const express = require('express');

// Router de news: reúne creación, listado y mantenimiento de noticias del tablón comunitario.
// Flujo cubierto: sesión -> subida opcional de imagen -> normalización/validación -> controlador.
// Expone el router de Express para crear, listar, editar y borrar noticias.
// Lo consume el router de comunidades como subrecurso con communityId.
const asyncHandler = require('../../lib/http/asyncHandler');
const { createImageUpload } = require('../../lib/storage/avatarUpload');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const newsController = require('./news.controller');
const {
  communityIdParamSchema,
  newsParamsSchema,
  createNewsSchema,
  updateNewsSchema,
  listNewsQuerySchema,
  normalizeCreateNewsMultipartBody,
  normalizeUpdateNewsMultipartBody,
  ensureUpdateNewsHasChanges
} = require('./news.validation');

const router = express.Router({ mergeParams: true });
const uploadNewsImage = createImageUpload('image');

// --- Noticias comunitarias: POST de creación ---
router.post(
  '/',
  requireSession,
  uploadNewsImage,
  normalizeCreateNewsMultipartBody,
  validate({ params: communityIdParamSchema, body: createNewsSchema }),
  asyncHandler(newsController.createNews)
);

// --- Noticias comunitarias: GET de consulta ---
router.get(
  '/', 
  requireSession, 
  validate({ params: communityIdParamSchema, query: listNewsQuerySchema }), 
  asyncHandler(newsController.getNewsList)
);

router.get(
  '/:newsId', 
  requireSession, 
  validate({ params: newsParamsSchema }), 
  asyncHandler(newsController.getNewsDetail)
);

// --- Noticias comunitarias: PATCH de edición ---
// La imagen se trata como parte del mismo formulario de edición.
router.patch(
  '/:newsId',
  requireSession,
  uploadNewsImage,
  normalizeUpdateNewsMultipartBody,
  validate({ params: newsParamsSchema, body: updateNewsSchema }),
  ensureUpdateNewsHasChanges,
  asyncHandler(newsController.updateNews)
);

// --- Noticias comunitarias: DELETE de imagen y borrado lógico ---
router.delete(
  '/:newsId/image', 
  requireSession, 
  validate({ params: newsParamsSchema }), 
  asyncHandler(newsController.deleteNewsImage)
);

router.delete(
  '/:newsId', 
  requireSession, 
  validate({ params: newsParamsSchema }), 
  asyncHandler(newsController.deleteNews)
);

module.exports = router;