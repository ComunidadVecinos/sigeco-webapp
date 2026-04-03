// Servicio del módulo calendar.
// Mantiene el almacenamiento interno por día de negocio, pero expone el
// contrato público únicamente con instantes UTC ISO.
const { ConflictError, NotFoundError, ValidationError } = require('../../lib/errors');
const { buildBusinessDateOnly, buildBusinessDateTime, formatBusinessTime } = require('../calendar/calendar.datetime');
const membersRepository = require('../members/members.repository');
const membersService = require('../members/members.service');

function buildValidationDetail(field, message) {
  return [{ field, location: 'body', message }];
}

function mapCalendarEvent(event) {
  const startsAt = buildBusinessDateTime(event.eventDate, event.startTime);
  const endsAt = buildBusinessDateTime(event.eventDate, event.endTime);

  return {
    id: event.id,
    title: event.title,
    type: event.type,
    startsAt: startsAt ? startsAt.toISOString() : null,
    endsAt: endsAt ? endsAt.toISOString() : null
  };
}

function buildValidationMessage(field, message, errorMessage) {
  throw new ValidationError(buildValidationDetail(field, message), {
    message: errorMessage
  });
}

function buildStoredPersonalEventFields(startsAt, endsAt) {
  const eventDate = buildBusinessDateOnly(startsAt);
  const endDate = buildBusinessDateOnly(endsAt);

  if (eventDate.getTime() !== endDate.getTime()) {
    buildValidationMessage(
      'endsAt',
      'Los eventos personales deben empezar y terminar el mismo día de negocio',
      'El evento personal no puede cruzar de día en el calendario comunitario'
    );
  }

  if (endsAt <= startsAt) {
    buildValidationMessage(
      'startsAt',
      'La fecha y hora de inicio deben ser anteriores a la fecha y hora de fin',
      'El rango temporal del evento personal no es válido'
    );
  }

  return { eventDate, startTime: formatBusinessTime(startsAt), endTime: formatBusinessTime(endsAt) };
}

function buildMonthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return {
    startDate: new Date(Date.UTC(year, monthNumber - 1, 1)),
    endDate: new Date(Date.UTC(year, monthNumber, 1))
  };
}

async function requireCalendarMembershipAccess(userId, communityId) {
  return membersService.requireCommunityMembershipAccess(userId, communityId, membersRepository);
}

async function getCalendarMonthEvents(context, communityId, input, repository) {
  const { membership } = await requireCalendarMembershipAccess(context.userId, communityId);
  const { startDate, endDate } = buildMonthRange(input.month);
  const events = await repository.findVisibleCalendarEventsInRange({
    communityId,
    ownerMembershipId: membership.id,
    startDate,
    endDate
  });

  return { month: input.month, content: events.map(mapCalendarEvent) };
}

async function createPersonalEvent(context, communityId, input, repository) {
  const { membership } = await requireCalendarMembershipAccess(context.userId, communityId);
  const storedFields = buildStoredPersonalEventFields(input.startsAt, input.endsAt);

  const event = await repository.createPersonalEvent({
    communityId,
    ownerMembershipId: membership.id,
    title: input.title,
    ...storedFields
  });

  return mapCalendarEvent(event);
}

async function updatePersonalEvent(context, communityId, eventId, input, repository) {
  const { membership } = await requireCalendarMembershipAccess(context.userId, communityId);
  const existingEvent = await repository.findOwnedPersonalEventById({
    communityId,
    ownerMembershipId: membership.id,
    eventId
  });

  if (!existingEvent) {
    throw new NotFoundError('Evento personal no encontrado');
  }

  const existingStartsAt = buildBusinessDateTime(existingEvent.eventDate, existingEvent.startTime);
  const existingEndsAt = buildBusinessDateTime(existingEvent.eventDate, existingEvent.endTime);
  const nextStartsAt = input.startsAt || existingStartsAt;
  const nextEndsAt = input.endsAt || existingEndsAt;
  const storedFields = buildStoredPersonalEventFields(nextStartsAt, nextEndsAt);

  const updatedEvent = await repository.updateOwnedPersonalEvent({
    communityId,
    ownerMembershipId: membership.id,
    eventId,
    data: { ...(input.title !== undefined ? { title: input.title } : {}), ...storedFields }
  });

  if (!updatedEvent) {
    throw new ConflictError('No se ha podido actualizar el evento personal');
  }

  return mapCalendarEvent(updatedEvent);
}

async function deletePersonalEvent(context, communityId, eventId, repository) {
  const { membership } = await requireCalendarMembershipAccess(context.userId, communityId);
  const deleted = await repository.softDeleteOwnedPersonalEvent({
    communityId,
    ownerMembershipId: membership.id,
    eventId
  });

  if (!deleted) {
    throw new NotFoundError('Evento personal no encontrado');
  }

  return { deleted: true, eventId };
}

module.exports = { getCalendarMonthEvents, createPersonalEvent, updatePersonalEvent, deletePersonalEvent };