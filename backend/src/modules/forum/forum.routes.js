const express = require('express');

// Rutas HTTP del modulo forum.
// Se monta como subrecurso de comunidad para heredar `communityId` y compartir el mismo contexto de acceso.
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

router.post('/posts', requireSession, validate({ params: communityIdParamSchema, body: createPostSchema }), asyncHandler(forumController.createPost));
router.get('/posts', requireSession, validate({ params: communityIdParamSchema, query: listPostsQuerySchema }), asyncHandler(forumController.getPostList));
router.get('/posts/:postId', requireSession, validate({ params: postParamsSchema }), asyncHandler(forumController.getPostDetail));
router.patch('/posts/:postId', requireSession, validate({ params: postParamsSchema, body: updatePostSchema }), asyncHandler(forumController.updatePost));
router.delete('/posts/:postId', requireSession, validate({ params: postParamsSchema }), asyncHandler(forumController.deletePost));

router.post('/posts/:postId/comments', requireSession, validate({ params: postParamsSchema, body: createCommentSchema }), asyncHandler(forumController.createComment));
router.get('/posts/:postId/comments', requireSession, validate({ params: postParamsSchema, query: listCommentsQuerySchema }), asyncHandler(forumController.getCommentList));
router.patch('/comments/:commentId', requireSession, validate({ params: commentParamsSchema, body: updateCommentSchema }), asyncHandler(forumController.updateComment));
router.delete('/comments/:commentId', requireSession, validate({ params: commentParamsSchema }), asyncHandler(forumController.deleteComment));

router.post('/posts/:postId/likes/toggle', requireSession, validate({ params: postParamsSchema }), asyncHandler(forumController.togglePostLike));
router.post('/comments/:commentId/likes/toggle', requireSession, validate({ params: commentParamsSchema }), asyncHandler(forumController.toggleCommentLike));

router.post('/polls/:pollId/vote', requireSession, validate({ params: pollParamsSchema, body: voteOnPollSchema }), asyncHandler(forumController.voteOnPoll));

router.post('/posts/:postId/pin', requireSession, validate({ params: postParamsSchema }), asyncHandler(forumController.pinPost));
router.post('/posts/:postId/unpin', requireSession, validate({ params: postParamsSchema }), asyncHandler(forumController.unpinPost));

module.exports = router;