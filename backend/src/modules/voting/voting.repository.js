// Acceso a datos del módulo voting.
const prisma = require('../../lib/prisma');

const votingListSelect = {
  id: true,
  title: true,
  description: true,
  startsAt: true,
  endsAt: true,
  closedAt: true,
  createdAt: true,
  createdByMembership: {
    select: { id: true, alias: true, role: true, deletedAt: true, endReason: true }
  }
};

const votingDetailSelect = {
  ...votingListSelect,
  createdByMembershipId: true,
  closedByMembershipId: true,
  options: {
    select: { id: true, title: true, sortOrder: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
  }
};

function buildVotingBaseWhere(communityId) {
  // Este repositorio opera solo sobre COMMUNITY_VOTING; FORUM_POLL reutiliza Poll desde su propio módulo.
  return { communityId, kind: 'COMMUNITY_VOTING', deletedAt: null };
}

function buildOpenVotingWhere(now = new Date()) {
  // Una votación comunitaria abierta siempre debe tener fecha fin futura (campo nullable para )
  return { closedAt: null, endsAt: { gt: now } };
}

function buildVotingListWhere({ communityId, status, now = new Date() }) {
  const baseWhere = buildVotingBaseWhere(communityId);

  if (status === 'open') {
    return { ...baseWhere, ...buildOpenVotingWhere(now) };
  }

  if (status === 'closed') {
    return { ...baseWhere, OR: [{ closedAt: { not: null } }, { endsAt: { lte: now } }] };
  }

  return baseWhere;
}

async function withTransaction(callback) {
  return prisma.$transaction(callback);
}

async function createVoting(db, input) {
  return db.poll.create({
    data: {
      communityId: input.communityId,
      kind: 'COMMUNITY_VOTING',
      title: input.title,
      description: input.description || null,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      createdByMembershipId: input.createdByMembershipId,
      options: {
        create: input.options.map((option, index) => ({ title: option.title, sortOrder: index }))
      }
    },
    select: votingDetailSelect
  });
}

async function findCommunityVotingById({ communityId, votingId }) {
  return prisma.poll.findFirst({
    where: { id: votingId, ...buildVotingBaseWhere(communityId) },
    select: votingDetailSelect
  });
}

async function findVotingPage({ communityId, status, page, pageSize, now = new Date() }) {
  const where = buildVotingListWhere({ communityId, status, now });
  const skip = (page - 1) * pageSize;

  const [total, items] = await prisma.$transaction([
    prisma.poll.count({ where }),
    prisma.poll.findMany({
      where,
      select: votingListSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take: pageSize
    })
  ]);

  return { total, items };
}

async function findVotingSummaryCounts({ communityId, now = new Date() }) {
  const baseWhere = buildVotingBaseWhere(communityId);
  const [total, open] = await prisma.$transaction([
    prisma.poll.count({ where: baseWhere }),
    prisma.poll.count({ where: { ...baseWhere, ...buildOpenVotingWhere(now) } })
  ]);

  return { total, open, closed: total - open };
}

async function findVotingOptionsByPollIds(pollIds) {
  if (!pollIds || pollIds.length === 0) {
    return [];
  }

  return prisma.pollOption.findMany({
    where: { pollId: { in: pollIds } },
    select: { id: true, pollId: true, title: true, sortOrder: true },
    orderBy: [{ pollId: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }]
  });
}

async function findVoteCountsByPollIds(pollIds) {
  if (!pollIds || pollIds.length === 0) {
    return [];
  }

  return prisma.pollVote.groupBy({
    by: ['pollId', 'optionId'],
    where: { pollId: { in: pollIds } },
    _count: { _all: true }
  });
}

async function findMembershipVotesByPollIds({ membershipId, pollIds }) {
  if (!pollIds || pollIds.length === 0) {
    return [];
  }

  return prisma.pollVote.findMany({
    where: { membershipId, pollId: { in: pollIds } },
    select: { pollId: true, optionId: true }
  });
}

async function countPossibleVoters(communityId) {
  return prisma.membership.count({
    where: { communityId, deletedAt: null, endedAt: null }
  });
}

async function findVotingNotificationMembers(communityId) {
  return prisma.membership.findMany({
    where: { communityId, deletedAt: null, endedAt: null },
    select: {
      id: true,
      alias: true,
      user: { select: { email: true } }
    },
    orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }]
  });
}

async function insertVote(db, input) {
  return db.pollVote.create({
    data: { pollId: input.pollId, optionId: input.optionId, membershipId: input.membershipId },
    select: { id: true, pollId: true, optionId: true, membershipId: true, createdAt: true }
  });
}

async function closeVoting(db, { communityId, votingId, closedByMembershipId, closedAt }) {
  const updateResult = await db.poll.updateMany({
    where: { id: votingId, ...buildVotingBaseWhere(communityId), closedAt: null, endsAt: { gt: closedAt } },
    data: { closedAt, closedByMembershipId }
  });

  if (updateResult.count !== 1) {
    return null;
  }

  return db.poll.findFirst({
    where: { id: votingId, ...buildVotingBaseWhere(communityId) },
    select: { id: true, closedAt: true, closedByMembershipId: true }
  });
}

async function softDeleteVoting(db, { communityId, votingId, deletedAt }) {
  return db.poll.updateMany({
    where: { id: votingId, ...buildVotingBaseWhere(communityId) },
    data: { deletedAt }
  });
}

async function deleteVotesOfMembershipsInOpenPolls(db, membershipIds, now = new Date()) {
  if (!membershipIds || membershipIds.length === 0) {
    return { count: 0 };
  }

  // Solo se retiran votos de encuestas aún abiertas: las cerradas conservan su resultado histórico.
  return db.pollVote.deleteMany({
    where: {
      membershipId: { in: membershipIds },
      poll: {
        is: {
          deletedAt: null,
          closedAt: null,
          startsAt: { lte: now },
          OR: [
            { kind: 'COMMUNITY_VOTING', endsAt: { gt: now } },
            { kind: 'FORUM_POLL', OR: [{ endsAt: null }, { endsAt: { gt: now } }] }
          ]
        }
      }
    }
  });
}

module.exports = {
  withTransaction,
  createVoting,
  findCommunityVotingById,
  findVotingPage,
  findVotingSummaryCounts,
  findVotingOptionsByPollIds,
  findVoteCountsByPollIds,
  findMembershipVotesByPollIds,
  countPossibleVoters,
  findVotingNotificationMembers,
  insertVote,
  closeVoting,
  softDeleteVoting,
  deleteVotesOfMembershipsInOpenPolls
};
