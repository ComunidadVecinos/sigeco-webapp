// Router de forum: agrupa el flujo completo de posts, comentarios, likes, votos y destacados.
// Flujo cubierto: sesión -> validación de params/query/body -> controlador.
// Expone el router de Express para posts, comentarios, likes, votos y destacados.
// Lo consume el router de communities como subrecurso con communityId.
const express = require('express');

const asyncHandler = require('../../lib/http/asyncHandler');
const validate = require('../../lib/validation/validate');
const { requireSession } = require('../auth/auth.middleware');
const forumController = require('./forum.controller');
const {
  communityIdParamSchema,
  postParamsSchema,
  commentParamsSchema,
  pollParamsSchema,
  createPostSchema,
  listPostsQuerySchema,
  updatePostSchema,
  createCommentSchema,
  listCommentsQuerySchema,
  updateCommentSchema,
  voteOnPollSchema
} = require('./forum.validation');

const router = express.Router({ mergeParams: true });

// --- Publicaciones: GET de consulta ---
router.get(
  '/posts',
  requireSession,
  validate({ params: communityIdParamSchema, query: listPostsQuerySchema }),
  asyncHandler(forumController.getPostList)
);
router.get(
  '/posts/:postId',
  requireSession,
  validate({ params: postParamsSchema }),
  asyncHandler(forumController.getPostDetail)
);

// --- Publicaciones: POST de creación y acciones ---
router.post(
  '/posts',
  requireSession,
  validate({ params: communityIdParamSchema, body: createPostSchema }),
  asyncHandler(forumController.createPost)
);
router.post(
  '/posts/:postId/likes/toggle',
  requireSession,
  validate({ params: postParamsSchema }),
  asyncHandler(forumController.togglePostLike)
);
router.post(
  '/posts/:postId/pin',
  requireSession,
  validate({ params: postParamsSchema }),
  asyncHandler(forumController.pinPost)
);
router.post(
  '/posts/:postId/unpin',
  requireSession,
  validate({ params: postParamsSchema }),
  asyncHandler(forumController.unpinPost)
);

// --- Publicaciones: PATCH y DELETE ---
router.patch(
  '/posts/:postId',
  requireSession,
  validate({ params: postParamsSchema, body: updatePostSchema }),
  asyncHandler(forumController.updatePost)
);
router.delete(
  '/posts/:postId',
  requireSession,
  validate({ params: postParamsSchema }),
  asyncHandler(forumController.deletePost)
);

// --- Comentarios: GET de consulta ---
router.get(
  '/posts/:postId/comments',
  requireSession,
  validate({ params: postParamsSchema, query: listCommentsQuerySchema }),
  asyncHandler(forumController.getCommentList)
);

// --- Comentarios: POST de creación y acciones ---
router.post(
  '/posts/:postId/comments',
  requireSession,
  validate({ params: postParamsSchema, body: createCommentSchema }),
  asyncHandler(forumController.createComment)
);
router.post(
  '/comments/:commentId/likes/toggle',
  requireSession,
  validate({ params: commentParamsSchema }),
  asyncHandler(forumController.toggleCommentLike)
);

// --- Comentarios: PATCH y DELETE ---
router.patch(
  '/comments/:commentId',
  requireSession,
  validate({ params: commentParamsSchema, body: updateCommentSchema }),
  asyncHandler(forumController.updateComment)
);
router.delete(
  '/comments/:commentId',
  requireSession,
  validate({ params: commentParamsSchema }),
  asyncHandler(forumController.deleteComment)
);

// --- Encuestas: POST de voto ---
router.post(
  '/polls/:pollId/vote',
  requireSession,
  validate({ params: pollParamsSchema, body: voteOnPollSchema }),
  asyncHandler(forumController.voteOnPoll)
);

module.exports = router;