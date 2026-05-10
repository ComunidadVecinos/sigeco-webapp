// Capa HTTP de news: baja el tablón de noticias a respuestas y formatos del API.
// Flujo cubierto: request autenticada y validada -> servicio -> JSON HTTP.
// Expone controladores para crear, listar, editar y borrar noticias e imágenes.
// Lo consumen las rutas del módulo con asyncHandler.
const newsRepository = require('./news.repository');
const newsService = require('./news.service');

function requestContext(req) {
  return { userId: req.user.id };
}

// --- Noticias comunitarias: POST ---
async function createNews(req, res) {
  const result = await newsService.createNews(
    requestContext(req),
    req.params.communityId,
    { ...req.body, imageFile: req.file || null },
    newsRepository
  );
  return res.status(201).json(result);
}

// --- Noticias comunitarias: GET ---
async function getNewsList(req, res) {
  const result = await newsService.getNewsList(requestContext(req), req.params.communityId, req.query, newsRepository);
  return res.status(200).json(result);
}

async function getNewsDetail(req, res) {
  const result = await newsService.getNewsDetail(requestContext(req), req.params.communityId, req.params.newsId, newsRepository);
  return res.status(200).json(result);
}

// --- Noticias comunitarias: PATCH ---
async function updateNews(req, res) {
  const result = await newsService.updateNews(
    requestContext(req),
    req.params.communityId,
    req.params.newsId,
    { ...req.body, imageFile: req.file || null },
    newsRepository
  );
  return res.status(200).json(result);
}

// --- Noticias comunitarias: DELETE ---
async function deleteNews(req, res) {
  const result = await newsService.deleteNews(requestContext(req), req.params.communityId, req.params.newsId, newsRepository);
  return res.status(200).json(result);
}

async function deleteNewsImage(req, res) {
  const result = await newsService.deleteNewsImage(requestContext(req), req.params.communityId, req.params.newsId, newsRepository);
  return res.status(200).json(result);
}

module.exports = { createNews, getNewsList, getNewsDetail, updateNews, deleteNews, deleteNewsImage };