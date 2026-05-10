// Repositorio de calendar: concentra lecturas y escrituras del calendario comunitario y personal.
// Flujo cubierto: servicio -> queries Prisma -> eventos visibles, personales y proyecciones automáticas.
// Expone lecturas del mes, CRUD de eventos personales y helpers internos usados por reservations/news/voting/users.
// Lo consumen calendar.service.js y otros módulos que sincronizan eventos automáticos.
const prisma = require('../../lib/prisma');
const RESERVATION_SOURCE_OCCURRENCE_KEY = 'BOOKING';

// --- Selects compartidos ---
const calendarEventSelect = {
  id: true,
  title: true,
  type: true,
  eventDate: true,
  startTime: true,
  endTime: true
};

// --- Helpers comunes ---
// La tabla mezcla eventos automáticos de comunidad con eventos privados del usuario.
// - "ownerMembershipId = null": evento automático visible para la comunidad.
// - "type = PERSONAL": evento privado creado por el usuario.
// - "type = RESERVATION": proyección privada de una reserva del usuario.
function buildVisibleCalendarEventsWhere({ communityId, ownerMembershipId, startDate, endDate }) {
  return {
    communityId,
    deletedAt: null,
    eventDate: { gte: startDate, lt: endDate },
    OR: [{ ownerMembershipId: null }, { ownerMembershipId }]
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

// Cada ocurrencia automática usa una clave diaria estable para poder hacer upsert idempotente.
function buildAutomaticOccurrenceKey(date) {
  return date.toISOString().slice(0, 10);
}

// --- Calendario comunitario: GET ---
async function findVisibleCalendarEventsInRange(input) {
  return prisma.calendarEvent.findMany({
    where: buildVisibleCalendarEventsWhere(input),
    select: calendarEventSelect,
    orderBy: buildCalendarEventsOrderBy()
  });
}

// --- Eventos personales: POST ---
async function createPersonalEvent(input) {
  return prisma.calendarEvent.create({
    data: {
      communityId: input.communityId,
      ownerMembershipId: input.ownerMembershipId,
      type: 'PERSONAL',
      sourceEntityId: null,
      sourceOccurrenceKey: null,
      title: input.title,
      eventDate: input.eventDate,
      startTime: input.startTime,
      endTime: input.endTime
    },
    select: calendarEventSelect
  });
}

// --- Eventos personales: GET/PATCH/DELETE ---
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

// --- Eventos automáticos: sincronización interna ---
async function upsertAutomaticEventInDb(db, input) {
  const sourceOccurrenceKey = input.sourceOccurrenceKey || buildAutomaticOccurrenceKey(input.eventDate);

  // La clave compuesta hace idempotente cada ocurrencia diaria del origen.
  return db.calendarEvent.upsert({
    where: {
      communityId_type_sourceEntityId_sourceOccurrenceKey: {
        communityId: input.communityId,
        type: input.type,
        sourceEntityId: input.sourceEntityId,
        sourceOccurrenceKey
      }
    },
    update: {
      ownerMembershipId: null,
      sourceOccurrenceKey,
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
      sourceOccurrenceKey,
      title: input.title,
      eventDate: input.eventDate,
      startTime: input.startTime,
      endTime: input.endTime
    },
    select: calendarEventSelect
  });
}

async function replaceAutomaticEventsInDb(db, { communityId, type, sourceEntityId, events }) {
  // Si llegan varias ocurrencias con la misma clave diaria, nos quedamos con la última para mantener idempotencia.
  const normalizedEvents = Array.from(new Map(
    (events || []).map((event) => {
      const sourceOccurrenceKey = event.sourceOccurrenceKey || buildAutomaticOccurrenceKey(event.eventDate);
      return [sourceOccurrenceKey, { ...event, sourceOccurrenceKey }];
    })
  ).values());

  await Promise.all(normalizedEvents.map((event) => upsertAutomaticEventInDb(db, {
    communityId,
    type,
    sourceEntityId,
    title: event.title,
    eventDate: event.eventDate,
    startTime: event.startTime,
    endTime: event.endTime,
    sourceOccurrenceKey: event.sourceOccurrenceKey
  })));

  const occurrenceKeys = normalizedEvents.map((event) => event.sourceOccurrenceKey);

  return db.calendarEvent.updateMany({
    where: {
      communityId,
      type,
      sourceEntityId,
      ownerMembershipId: null,
      deletedAt: null,
      ...(occurrenceKeys.length > 0 ? { sourceOccurrenceKey: { notIn: occurrenceKeys } } : {})
    },
    data: { deletedAt: new Date() }
  });
}

async function softDeleteAutomaticEventInDb(db, { communityId, type, sourceEntityId }) {
  return db.calendarEvent.updateMany({
    where: {
      communityId,
      type,
      sourceEntityId,
      ownerMembershipId: null,
      deletedAt: null
    },
    data: { deletedAt: new Date() }
  });
}

// --- Limpiezas transversales ---
async function softDeletePersonalEventsByMembershipIds(db, membershipIds, deletedAt = new Date()) {
  if (!membershipIds || membershipIds.length === 0) {
    return { count: 0 };
  }

  return db.calendarEvent.updateMany({
    where: {
      ownerMembershipId: { in: membershipIds },
      type: 'PERSONAL',
      deletedAt: null
    },
    data: { deletedAt }
  });
}

// La reserva del usuario se refleja como un evento privado con una clave de ocurrencia fija.
async function upsertOwnedReservationEventInDb(db, input) {
  return db.calendarEvent.upsert({
    where: {
      communityId_type_sourceEntityId_sourceOccurrenceKey: {
        communityId: input.communityId,
        type: 'RESERVATION',
        sourceEntityId: input.bookingId,
        sourceOccurrenceKey: RESERVATION_SOURCE_OCCURRENCE_KEY
      }
    },
    update: {
      ownerMembershipId: input.ownerMembershipId,
      title: input.title,
      eventDate: input.eventDate,
      startTime: input.startTime,
      endTime: input.endTime,
      deletedAt: null
    },
    create: {
      communityId: input.communityId,
      ownerMembershipId: input.ownerMembershipId,
      type: 'RESERVATION',
      sourceEntityId: input.bookingId,
      sourceOccurrenceKey: RESERVATION_SOURCE_OCCURRENCE_KEY,
      title: input.title,
      eventDate: input.eventDate,
      startTime: input.startTime,
      endTime: input.endTime
    },
    select: calendarEventSelect
  });
}

async function softDeleteOwnedReservationEventInDb(db, { communityId, ownerMembershipId, bookingId, deletedAt = new Date() }) {
  return db.calendarEvent.updateMany({
    where: {
      communityId,
      ownerMembershipId,
      type: 'RESERVATION',
      sourceEntityId: bookingId,
      sourceOccurrenceKey: RESERVATION_SOURCE_OCCURRENCE_KEY,
      deletedAt: null
    },
    data: { deletedAt }
  });
}

async function softDeleteReservationEventsBySourceEntityIds(db, bookingIds, deletedAt = new Date()) {
  if (!bookingIds || bookingIds.length === 0) {
    return { count: 0 };
  }

  return db.calendarEvent.updateMany({
    where: {
      type: 'RESERVATION',
      sourceEntityId: { in: bookingIds },
      sourceOccurrenceKey: RESERVATION_SOURCE_OCCURRENCE_KEY,
      deletedAt: null
    },
    data: { deletedAt }
  });
}

module.exports = {
  findVisibleCalendarEventsInRange,
  createPersonalEvent,
  findOwnedPersonalEventById,
  updateOwnedPersonalEvent,
  softDeleteOwnedPersonalEvent,
  replaceAutomaticEventsInDb,
  softDeleteAutomaticEventInDb,
  softDeletePersonalEventsByMembershipIds,
  upsertOwnedReservationEventInDb,
  softDeleteOwnedReservationEventInDb,
  softDeleteReservationEventsBySourceEntityIds
};