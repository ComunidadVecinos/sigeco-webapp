// Capa HTTP de forum: aterriza posts, comentarios y reacciones en respuestas del foro.
// Flujo cubierto: request autenticada y validada -> servicio -> JSON HTTP.
// Expone controladores de publicaciones, comentarios, likes, encuestas y destacados.
// Lo consumen las rutas del módulo con asyncHandler.
const forumRepository = require('./forum.repository');
const forumService = require('./forum.service');

function requestContext(req) {
  return { userId: req.user.id };
}

// --- Publicaciones: POST ---
async function createPost(req, res) {
  const result = await forumService.createPost(requestContext(req), req.params.communityId, req.body, forumRepository);
  return res.status(201).json(result);
}

// --- Publicaciones: GET ---
async function getPostList(req, res) {
  const result = await forumService.getPostList(requestContext(req), req.params.communityId, req.query, forumRepository);
  return res.status(200).json(result);
}

async function getPostDetail(req, res) {
  const result = await forumService.getPostDetail(requestContext(req), req.params.communityId, req.params.postId, forumRepository);
  return res.status(200).json(result);
}

// --- Publicaciones: PATCH y DELETE ---
async function updatePost(req, res) {
  const result = await forumService.updatePost(requestContext(req), req.params.communityId, req.params.postId, req.body, forumRepository);
  return res.status(200).json(result);
}

async function deletePost(req, res) {
  const result = await forumService.deletePost(requestContext(req), req.params.communityId, req.params.postId, forumRepository);
  return res.status(200).json(result);
}

// --- Comentarios: POST ---
async function createComment(req, res) {
  const result = await forumService.createComment(requestContext(req), req.params.communityId, req.params.postId, req.body, forumRepository);
  return res.status(201).json(result);
}

// --- Comentarios: GET ---
async function getCommentList(req, res) {
  const result = await forumService.getCommentList(requestContext(req), req.params.communityId, req.params.postId, req.query, forumRepository);
  return res.status(200).json(result);
}

// --- Comentarios: PATCH y DELETE ---
async function updateComment(req, res) {
  const result = await forumService.updateComment(requestContext(req), req.params.communityId, req.params.commentId, req.body, forumRepository);
  return res.status(200).json(result);
}

async function deleteComment(req, res) {
  const result = await forumService.deleteComment(requestContext(req), req.params.communityId, req.params.commentId, forumRepository);
  return res.status(200).json(result);
}

// --- Reacciones: POST ---
async function togglePostLike(req, res) {
  const result = await forumService.togglePostLike(requestContext(req), req.params.communityId, req.params.postId, forumRepository);
  return res.status(200).json(result);
}

async function toggleCommentLike(req, res) {
  const result = await forumService.toggleCommentLike(requestContext(req), req.params.communityId, req.params.commentId, forumRepository);
  return res.status(200).json(result);
}

// --- Encuestas: POST ---
async function voteOnPoll(req, res) {
  const result = await forumService.voteOnPoll(requestContext(req), req.params.communityId, req.params.pollId, req.body, forumRepository);
  return res.status(200).json(result);
}

// --- Destacados: POST ---
async function pinPost(req, res) {
  const result = await forumService.setPostPinned(requestContext(req), req.params.communityId, req.params.postId, true, forumRepository);
  return res.status(200).json(result);
}

async function unpinPost(req, res) {
  const result = await forumService.setPostPinned(requestContext(req), req.params.communityId, req.params.postId, false, forumRepository);
  return res.status(200).json(result);
}

module.exports = {
  createPost,
  getPostList,
  getPostDetail,
  updatePost,
  deletePost,
  createComment,
  getCommentList,
  updateComment,
  deleteComment,
  togglePostLike,
  toggleCommentLike,
  voteOnPoll,
  pinPost,
  unpinPost
};