// Servicio del módulo voting.
// Orquesta permisos, ciclo de vida de votaciones comunitarias y sincronización de eventos automáticos del calendario.
const { Prisma } = require('@prisma/client');

const { ConflictError, NotFoundError, ValidationError } = require('../../lib/errors');
const membersRepository = require('../members/members.repository');
const membersService = require('../members/members.service');
const calendarRepository = require('../calendar/calendar.repository');
const { buildOneHourAutomaticReminderWindow } = require('../calendar/calendar.reminder');

function buildValidationDetail(field, message, location = 'body') {
  return [{ field, location, message }];
}

function padTimeSegment(value) {
  return String(value).padStart(2, '0');
}

function formatUtcTime(date) {
  return `${padTimeSegment(date.getUTCHours())}:${padTimeSegment(date.getUTCMinutes())}`;
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + (minutes * 60 * 1000));
}

function buildEndsAt(endDate, endTime) {
  const [hours, minutes] = endTime.split(':').map(Number);
  return new Date(Date.UTC( endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate(), hours, minutes, 0, 0));
}

function assertValidVotingEndDate(startsAt, endsAt) {
  if (endsAt <= startsAt) {
    throw new ValidationError(
      buildValidationDetail('endDate', 'La fecha y hora de fin deben ser posteriores al momento actual'),
      { message: 'La fecha de fin de la votación no es válida' }
    );
  }

  const minimumAllowedEndsAt = addMinutes(startsAt, 60);

  // Se exige al menos una hora de margen para que el recordatorio automático del calendario siempre tenga una ventana coherente.
  if (endsAt < minimumAllowedEndsAt) {
    throw new ValidationError(
      buildValidationDetail('endTime', 'La fecha y hora de fin deben ser, como mínimo, una hora posteriores al momento de creación'),
      { message: 'La fecha de fin de la votación no cumple el margen mínimo requerido' }
    );
  }
}

// COMMUNITY_VOTING debe tener una fecha de fin válida (Poll.endsAt nullable para FORUM_POLL).
function isVotingOpen(voting, now = new Date()) {
  return voting.closedAt === null && voting.endsAt !== null && voting.endsAt > now;
}

function mapVotingEnd(voting) {
  // Prisma permite endsAt nulo para FORUM_POLL, pero COMMUNITY_VOTING sigue operando con fecha de fin obligatoria.
  if (!voting.endsAt) {
    return { endDate: null, endTime: null };
  }
  return { endDate: formatDateOnly(voting.endsAt), endTime: formatUtcTime(voting.endsAt) };
}

function mapVotingCreator(membership) {
  return { membershipId: membership.id, alias: membership.alias || null, role: membership.role };
}

function buildVoteCountMap(voteCountRows) {
  const voteCountMap = new Map();

  for (const row of voteCountRows) {
    voteCountMap.set(`${row.pollId}:${row.optionId}`, row._count._all);
  }
  return voteCountMap;
}

function groupOptionsByPollId(options) {
  const groupedOptions = new Map();

  for (const option of options) {
    if (!groupedOptions.has(option.pollId)) {
      groupedOptions.set(option.pollId, []);
    }
    groupedOptions.get(option.pollId).push(option);
  }
  return groupedOptions;
}

function buildMembershipVoteMap(votes) {
  return new Map(votes.map((vote) => [vote.pollId, vote.optionId]));
}

function mapVotingItem(voting, options, voteCountMap, possibleVoters, myVoteOptionId, now = new Date()) {
  const mappedOptions = options.map((option) => ({
    id: option.id,
    title: option.title,
    votes: voteCountMap.get(`${voting.id}:${option.id}`) || 0
  }));

  const totalVotes = mappedOptions.reduce((sum, option) => sum + option.votes, 0);
  const votingEnd = mapVotingEnd(voting);

  return {
    id: voting.id,
    title: voting.title,
    description: voting.description || null,
    creator: mapVotingCreator(voting.createdByMembership),
    createdAt: voting.createdAt.toISOString(),
    startsAt: voting.startsAt.toISOString(),
    endDate: votingEnd.endDate,
    endTime: votingEnd.endTime,
    status: isVotingOpen(voting, now) ? 'OPEN' : 'CLOSED',
    totalVotes,
    possibleVoters,
    myVoteOptionId: myVoteOptionId || null,
    options: mappedOptions
  };
}

function buildVotingCalendarEventInput(communityId, votingId, title, endDate, endTime) {
  const reminderWindow = buildOneHourAutomaticReminderWindow(endDate, endTime);

  return {
    communityId,
    type: 'VOTING',
    sourceEntityId: votingId,
    title,
    eventDate: reminderWindow.date,
    startTime: reminderWindow.startTime,
    endTime: reminderWindow.endTime
  };
}

async function requireVotingMembershipAccess(userId, communityId) {
  return membersService.requireCommunityMembershipAccess(userId, communityId, membersRepository);
}

async function requireVotingAdministrativeAccess(userId, communityId) {
  return membersService.requireAdministrativeCommunityAccess(userId, communityId, membersRepository);
}

async function createVoting(context, communityId, input, votingRepository) {
  const { membership } = await requireVotingAdministrativeAccess(context.userId, communityId);
  const startsAt = new Date();
  // Por contrato HTTP de COMMUNITY_VOTING, endDate y endTime son obligatorios.
  const endsAt = buildEndsAt(input.endDate, input.endTime);

  assertValidVotingEndDate(startsAt, endsAt);
  const createdVoting = await votingRepository.withTransaction(async (tx) => {
    const voting = await votingRepository.createVoting(tx, {
      communityId,
      title: input.title,
      description: input.description,
      startsAt,
      endsAt,
      createdByMembershipId: membership.id,
      options: input.options
    });

    await calendarRepository.upsertAutomaticEventInDb(tx, buildVotingCalendarEventInput(communityId, voting.id, voting.title, input.endDate, input.endTime));

    return voting;
  });

  const possibleVoters = await votingRepository.countPossibleVoters(communityId);

  return mapVotingItem(createdVoting, createdVoting.options, new Map(), possibleVoters, null, startsAt);
}

async function getVotingList(context, communityId, input, votingRepository) {
  const { membership } = await requireVotingMembershipAccess(context.userId, communityId);
  const now = new Date();
  const [pageResult, summary, possibleVoters] = await Promise.all([
    votingRepository.findVotingPage({ communityId, status: input.status, page: input.page, pageSize: input.pageSize, now }),
    votingRepository.findVotingSummaryCounts({ communityId, now }),
    votingRepository.countPossibleVoters(communityId)
  ]);

  const votingIds = pageResult.items.map((item) => item.id);

  // El listado agrega opciones, conteos y voto propio en lecturas separadas para mantener la consulta base simple.
  const [options, voteCounts, membershipVotes] = await Promise.all([
    votingRepository.findVotingOptionsByPollIds(votingIds),
    votingRepository.findVoteCountsByPollIds(votingIds),
    votingRepository.findMembershipVotesByPollIds({ membershipId: membership.id, pollIds: votingIds })
  ]);

  const optionsByPollId = groupOptionsByPollId(options);
  const voteCountMap = buildVoteCountMap(voteCounts);
  const membershipVoteMap = buildMembershipVoteMap(membershipVotes);

  return {
    items: pageResult.items.map((item) => mapVotingItem(
      item,
      optionsByPollId.get(item.id) || [],
      voteCountMap,
      possibleVoters,
      membershipVoteMap.get(item.id) || null,
      now
    )),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total: pageResult.total,
      totalPages: Math.ceil(pageResult.total / input.pageSize)
    },
    summary
  };
}

async function voteOnVoting(context, communityId, votingId, input, votingRepository) {
  const { membership } = await requireVotingMembershipAccess(context.userId, communityId);
  const voting = await votingRepository.findCommunityVotingById({ communityId, votingId });

  if (!voting) {
    throw new NotFoundError('Votación no encontrada');
  }

  if (!isVotingOpen(voting)) {
    throw new ConflictError('La votación ya está cerrada');
  }

  const selectedOption = voting.options.find((option) => option.id === input.optionId);

  if (!selectedOption) {
    throw new ValidationError(
      buildValidationDetail('optionId', 'La opción seleccionada no pertenece a esta votación'),
      { message: 'La opción seleccionada no es válida' }
    );
  }

  try {
    const vote = await votingRepository.withTransaction((tx) => votingRepository.insertVote(tx, {
      pollId: voting.id,
      optionId: selectedOption.id,
      membershipId: membership.id
    }));

    return { voted: true, votingId: vote.pollId, optionId: vote.optionId, votedAt: vote.createdAt.toISOString() };
  }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Solo se permite un voto por usuario y votación');
    }

    throw error;
  }
}

async function closeVoting(context, communityId, votingId, votingRepository) {
  const { membership } = await requireVotingAdministrativeAccess(context.userId, communityId);
  const voting = await votingRepository.findCommunityVotingById({ communityId, votingId });

  if (!voting) {
    throw new NotFoundError('Votación no encontrada');
  }

  if (!isVotingOpen(voting)) {
    throw new ConflictError('La votación ya está cerrada');
  }

  const closedAt = new Date();
  const closedVoting = await votingRepository.withTransaction(async (tx) => {
    const result = await votingRepository.closeVoting(tx, { communityId, votingId, closedByMembershipId: membership.id, closedAt });

    if (!result) {
      return null;
    }

    // El cierre manual elimina también el recordatorio pendiente del calendario para no dejar una cita desalineada.
    await calendarRepository.softDeleteAutomaticEventInDb(tx, { communityId, type: 'VOTING', sourceEntityId: votingId });

    return result;
  });

  if (!closedVoting) {
    throw new ConflictError('No se ha podido cerrar la votación');
  }

  return { closed: true, votingId: closedVoting.id, closedAt: closedVoting.closedAt.toISOString() };
}

async function deleteVoting(context, communityId, votingId, votingRepository) {
  await requireVotingAdministrativeAccess(context.userId, communityId);
  const voting = await votingRepository.findCommunityVotingById({ communityId, votingId });

  if (!voting) {
    throw new NotFoundError('Votación no encontrada');
  }

  const deletedAt = new Date();
  const deleteResult = await votingRepository.withTransaction(async (tx) => {
    const result = await votingRepository.softDeleteVoting(tx, { communityId, votingId, deletedAt });

    if (result.count !== 1) {
      return result;
    }

    // Borrar una votación oculta también su recordatorio automático del calendario comunitario.
    await calendarRepository.softDeleteAutomaticEventInDb(tx, { communityId, type: 'VOTING', sourceEntityId: votingId });

    return result;
  });

  if (deleteResult.count !== 1) {
    throw new ConflictError('No se ha podido eliminar la votación');
  }
  return { deleted: true, votingId };
}

module.exports = { createVoting, getVotingList, voteOnVoting, closeVoting, deleteVoting };


