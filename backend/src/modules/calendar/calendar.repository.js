const prisma = require('../../lib/prisma');

const calendarEventSelect = {
  id: true,
  title: true,
  type: true,
  eventDate: true,
  startTime: true,
  endTime: true
};

function buildVisibleCalendarEventsWhere({ communityId, ownerMembershipId, startDate, endDate }) {
  return {
    communityId,
    deletedAt: null,
    eventDate: {
      gte: startDate,
      lt: endDate
    },
    OR: [
      { ownerMembershipId: null },
      { ownerMembershipId }
    ]
  };
}

function buildCalendarEventsOrderBy() {
  return [
    { eventDate: 'asc' },
    { startTime: 'asc' },
    { endTime: 'asc' },
    { createdAt: 'asc' },
    { id: 'asc' }
  ];
}

async function findVisibleCalendarEventsInRange(input) {
  return prisma.calendarEvent.findMany({
    where: buildVisibleCalendarEventsWhere(input),
    select: calendarEventSelect,
    orderBy: buildCalendarEventsOrderBy()
  });
}

async function createPersonalEvent(input) {
  return prisma.calendarEvent.create({
    data: {
      communityId: input.communityId,
      ownerMembershipId: input.ownerMembershipId,
      type: 'PERSONAL',
      sourceEntityId: null,
      title: input.title,
      eventDate: input.eventDate,
      startTime: input.startTime,
      endTime: input.endTime
    },
    select: calendarEventSelect
  });
}

async function findOwnedPersonalEventById({ communityId, ownerMembershipId, eventId }) {
  return prisma.calendarEvent.findFirst({
    where: {
      id: eventId,
      communityId,
      ownerMembershipId,
      type: 'PERSONAL',
      deletedAt: null
    },
    select: calendarEventSelect
  });
}

async function updateOwnedPersonalEvent({ communityId, ownerMembershipId, eventId, data }) {
  return prisma.$transaction(async (tx) => {
    const updateResult = await tx.calendarEvent.updateMany({
      where: {
        id: eventId,
        communityId,
        ownerMembershipId,
        type: 'PERSONAL',
        deletedAt: null
      },
      data
    });

    if (updateResult.count !== 1) {
      return null;
    }

    return tx.calendarEvent.findFirst({
      where: {
        id: eventId,
        communityId,
        ownerMembershipId,
        type: 'PERSONAL',
        deletedAt: null
      },
      select: calendarEventSelect
    });
  });
}

async function softDeleteOwnedPersonalEvent({ communityId, ownerMembershipId, eventId }) {
  const updateResult = await prisma.calendarEvent.updateMany({
    where: {
      id: eventId,
      communityId,
      ownerMembershipId,
      type: 'PERSONAL',
      deletedAt: null
    },
    data: { deletedAt: new Date() }
  });

  return updateResult.count === 1;
}

async function upsertAutomaticEvent(input) {
  return prisma.calendarEvent.upsert({
    where: {
      communityId_type_sourceEntityId: {
        communityId: input.communityId,
        type: input.type,
        sourceEntityId: input.sourceEntityId
      }
    },
    update: {
      ownerMembershipId: null,
      title: input.title,
      eventDate: input.eventDate,
      startTime: input.startTime,
      endTime: input.endTime,
      deletedAt: null
    },
    create: {
      communityId: input.communityId,
      ownerMembershipId: null,
      type: input.type,
      sourceEntityId: input.sourceEntityId,
      title: input.title,
      eventDate: input.eventDate,
      startTime: input.startTime,
      endTime: input.endTime
    },
    select: calendarEventSelect
  });
}

async function softDeleteAutomaticEvent({ communityId, type, sourceEntityId }) {
  return prisma.calendarEvent.updateMany({
    where: {
      communityId,
      type,
      sourceEntityId,
      ownerMembershipId: null,
      deletedAt: null
    },
    data: {
      deletedAt: new Date()
    }
  });
}

async function softDeletePersonalEventsByMembershipIds(db, membershipIds, deletedAt = new Date()) {
  if (!membershipIds || membershipIds.length === 0) {
    return { count: 0 };
  }

  return db.calendarEvent.updateMany({
    where: {
      ownerMembershipId: {
        in: membershipIds
      },
      type: 'PERSONAL',
      deletedAt: null
    },
    data: {
      deletedAt
    }
  });
}

module.exports = {
  findVisibleCalendarEventsInRange,
  createPersonalEvent,
  findOwnedPersonalEventById,
  updateOwnedPersonalEvent,
  softDeleteOwnedPersonalEvent,
  upsertAutomaticEvent,
  softDeleteAutomaticEvent,
  softDeletePersonalEventsByMembershipIds
};
