// Controladores HTTP del modulo forum.
const forumRepository = require('./forum.repository');
const forumService = require('./forum.service');

function getRequestContext(req) {
  return { userId: req.user.id };
}

async function createPost(req, res) {
  const result = await forumService.createPost(getRequestContext(req), req.params.communityId, req.body, forumRepository);
  return res.status(201).json(result);
}

async function getPostList(req, res) {
  const result = await forumService.getPostList(getRequestContext(req), req.params.communityId, req.query, forumRepository);
  return res.status(200).json(result);
}

async function getPostDetail(req, res) {
  const result = await forumService.getPostDetail(getRequestContext(req), req.params.communityId, req.params.postId, forumRepository);
  return res.status(200).json(result);
}

async function updatePost(req, res) {
  const result = await forumService.updatePost(getRequestContext(req), req.params.communityId, req.params.postId, req.body, forumRepository);
  return res.status(200).json(result);
}

async function deletePost(req, res) {
  const result = await forumService.deletePost(getRequestContext(req), req.params.communityId, req.params.postId, forumRepository);
  return res.status(200).json(result);
}

async function createComment(req, res) {
  const result = await forumService.createComment(getRequestContext(req), req.params.communityId, req.params.postId, req.body, forumRepository);
  return res.status(201).json(result);
}

async function getCommentList(req, res) {
  const result = await forumService.getCommentList(getRequestContext(req), req.params.communityId, req.params.postId, req.query, forumRepository);
  return res.status(200).json(result);
}

async function updateComment(req, res) {
  const result = await forumService.updateComment(getRequestContext(req), req.params.communityId, req.params.commentId, req.body, forumRepository);
  return res.status(200).json(result);
}

async function deleteComment(req, res) {
  const result = await forumService.deleteComment(getRequestContext(req), req.params.communityId, req.params.commentId, forumRepository);
  return res.status(200).json(result);
}

async function togglePostLike(req, res) {
  const result = await forumService.togglePostLike(getRequestContext(req), req.params.communityId, req.params.postId, forumRepository);
  return res.status(200).json(result);
}

async function toggleCommentLike(req, res) {
  const result = await forumService.toggleCommentLike(getRequestContext(req), req.params.communityId, req.params.commentId, forumRepository);
  return res.status(200).json(result);
}

async function voteOnPoll(req, res) {
  const result = await forumService.voteOnPoll(getRequestContext(req), req.params.communityId, req.params.pollId, req.body, forumRepository);
  return res.status(200).json(result);
}

async function pinPost(req, res) {
  const result = await forumService.setPostPinned(getRequestContext(req), req.params.communityId, req.params.postId, true, forumRepository);
  return res.status(200).json(result);
}

async function unpinPost(req, res) {
  const result = await forumService.setPostPinned(getRequestContext(req), req.params.communityId, req.params.postId, false, forumRepository);
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