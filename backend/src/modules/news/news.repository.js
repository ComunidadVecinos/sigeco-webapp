// Repositorio de news: persiste el tablón comunitario, su imagen y las limpiezas asociadas.
// Flujo cubierto: servicio -> queries/transacciones Prisma -> entidades listas para mapear o validar.
// Expone lecturas, creación, edición, borrado lógico y anonimización de noticias.
// Lo consume news.service.js y, para limpieza de cuenta, users.repository.js.
const prisma = require('../../lib/prisma');

// --- Selects compartidos ---
const newsAuthorSelect = { alias: true };

// Campos necesarios para listar, leer y volver a cargar una noticia tras crearla o editarla.
const communityNewsSelect = {
  id: true,
  authorMembershipId: true,
  title: true,
  description: true,
  imageStoragePath: true,
  imageMimeType: true,
  imageSizeBytes: true,
  eventStartsAt: true,
  eventEndsAt: true,
  editedAt: true,
  createdAt: true,
  deletedAt: true,
  authorMembership: { select: newsAuthorSelect }
};

// --- Helpers comunes ---
function buildPageArgs(page, pageSize) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

// Filtros del tablón: búsqueda por título, rango de creación y separación entre noticia/evento.
function buildCommunityNewsWhere({ communityId, search, createdFrom, createdToExclusive, eventType }) {
  const conditions = [];
  if (search) {
    conditions.push({ title: { contains: search, mode: 'insensitive' } });
  }
  if (createdFrom || createdToExclusive) {
    conditions.push({ createdAt: { ...(createdFrom ? { gte: createdFrom } : {}), ...(createdToExclusive ? { lt: createdToExclusive } : {}) } });
  }
  if (eventType === 'event') {
    conditions.push({ eventStartsAt: { not: null } });
  }
  if (eventType === 'nonEvent') {
    conditions.push({ eventStartsAt: null });
  }
  return { communityId, deletedAt: null, ...(conditions.length > 0 ? { AND: conditions } : {}) };
}

async function withTransaction(callback) {
  return prisma.$transaction(callback);
}

// --- Noticias comunitarias: POST ---
async function createNews(db, input) {
  return db.communityNews.create({
    data: {
      id: input.id,
      communityId: input.communityId,
      authorMembershipId: input.authorMembershipId,
      title: input.title,
      description: input.description,
      imageStoragePath: input.imageStoragePath || null,
      imageMimeType: input.imageMimeType || null,
      imageSizeBytes: input.imageSizeBytes || null,
      eventStartsAt: input.eventStartsAt || null,
      eventEndsAt: input.eventEndsAt || null
    },
    select: communityNewsSelect
  });
}

// --- Noticias comunitarias: GET ---
async function findNewsPage({ communityId, search, createdFrom, createdToExclusive, eventType, page, pageSize }) {
  const where = buildCommunityNewsWhere({ communityId, search, createdFrom, createdToExclusive, eventType });
  const { skip, take } = buildPageArgs(page, pageSize);
  const [total, items] = await prisma.$transaction([
    prisma.communityNews.count({ where }),
    prisma.communityNews.findMany({
      where,
      select: communityNewsSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take
    })
  ]);
  return { total, items };
}

async function findNewsById({ communityId, newsId }) {
  return prisma.communityNews.findFirst({
    where: { id: newsId, communityId },
    select: communityNewsSelect
  });
}

// --- Noticias comunitarias: PATCH ---
async function updateNews(db, { communityId, newsId, data }) {
  const updated = await db.communityNews.updateMany({
    where: { id: newsId, communityId, deletedAt: null },
    data
  });
  if (updated.count !== 1) {
    return null;
  }
  return db.communityNews.findFirst({
    where: { id: newsId, communityId },
    select: communityNewsSelect
  });
}

async function removeNewsImage(db, { communityId, newsId }) {
  const updated = await db.communityNews.updateMany({
    where: { id: newsId, communityId, deletedAt: null },
    data: { imageStoragePath: null, imageMimeType: null, imageSizeBytes: null }
  });
  if (updated.count !== 1) {
    return null;
  }
  return db.communityNews.findFirst({
    where: { id: newsId, communityId },
    select: communityNewsSelect
  });
}

// --- Noticias comunitarias: DELETE lógico ---
async function softDeleteNews(db, { communityId, newsId, deletedAt }) {
  const updated = await db.communityNews.updateMany({
    where: { id: newsId, communityId, deletedAt: null },
    data: { deletedAt }
  });
  return updated.count === 1;
}

// --- Limpieza transversal ---
async function anonymizeNewsByMembershipIds(db, membershipIds) {
  if (!membershipIds || membershipIds.length === 0) {
    return { count: 0 };
  }
  return db.communityNews.updateMany({
    where: { authorMembershipId: { in: membershipIds } },
    data: { authorMembershipId: null }
  });
}

module.exports = {
  withTransaction,
  createNews,
  findNewsPage,
  findNewsById,
  updateNews,
  softDeleteNews,
  removeNewsImage,
  anonymizeNewsByMembershipIds
};