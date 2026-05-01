// Servicio del módulo voting.

const { Prisma } = require('@prisma/client');

const { ConflictError, NotFoundError, ValidationError } = require('../../lib/errors');
const mailService = require('../../lib/mail');
const membersRepository = require('../members/members.repository');
const membersService = require('../members/members.service');
const calendarRepository = require('../calendar/calendar.repository');
const { addMinutesToInstant } = require('../calendar/calendar.datetime');
const { buildVotingAutomaticCalendarEvents } = require('../calendar/calendar.reminder');

const MINIMUM_VOTING_DURATION_MINUTES = 59;

function buildValidationDetail(field, message) {
  return [{ field, location: 'body', message }];
}

function assertValidVotingEndDate(startsAt, endsAt) {
  if (endsAt <= startsAt) {
    throw new ValidationError(
      buildValidationDetail('endsAt', 'La fecha y hora de fin deben ser posteriores'),
      { message: 'La fecha de fin de la votación no es válida' }
    );
  }

  // El frontend trabaja con precisión de minuto. Este margen permite crear a las 19:40 una votación que cierre a las 20:40.
  const minimumAllowedEndsAt = addMinutesToInstant(startsAt, MINIMUM_VOTING_DURATION_MINUTES);

  if (endsAt < minimumAllowedEndsAt) {
    throw new ValidationError(
      buildValidationDetail('endsAt', 'La fecha y hora de fin deben ser, como mínimo, una hora posteriores al momento de creación'),
      { message: 'La fecha de fin de la votación no cumple el margen mínimo requerido' }
    );
  }
}

function isVotingOpen(voting, now = new Date()) {
  return voting.closedAt === null && voting.endsAt !== null && voting.endsAt > now;
}

function formatVotingEndsAt(endsAt) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Madrid'
  }).format(endsAt);
}

function mapVotingCreator(membership) {
  return { alias: membership.alias || null };
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

  return {
    id: voting.id,
    title: voting.title,
    description: voting.description || null,
    creator: mapVotingCreator(voting.createdByMembership),
    createdAt: voting.createdAt.toISOString(),
    startsAt: voting.startsAt.toISOString(),
    endsAt: voting.endsAt ? voting.endsAt.toISOString() : null,
    status: isVotingOpen(voting, now) ? 'OPEN' : 'CLOSED',
    totalVotes,
    possibleVoters,
    myVoteOptionId: myVoteOptionId || null,
    options: mappedOptions
  };
}

async function requireVotingMembershipAccess(userId, communityId) {
  return membersService.requireCommunityMembershipAccess(userId, communityId, membersRepository);
}

async function requireVotingAdministrativeAccess(userId, communityId) {
  return membersService.requireAdministrativeCommunityAccess(userId, communityId, membersRepository);
}

async function sendVotingCreatedMail({ member, voting }) {
  const targetEmail = member.user?.email;

  if (!targetEmail) {
    return;
  }

  const text = [
    `Hola ${member.alias || 'miembro'},`,
    '',
    'Se ha publicado una nueva votación en SIGECO.',
    '',
    `Título: ${voting.title}`,
    `Fecha de finalización: ${formatVotingEndsAt(voting.endsAt)}`,
    '',
    'Accede a SIGECO para participar.'
  ].join('\n');

  try {
    await mailService.sendMail({
      to: targetEmail,
      subject: 'SIGECO - Nueva votación disponible',
      text
    });
  } catch (error) {
    console.warn('No se ha podido enviar el correo de nueva votación', {
      votingId: voting.id,
      membershipId: member.id,
      error
    });
  }
}

async function notifyVotingCreated({ communityId, voting }, votingRepository) {
  let members = [];

  try {
    members = await votingRepository.findVotingNotificationMembers(communityId);
  } catch (error) {
    console.warn('No se han podido obtener los destinatarios del correo de nueva votación', {
      communityId,
      votingId: voting.id,
      error
    });
    return;
  }

  for (const member of members) {
    await sendVotingCreatedMail({ member, voting });
  }
}

async function createVoting(context, communityId, input, votingRepository) {
  const { membership } = await requireVotingAdministrativeAccess(context.userId, communityId);
  const startsAt = new Date();
  const endsAt = input.endsAt;

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

    await calendarRepository.replaceAutomaticEventsInDb(tx, {
      communityId,
      type: 'VOTING',
      sourceEntityId: voting.id,
      events: buildVotingAutomaticCalendarEvents({ title: voting.title, endsAt: voting.endsAt })
    });

    return voting;
  });

  const possibleVoters = await votingRepository.countPossibleVoters(communityId);
  await notifyVotingCreated({ communityId, voting: createdVoting }, votingRepository);

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

    await calendarRepository.softDeleteAutomaticEventInDb(tx, { communityId, type: 'VOTING', sourceEntityId: votingId });

    return result;
  });

  if (deleteResult.count !== 1) {
    throw new ConflictError('No se ha podido eliminar la votación');
  }
  return { deleted: true, votingId };
}

module.exports = { createVoting, getVotingList, voteOnVoting, closeVoting, deleteVoting };