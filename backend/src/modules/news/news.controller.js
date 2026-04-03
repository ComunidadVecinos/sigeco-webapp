// Controladores HTTP del módulo news.
const newsRepository = require('./news.repository');
const newsService = require('./news.service');

function getRequestContext(req) {
  return { userId: req.user.id };
}

async function createNews(req, res) {
  const result = await newsService.createNews(
    getRequestContext(req),
    req.params.communityId,
    { ...req.body, imageFile: req.file || null },
    newsRepository
  );
  return res.status(201).json(result);
}

async function getNewsList(req, res) {
  const result = await newsService.getNewsList(getRequestContext(req), req.params.communityId, req.query, newsRepository);
  return res.status(200).json(result);
}

async function getNewsDetail(req, res) {
  const result = await newsService.getNewsDetail(getRequestContext(req), req.params.communityId, req.params.newsId, newsRepository);
  return res.status(200).json(result);
}

async function updateNews(req, res) {
  const result = await newsService.updateNews(
    getRequestContext(req),
    req.params.communityId,
    req.params.newsId,
    { ...req.body, imageFile: req.file || null },
    newsRepository
  );
  return res.status(200).json(result);
}

async function deleteNews(req, res) {
  const result = await newsService.deleteNews(getRequestContext(req), req.params.communityId, req.params.newsId, newsRepository);
  return res.status(200).json(result);
}

async function deleteNewsImage(req, res) {
  const result = await newsService.deleteNewsImage(getRequestContext(req), req.params.communityId, req.params.newsId, newsRepository);
  return res.status(200).json(result);
}

module.exports = { createNews, getNewsList, getNewsDetail, updateNews, deleteNews, deleteNewsImage };