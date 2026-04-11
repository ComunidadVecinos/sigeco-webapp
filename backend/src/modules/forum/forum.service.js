// Servicio del modulo forum.
const { Prisma } = require('@prisma/client');

const { ConflictError, ForbiddenError, NotFoundError, ValidationError } = require('../../lib/errors');
const { startOfBusinessDayUtc, startOfNextBusinessDayUtc } = require('../../lib/datetime/businessTime');
const storageService = require('../../lib/storage/storage');
const membersRepository = require('../members/members.repository');
const membersService = require('../members/members.service');

const DELETED_COMMENT_CONTENT_BY_AUTHOR = 'El contenido ha sido eliminado por el autor';
const DELETED_COMMENT_CONTENT_BY_ADMIN = 'El contenido ha sido eliminado por el administrador';

function buildValidationDetail(field, message, location = 'body') {
  return [{ field, location, message }];
}

function assertValidForumPollEndDate(startsAt, endsAt) {
  if (endsAt > startsAt) {
    return;
  }

  throw new ValidationError(
    buildValidationDetail('poll.endsAt', 'La fecha y hora de cierre deben ser posteriores al momento actual'),
    { message: 'La fecha de cierre de la encuesta no es válida' }
  );
}

function buildPollEndsAtFromInput(input, now) {
  if (!input.poll || !input.poll.endsAt) {
    return null;
  }

  const endsAt = input.poll.endsAt;

  if (!endsAt) {
    throw new ValidationError(
      buildValidationDetail('poll.endsAt', 'La fecha y hora de cierre no son válidas'),
      { message: 'La fecha de cierre de la encuesta no es válida' }
    );
  }

  assertValidForumPollEndDate(now, endsAt);
  return endsAt;
}

function isAdministrativeMembership(membership) {
  return membership?.role === 'PRESIDENT' || membership?.role === 'VICE_PRESIDENT';
}

function mapAuthor(membership) {
  if (!membership) {
    return null;
  }

  return {
    membershipId: membership.id,
    alias: membership.alias || null,
    profileImageUrl: storageService.getPublicFileUrl(membership.user?.avatar?.storagePath || null),
    role: membership.role
  };
}

function buildCountMap(rows, keyField) {
  const countMap = new Map();

  for (const row of rows) {
    countMap.set(row[keyField], row._count._all);
  }

  return countMap;
}

function buildVoteCountMap(rows) {
  const countMap = new Map();

  for (const row of rows) {
    countMap.set(`${row.pollId}:${row.optionId}`, row._count._all);
  }

  return countMap;
}

function buildMembershipVoteMap(votes) {
  return new Map(votes.map((vote) => [vote.pollId, vote.optionId]));
}

function buildPollMap(polls) {
  return new Map(polls.map((poll) => [poll.id, poll]));
}

function isForumPollOpen(poll, now = new Date()) {
  if (!poll || poll.deletedAt || poll.closedAt) {
    return false;
  }

  if (poll.startsAt > now) {
    return false;
  }

  if (poll.endsAt && poll.endsAt <= now) {
    return false;
  }

  return true;
}

function mapForumPoll(poll, voteCountMap, membershipVoteMap, now = new Date()) {
  if (!poll) {
    return null;
  }

  const options = poll.options.map((option) => ({ id: option.id, title: option.title, votes: voteCountMap.get(`${poll.id}:${option.id}`) || 0 }));
  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);

  return {
    id: poll.id,
    title: poll.title,
    description: poll.description || null,
    startsAt: poll.startsAt.toISOString(),
    endsAt: poll.endsAt ? poll.endsAt.toISOString() : null,
    status: isForumPollOpen(poll, now) ? 'OPEN' : 'CLOSED',
    totalVotes,
    myVoteOptionId: membershipVoteMap.get(poll.id) || null,
    options
  };
}

function mapForumPost(post, context) {
  const poll = post.pollId ? context.pollMap.get(post.pollId) || null : null;

  return {
    id: post.id,
    title: post.title,
    description: post.description,
    category: post.category,
    pinned: post.pinned,
    editedAt: post.editedAt ? post.editedAt.toISOString() : null,
    lastActivityAt: post.lastActivityAt.toISOString(),
    createdAt: post.createdAt.toISOString(),
    author: mapAuthor(post.authorMembership),
    likesCount: context.likeCountMap.get(post.id) || 0,
    commentsCount: context.commentCountMap.get(post.id) || 0,
    poll: mapForumPoll(poll, context.voteCountMap, context.membershipVoteMap, context.now)
  };
}

function mapForumComment(comment, context) {
  const isDeleted = Boolean(comment.isDeleted);

  return {
    id: comment.id,
    postId: comment.postId,
    content: isDeleted ? (comment.content || DELETED_COMMENT_CONTENT_BY_AUTHOR) : comment.content,
    editedAt: comment.editedAt ? comment.editedAt.toISOString() : null,
    isDeleted,
    createdAt: comment.createdAt.toISOString(),
    author: isDeleted ? null : mapAuthor(comment.authorMembership),
    likesCount: isDeleted ? 0 : (context.likeCountMap.get(comment.id) || 0)
  };
}

function buildPagination(page, pageSize, total) {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

async function requireForumAccess(userId, communityId) {
  return membersService.requireOperationalCommunityAccess(userId, communityId, membersRepository);
}

async function requireForumAdministrativeAccess(userId, communityId) {
  return membersService.requireAdministrativeCommunityAccess(userId, communityId, membersRepository);
}

async function requireExistingPost(communityId, postId, forumRepository) {
  const post = await forumRepository.findForumPostById({ communityId, postId });

  if (!post) {
    throw new NotFoundError('Publicaci\u00f3n no encontrada');
  }

  return post;
}

async function requireVisiblePost(communityId, postId, forumRepository) {
  const post = await requireExistingPost(communityId, postId, forumRepository);

  if (post.isDeleted) {
    throw new NotFoundError('Publicaci\u00f3n no encontrada');
  }

  return post;
}

async function requireExistingComment(communityId, commentId, forumRepository) {
  const comment = await forumRepository.findForumCommentById({ communityId, commentId });

  if (!comment) {
    throw new NotFoundError('Comentario no encontrado');
  }

  return comment;
}

function assertPostIsAvailable(post, message) {
  if (!post.isDeleted) {
    return;
  }

  throw new ConflictError(message);
}

function assertCommentIsAvailable(comment, message) {
  if (!comment.isDeleted) {
    return;
  }

  throw new ConflictError(message);
}

function assertCanEditPost(actorMembership, post) {
  if (post.authorMembershipId === actorMembership.id) {
    return;
  }

  throw new ForbiddenError('No tienes permisos para editar esta publicaci\u00f3n');
}

function assertCanDeletePost(actorMembership, post) {
  if (post.authorMembershipId === actorMembership.id || isAdministrativeMembership(actorMembership)) {
    return;
  }

  throw new ForbiddenError('No tienes permisos para eliminar esta publicaci\u00f3n');
}

function assertCanEditComment(actorMembership, comment) {
  if (comment.authorMembershipId === actorMembership.id) {
    return;
  }

  throw new ForbiddenError('No tienes permisos para editar este comentario');
}

function assertCanDeleteComment(actorMembership, comment) {
  if (comment.authorMembershipId === actorMembership.id || isAdministrativeMembership(actorMembership)) {
    return;
  }

  throw new ForbiddenError('No tienes permisos para eliminar este comentario');
}

async function buildForumPostResponses(posts, membershipId, forumRepository, now = new Date()) {
  if (!posts || posts.length === 0) {
    return [];
  }

  const postIds = posts.map((post) => post.id);
  const pollIds = posts.map((post) => post.pollId).filter(Boolean);

  // Solo hidratamos la pagina actual para mantener simple la consulta principal.
  const [commentCounts, likeCounts, polls, voteCounts, membershipVotes] = await Promise.all([
    forumRepository.findForumCommentCountsByPostIds(postIds),
    forumRepository.findForumPostLikeCountsByPostIds(postIds),
    forumRepository.findForumPollsByIds(pollIds),
    forumRepository.findForumPollVoteCountsByPollIds(pollIds),
    forumRepository.findMembershipPollVotesByPollIds({ membershipId, pollIds })
  ]);

  const context = {
    now,
    commentCountMap: buildCountMap(commentCounts, 'postId'),
    likeCountMap: buildCountMap(likeCounts, 'postId'),
    pollMap: buildPollMap(polls),
    voteCountMap: buildVoteCountMap(voteCounts),
    membershipVoteMap: buildMembershipVoteMap(membershipVotes)
  };

  return posts.map((post) => mapForumPost(post, context));
}

async function buildForumCommentResponses(comments, forumRepository) {
  if (!comments || comments.length === 0) {
    return [];
  }

  const commentIds = comments.map((comment) => comment.id);
  const likeCounts = await forumRepository.findForumCommentLikeCountsByCommentIds(commentIds);
  return comments.map((comment) => mapForumComment(comment, { likeCountMap: buildCountMap(likeCounts, 'commentId') }));
}

async function createPost(context, communityId, input, forumRepository) {
  const { membership } = await requireForumAccess(context.userId, communityId);
  const now = new Date();
  const pollEndsAt = buildPollEndsAtFromInput(input, now);

  const createdPost = await forumRepository.withTransaction(async (tx) => {
    let poll = null;

    // La encuesta se crea antes para enlazar el post dentro de la misma transaccion.
    if (input.category === 'POLL') {
      poll = await forumRepository.createForumPoll(tx, {
        communityId,
        title: input.poll.title,
        description: input.poll.description,
        startsAt: now,
        endsAt: pollEndsAt,
        createdByMembershipId: membership.id,
        options: input.poll.options
      });
    }

    return forumRepository.createForumPost(tx, {
      communityId,
      authorMembershipId: membership.id,
      pollId: poll?.id || null,
      title: input.title,
      description: input.description,
      category: input.category,
      createdAt: now,
      lastActivityAt: now
    });
  });

  const [item] = await buildForumPostResponses([createdPost], membership.id, forumRepository, now);
  return item;
}

async function getPostList(context, communityId, input, forumRepository) {
  const { membership } = await requireForumAccess(context.userId, communityId);
  const pageResult = await forumRepository.findForumPostPage({
    communityId,
    category: input.category,
    createdFrom: input.from ? startOfBusinessDayUtc(input.from) : undefined,
    createdToExclusive: input.to ? startOfNextBusinessDayUtc(input.to) : undefined,
    sortBy: input.sortBy,
    page: input.page,
    pageSize: input.pageSize
  });

  return {
    items: await buildForumPostResponses(pageResult.items, membership.id, forumRepository),
    pagination: buildPagination(input.page, input.pageSize, pageResult.total)
  };
}

async function getPostDetail(context, communityId, postId, forumRepository) {
  const { membership } = await requireForumAccess(context.userId, communityId);
  const post = await requireVisiblePost(communityId, postId, forumRepository);
  const [item] = await buildForumPostResponses([post], membership.id, forumRepository);
  return item;
}

async function updatePost(context, communityId, postId, input, forumRepository) {
  const { membership } = await requireForumAccess(context.userId, communityId);
  const post = await requireExistingPost(communityId, postId, forumRepository);

  assertPostIsAvailable(post, 'La publicaci\u00f3n ya no est\u00e1 disponible');
  assertCanEditPost(membership, post);

  await forumRepository.withTransaction(async (tx) => {
    const updatedPost = await forumRepository.updateForumPost(tx, {
      communityId,
      postId,
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        editedAt: new Date()
      }
    });

    if (!updatedPost) {
      throw new ConflictError('No se ha podido actualizar la publicaci\u00f3n');
    }
  });

  return getPostDetail(context, communityId, postId, forumRepository);
}

async function deletePost(context, communityId, postId, forumRepository) {
  const { membership } = await requireForumAccess(context.userId, communityId);
  const post = await requireExistingPost(communityId, postId, forumRepository);

  assertPostIsAvailable(post, 'La publicaci\u00f3n ya est\u00e1 eliminada');
  assertCanDeletePost(membership, post);

  const deletedAt = new Date();
  await forumRepository.withTransaction(async (tx) => {
    const deletedPost = await forumRepository.softDeleteForumPost(tx, { communityId, postId, deletedAt });

    if (!deletedPost) {
      throw new ConflictError('No se ha podido eliminar la publicaci\u00f3n');
    }

    if (!post.pollId) {
      return;
    }

    const deletedPollResult = await forumRepository.softDeleteForumPoll(tx, { communityId, pollId: post.pollId, deletedAt });

    if (deletedPollResult.count !== 1) {
      throw new ConflictError('No se ha podido eliminar la encuesta asociada a la publicaci\u00f3n');
    }
  });

  return { deleted: true, postId };
}

async function createComment(context, communityId, postId, input, forumRepository) {
  const { membership } = await requireForumAccess(context.userId, communityId);
  await requireVisiblePost(communityId, postId, forumRepository);
  const createdAt = new Date();

  const comment = await forumRepository.withTransaction(async (tx) => {
    const createdComment = await forumRepository.createForumComment(tx, {
      postId,
      authorMembershipId: membership.id,
      content: input.content,
      createdAt
    });

    // La actividad reciente del hilo se mueve al ultimo comentario persistido.
    await forumRepository.updateForumPostLastActivity(tx, { postId, lastActivityAt: createdAt });
    return createdComment;
  });

  const [item] = await buildForumCommentResponses([comment], forumRepository);
  return item;
}

async function getCommentList(context, communityId, postId, input, forumRepository) {
  await requireForumAccess(context.userId, communityId);
  await requireVisiblePost(communityId, postId, forumRepository);
  const pageResult = await forumRepository.findForumCommentPage({
    communityId,
    postId,
    sortBy: input.sortBy,
    page: input.page,
    pageSize: input.pageSize
  });

  return {
    items: await buildForumCommentResponses(pageResult.items, forumRepository),
    pagination: buildPagination(input.page, input.pageSize, pageResult.total)
  };
}

async function updateComment(context, communityId, commentId, input, forumRepository) {
  const { membership } = await requireForumAccess(context.userId, communityId);
  const comment = await requireExistingComment(communityId, commentId, forumRepository);

  assertCommentIsAvailable(comment, 'El comentario ya est\u00e1 eliminado');
  await requireVisiblePost(communityId, comment.postId, forumRepository);
  assertCanEditComment(membership, comment);

  const updatedComment = await forumRepository.withTransaction((tx) => forumRepository.updateForumComment(tx, {
    postId: comment.postId,
    commentId,
    data: { content: input.content, editedAt: new Date() }
  }));

  if (!updatedComment) {
    throw new ConflictError('No se ha podido actualizar el comentario');
  }

  const [item] = await buildForumCommentResponses([updatedComment], forumRepository);
  return item;
}

async function deleteComment(context, communityId, commentId, forumRepository) {
  const { membership } = await requireForumAccess(context.userId, communityId);
  const comment = await requireExistingComment(communityId, commentId, forumRepository);

  assertCommentIsAvailable(comment, 'El comentario ya est\u00e1 eliminado');
  await requireVisiblePost(communityId, comment.postId, forumRepository);
  assertCanDeleteComment(membership, comment);

  const deletedContent = comment.authorMembershipId === membership.id ? DELETED_COMMENT_CONTENT_BY_AUTHOR : DELETED_COMMENT_CONTENT_BY_ADMIN;

  const deletedComment = await forumRepository.withTransaction((tx) => forumRepository.anonymizeForumComment(tx, {
    postId: comment.postId,
    commentId,
    deletedContent
  }));

  if (!deletedComment) {
    throw new ConflictError('No se ha podido eliminar el comentario');
  }

  const [item] = await buildForumCommentResponses([deletedComment], forumRepository);
  return item;
}

async function togglePostLike(context, communityId, postId, forumRepository) {
  const { membership } = await requireForumAccess(context.userId, communityId);
  await requireVisiblePost(communityId, postId, forumRepository);
  const existingLike = await forumRepository.findForumPostLike({ membershipId: membership.id, postId });

  if (existingLike) {
    await forumRepository.deleteForumPostLike({ membershipId: membership.id, postId });
  } else {
    try {
      await forumRepository.createForumPostLike({ membershipId: membership.id, postId });
    } 
    catch (error) {
      // Dos toggles simultaneos pueden chocar con la unique.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }
    }
  }

  return { postId, likesCount: await forumRepository.countForumPostLikes(postId) };
}

async function toggleCommentLike(context, communityId, commentId, forumRepository) {
  const { membership } = await requireForumAccess(context.userId, communityId);
  const comment = await requireExistingComment(communityId, commentId, forumRepository);

  assertCommentIsAvailable(comment, 'No se puede reaccionar a un comentario eliminado');
  await requireVisiblePost(communityId, comment.postId, forumRepository);
  const existingLike = await forumRepository.findForumCommentLike({ membershipId: membership.id, commentId });

  if (existingLike) {
    await forumRepository.deleteForumCommentLike({ membershipId: membership.id, commentId });
  } else {
    try {
      await forumRepository.createForumCommentLike({ membershipId: membership.id, commentId });
    } 
    catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }
    }
  }

  return { commentId, likesCount: await forumRepository.countForumCommentLikes(commentId) };
}

async function voteOnPoll(context, communityId, pollId, input, forumRepository) {
  const { membership } = await requireForumAccess(context.userId, communityId);
  const poll = await forumRepository.findForumPollById({ communityId, pollId });

  if (!poll || poll.deletedAt || !poll.forumPost || poll.forumPost.isDeleted) {
    throw new NotFoundError('Encuesta no encontrada');
  }

  if (!isForumPollOpen(poll)) {
    throw new ConflictError('La encuesta ya est\u00e1 cerrada');
  }

  const selectedOption = poll.options.find((option) => option.id === input.optionId);

  if (!selectedOption) {
    throw new ValidationError(
      buildValidationDetail('optionId', 'La opci\u00f3n seleccionada no pertenece a esta encuesta'),
      { message: 'La opci\u00f3n seleccionada no es v\u00e1lida' }
    );
  }

  try {
    const vote = await forumRepository.withTransaction((tx) => forumRepository.insertForumPollVote(tx, {
      pollId,
      optionId: selectedOption.id,
      membershipId: membership.id
    }));

    return { voted: true, pollId: vote.pollId, optionId: vote.optionId, votedAt: vote.createdAt.toISOString() };
  } 
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Solo se permite un voto por usuario y encuesta');
    }

    throw error;
  }
}

async function setPostPinned(context, communityId, postId, pinned, forumRepository) {
  await requireForumAdministrativeAccess(context.userId, communityId);
  const post = await requireExistingPost(communityId, postId, forumRepository);

  assertPostIsAvailable(post, 'La publicaci\u00f3n ya no est\u00e1 disponible');

  const updatedPost = await forumRepository.withTransaction((tx) => forumRepository.setForumPostPinned(tx, {
    communityId,
    postId,
    pinned
  }));

  if (!updatedPost) {
    throw new ConflictError('No se ha podido actualizar el estado destacado de la publicaci\u00f3n');
  }

  return { postId, pinned: updatedPost.pinned };
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
  setPostPinned
};