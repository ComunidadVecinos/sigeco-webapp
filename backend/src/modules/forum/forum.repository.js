// Repositorio de forum: concentra persistencia de publicaciones, comentarios, encuestas y reacciones.
// Flujo cubierto: servicio -> queries/transacciones Prisma -> entidades listas para mapear, contar o anonimizar.
// Expone lecturas, escrituras, agregados y utilidades de limpieza usadas también por otros módulos.
// Lo consumen forum.service.js y, de forma puntual, users.repository.js.
const prisma = require('../../lib/prisma');

const membershipAuthorSelect = {
  id: true,
  alias: true,
  role: true,
  user: { select: { avatar: { select: { storagePath: true } } } }
};

const forumPostSelect = {
  id: true,
  communityId: true,
  authorMembershipId: true,
  pollId: true,
  title: true,
  description: true,
  category: true,
  pinned: true,
  editedAt: true,
  isDeleted: true,
  lastActivityAt: true,
  createdAt: true,
  authorMembership: { select: membershipAuthorSelect }
};

const forumCommentSelect = {
  id: true,
  postId: true,
  authorMembershipId: true,
  content: true,
  editedAt: true,
  isDeleted: true,
  createdAt: true,
  authorMembership: { select: membershipAuthorSelect }
};

const forumPollSelect = {
  id: true,
  communityId: true,
  title: true,
  description: true,
  startsAt: true,
  endsAt: true,
  closedAt: true,
  createdAt: true,
  deletedAt: true,
  options: {
    select: { id: true, pollId: true, title: true, sortOrder: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
  },
  forumPost: { select: { id: true, isDeleted: true } }
};

// --- Helpers comunes ---
function buildForumPostWhere({ communityId, category, createdFrom, createdToExclusive }) {
  return {
    communityId,
    isDeleted: false,
    ...(category ? { category } : {}),
    ...(createdFrom || createdToExclusive
      ? { createdAt: { ...(createdFrom ? { gte: createdFrom } : {}), ...(createdToExclusive ? { lt: createdToExclusive } : {}) } }
      : {})
  };
}

function buildForumPostOrderBy(sortBy) {
  if (sortBy === 'likes') {
    return [
      { pinned: 'desc' },
      { likes: { _count: 'desc' } },
      { lastActivityAt: 'desc' },
      { createdAt: 'desc' },
      { id: 'asc' }
    ];
  }
  if (sortBy === 'lastActivityAt') {
    return [
      { pinned: 'desc' },
      { lastActivityAt: 'desc' },
      { createdAt: 'desc' },
      { id: 'asc' }
    ];
  }
  return [{ pinned: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }];
}

function buildForumCommentOrderBy(sortBy) {
  if (sortBy === 'likes') {
    return [{ likes: { _count: 'desc' } }, { createdAt: 'asc' }, { id: 'asc' }];
  }
  return [{ createdAt: 'asc' }, { id: 'asc' }];
}

async function withTransaction(callback) {
  return prisma.$transaction(callback);
}

// --- Encuestas del foro ---
async function createForumPoll(db, input) {
  return db.poll.create({
    data: {
      communityId: input.communityId,
      kind: 'FORUM_POLL',
      title: input.title,
      description: input.description || null,
      startsAt: input.startsAt,
      endsAt: input.endsAt || null,
      createdByMembershipId: input.createdByMembershipId,
      options: { create: input.options.map((option, index) => ({ title: option.title, sortOrder: index })) }
    },
    select: forumPollSelect
  });
}

async function updateForumPoll(db, { communityId, pollId, data }) {
  const updated = await db.poll.updateMany({
    where: { id: pollId, communityId, kind: 'FORUM_POLL', deletedAt: null },
    data
  });

  if (updated.count !== 1) {
    return null;
  }

  return db.poll.findFirst({
    where: { id: pollId, communityId, kind: 'FORUM_POLL' },
    select: forumPollSelect
  });
}

async function softDeleteForumPoll(db, { communityId, pollId, deletedAt }) {
  return db.poll.updateMany({
    where: { id: pollId, communityId, kind: 'FORUM_POLL', deletedAt: null },
    data: { deletedAt, closedAt: deletedAt, closedByMembershipId: null }
  });
}

async function softDeleteForumPollsByIds(db, pollIds, deletedAt) {
  if (!pollIds || pollIds.length === 0) {
    return { count: 0 };
  }
  return db.poll.updateMany({
    where: { id: { in: pollIds }, kind: 'FORUM_POLL', deletedAt: null },
    data: { deletedAt, closedAt: deletedAt, closedByMembershipId: null }
  });
}

async function findForumPollById({ communityId, pollId }) {
  return prisma.poll.findFirst({
    where: { id: pollId, communityId, kind: 'FORUM_POLL' },
    select: forumPollSelect
  });
}

async function findForumPollsByIds(pollIds) {
  if (!pollIds || pollIds.length === 0) {
    return [];
  }
  return prisma.poll.findMany({
    where: { id: { in: pollIds }, kind: 'FORUM_POLL', deletedAt: null },
    select: forumPollSelect
  });
}

async function findForumPollVoteCountsByPollIds(pollIds) {
  if (!pollIds || pollIds.length === 0) {
    return [];
  }
  return prisma.pollVote.groupBy({
    by: ['pollId', 'optionId'],
    where: { pollId: { in: pollIds } },
    _count: { _all: true }
  });
}

async function findMembershipPollVotesByPollIds({ membershipId, pollIds }) {
  if (!pollIds || pollIds.length === 0) {
    return [];
  }

  return prisma.pollVote.findMany({
    where: { membershipId, pollId: { in: pollIds } },
    select: { pollId: true, optionId: true }
  });
}

async function insertForumPollVote(db, input) {
  return db.pollVote.create({
    data: {
      pollId: input.pollId,
      optionId: input.optionId,
      membershipId: input.membershipId
    },
    select: { id: true, pollId: true, optionId: true, membershipId: true, createdAt: true }
  });
}

// --- Publicaciones del foro ---
async function createForumPost(db, input) {
  return db.forumPost.create({
    data: {
      communityId: input.communityId,
      authorMembershipId: input.authorMembershipId,
      pollId: input.pollId || null,
      title: input.title,
      description: input.description,
      category: input.category,
      pinned: input.pinned || false,
      editedAt: input.editedAt || null,
      isDeleted: false,
      lastActivityAt: input.lastActivityAt || input.createdAt || undefined,
      createdAt: input.createdAt || undefined
    },
    select: forumPostSelect
  });
}

async function findForumPostPage({ communityId, category, createdFrom, createdToExclusive, sortBy, page, pageSize }) {
  const where = buildForumPostWhere({ communityId, category, createdFrom, createdToExclusive });
  const skip = (page - 1) * pageSize;

  const [total, items] = await prisma.$transaction([
    prisma.forumPost.count({ where }),
    prisma.forumPost.findMany({
      where,
      select: forumPostSelect,
      orderBy: buildForumPostOrderBy(sortBy),
      skip,
      take: pageSize
    })
  ]);
  return { total, items };
}

async function findForumPostById({ communityId, postId }) {
  return prisma.forumPost.findFirst({
    where: { id: postId, communityId },
    select: forumPostSelect
  });
}

async function updateForumPost(db, { communityId, postId, data }) {
  const updated = await db.forumPost.updateMany({
    where: { id: postId, communityId, isDeleted: false },
    data
  });
  if (updated.count !== 1) {
    return null;
  }
  return db.forumPost.findFirst({
    where: { id: postId, communityId },
    select: forumPostSelect
  });
}

async function setForumPostPinned(db, { communityId, postId, pinned }) {
  const updated = await db.forumPost.updateMany({
    where: { id: postId, communityId, isDeleted: false },
    data: { pinned }
  });
  if (updated.count !== 1) {
    return null;
  }
  return db.forumPost.findFirst({
    where: { id: postId, communityId },
    select: forumPostSelect
  });
}

async function softDeleteForumPost(db, { communityId, postId, deletedAt }) {
  const updated = await db.forumPost.updateMany({
    where: { id: postId, communityId, isDeleted: false },
    data: { isDeleted: true, pinned: false, authorMembershipId: null, editedAt: null }
  });
  if (updated.count !== 1) {
    return null;
  }
  return db.forumPost.findFirst({
    where: { id: postId, communityId },
    select: forumPostSelect
  });
}

async function updateForumPostLastActivity(db, { postId, lastActivityAt }) {
  return db.forumPost.updateMany({
    where: { id: postId, isDeleted: false },
    data: { lastActivityAt }
  });
}

// --- Comentarios del foro ---
async function findForumCommentPage({ communityId, postId, sortBy, page, pageSize }) {
  const where = { postId, post: { communityId, isDeleted: false } };
  const skip = (page - 1) * pageSize;

  const [total, items] = await prisma.$transaction([
    prisma.forumComment.count({ where }),
    prisma.forumComment.findMany({
      where,
      select: forumCommentSelect,
      orderBy: buildForumCommentOrderBy(sortBy),
      skip,
      take: pageSize
    })
  ]);

  return { total, items };
}

async function findForumCommentById({ communityId, commentId }) {
  return prisma.forumComment.findFirst({
    where: { id: commentId, post: { communityId } },
    select: forumCommentSelect
  });
}

async function createForumComment(db, input) {
  return db.forumComment.create({
    data: {
      postId: input.postId,
      authorMembershipId: input.authorMembershipId,
      content: input.content,
      editedAt: null,
      isDeleted: false,
      createdAt: input.createdAt || undefined
    },
    select: forumCommentSelect
  });
}

async function updateForumComment(db, { postId, commentId, data }) {
  const updated = await db.forumComment.updateMany({
    where: { id: commentId, postId, isDeleted: false },
    data
  });

  if (updated.count !== 1) {
    return null;
  }

  return db.forumComment.findFirst({
    where: { id: commentId, postId },
    select: forumCommentSelect
  });
}

async function anonymizeForumComment(db, { postId, commentId, deletedContent }) {
  const updated = await db.forumComment.updateMany({
    where: { id: commentId, postId, isDeleted: false },
    data: {
      content: deletedContent,
      editedAt: null,
      isDeleted: true,
      authorMembershipId: null
    }
  });

  if (updated.count !== 1) {
    return null;
  }

  await db.forumCommentLike.deleteMany({ where: { commentId } });

  return db.forumComment.findFirst({
    where: { id: commentId, postId },
    select: forumCommentSelect
  });
}

// --- Contadores y reacciones ---
async function findForumCommentCountsByPostIds(postIds) {
  if (!postIds || postIds.length === 0) {
    return [];
  }
  return prisma.forumComment.groupBy({
    by: ['postId'],
    where: { postId: { in: postIds } },
    _count: { _all: true }
  });
}

async function findForumPostLikeCountsByPostIds(postIds) {
  if (!postIds || postIds.length === 0) {
    return [];
  }

  return prisma.forumPostLike.groupBy({
    by: ['postId'],
    where: { postId: { in: postIds } },
    _count: { _all: true }
  });
}

async function findForumCommentLikeCountsByCommentIds(commentIds) {
  if (!commentIds || commentIds.length === 0) {
    return [];
  }
  return prisma.forumCommentLike.groupBy({
    by: ['commentId'],
    where: { commentId: { in: commentIds } },
    _count: { _all: true }
  });
}

async function findForumPostLike({ membershipId, postId }) {
  return prisma.forumPostLike.findFirst({
    where: { membershipId, postId },
    select: { postId: true, membershipId: true }
  });
}

async function createForumPostLike(input) {
  return prisma.forumPostLike.create({
    data: { membershipId: input.membershipId, postId: input.postId },
    select: { postId: true, membershipId: true }
  });
}

async function deleteForumPostLike({ membershipId, postId }) {
  return prisma.forumPostLike.deleteMany({ where: { membershipId, postId } });
}

async function countForumPostLikes(postId) {
  return prisma.forumPostLike.count({ where: { postId } });
}

async function findForumCommentLike({ membershipId, commentId }) {
  return prisma.forumCommentLike.findFirst({
    where: { membershipId, commentId },
    select: { commentId: true, membershipId: true }
  });
}

async function createForumCommentLike(input) {
  return prisma.forumCommentLike.create({
    data: { membershipId: input.membershipId, commentId: input.commentId },
    select: { commentId: true, membershipId: true }
  });
}

async function deleteForumCommentLike({ membershipId, commentId }) {
  return prisma.forumCommentLike.deleteMany({ where: { membershipId, commentId } });
}

async function countForumCommentLikes(commentId) {
  return prisma.forumCommentLike.count({ where: { commentId } });
}

// --- Limpieza usada por otros módulos ---
async function deleteForumLikesByMembershipIds(db, membershipIds) {
  if (!membershipIds || membershipIds.length === 0) {
    return { postLikes: 0, commentLikes: 0 };
  }

  const [postLikesResult, commentLikesResult] = await Promise.all([
    db.forumPostLike.deleteMany({ where: { membershipId: { in: membershipIds } } }),
    db.forumCommentLike.deleteMany({ where: { membershipId: { in: membershipIds } } })
  ]);

  return {
    postLikes: postLikesResult.count,
    commentLikes: commentLikesResult.count
  };
}

async function softDeleteForumPostsByMembershipIds(db, membershipIds, deletedAt) {
  if (!membershipIds || membershipIds.length === 0) {
    return { count: 0 };
  }

  const posts = await db.forumPost.findMany({
    where: { authorMembershipId: { in: membershipIds }, isDeleted: false },
    select: { id: true, pollId: true }
  });
  if (posts.length === 0) {
    return { count: 0 };
  }

  const postIds = posts.map((post) => post.id);
  const pollIds = posts.map((post) => post.pollId).filter(Boolean);

  // Al borrar el autor, el post desaparece y su encuesta deja de estar disponible.
  const result = await db.forumPost.updateMany({
    where: { id: { in: postIds }, isDeleted: false },
    data: { isDeleted: true, pinned: false, authorMembershipId: null, editedAt: null }
  });
  await softDeleteForumPollsByIds(db, pollIds, deletedAt);

  return result;
}

async function anonymizeForumCommentsByMembershipIds(db, membershipIds) {
  if (!membershipIds || membershipIds.length === 0) {
    return { count: 0 };
  }

  const comments = await db.forumComment.findMany({
    where: { authorMembershipId: { in: membershipIds }, isDeleted: false },
    select: { id: true }
  });
  if (comments.length === 0) {
    return { count: 0 };
  }

  const commentIds = comments.map((comment) => comment.id);
  // El comentario se mantiene en el hilo, pero sin contenido editable ni autor identificado.
  const result = await db.forumComment.updateMany({
    where: { id: { in: commentIds }, isDeleted: false },
    data: {
      content: 'El contenido ha sido eliminado por el autor',
      editedAt: null,
      isDeleted: true,
      authorMembershipId: null
    }
  });

  await db.forumCommentLike.deleteMany({ where: { commentId: { in: commentIds } } });

  return result;
}

module.exports = {
  withTransaction,
  createForumPoll,
  updateForumPoll,
  softDeleteForumPoll,
  findForumPollById,
  findForumPollsByIds,
  findForumPollVoteCountsByPollIds,
  findMembershipPollVotesByPollIds,
  insertForumPollVote,
  createForumPost,
  findForumPostPage,
  findForumPostById,
  updateForumPost,
  setForumPostPinned,
  softDeleteForumPost,
  updateForumPostLastActivity,
  findForumCommentPage,
  findForumCommentById,
  createForumComment,
  updateForumComment,
  anonymizeForumComment,
  findForumCommentCountsByPostIds,
  findForumPostLikeCountsByPostIds,
  findForumCommentLikeCountsByCommentIds,
  findForumPostLike,
  createForumPostLike,
  deleteForumPostLike,
  countForumPostLikes,
  findForumCommentLike,
  createForumCommentLike,
  deleteForumCommentLike,
  countForumCommentLikes,
  deleteForumLikesByMembershipIds,
  softDeleteForumPostsByMembershipIds,
  anonymizeForumCommentsByMembershipIds
};