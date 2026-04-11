const express = require('express');

// Rutas HTTP del módulo news.
// Se monta como subrecurso de comunidad para reutilizar communityId.
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

router.post(
  '/',
  requireSession,
  uploadNewsImage,
  normalizeCreateNewsMultipartBody,
  validate({ params: communityIdParamSchema, body: createNewsSchema }),
  asyncHandler(newsController.createNews)
);
router.get('/', requireSession, validate({ params: communityIdParamSchema, query: listNewsQuerySchema }), asyncHandler(newsController.getNewsList));
router.get('/:newsId', requireSession, validate({ params: newsParamsSchema }), asyncHandler(newsController.getNewsDetail));
router.delete('/:newsId/image', requireSession, validate({ params: newsParamsSchema }), asyncHandler(newsController.deleteNewsImage));
router.patch(
  '/:newsId',
  requireSession,
  uploadNewsImage,
  normalizeUpdateNewsMultipartBody,
  validate({ params: newsParamsSchema, body: updateNewsSchema }),
  ensureUpdateNewsHasChanges,
  asyncHandler(newsController.updateNews)
);
router.delete('/:newsId', requireSession, validate({ params: newsParamsSchema }), asyncHandler(newsController.deleteNews));

module.exports = router;