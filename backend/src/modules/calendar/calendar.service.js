// Servicio del módulo calendar.
// Orquesta la visibilidad del calendario comunitario y separa dos categorías de eventos:
// - automáticos: pertenecen a la comunidad y llegan sincronizados desde otros módulos.
// - personales: pertenecen a una membership concreta dentro de esa comunidad.
const { ConflictError, NotFoundError, ValidationError } = require('../../lib/errors');
const calendarRepository = require('./calendar.repository');
const membersRepository = require('../members/members.repository');
const membersService = require('../members/members.service');

function mapCalendarEvent(event) {
  // La API expone fecha y hora, no datetime completo.
  return {
    id: event.id,
    title: event.title,
    type: event.type,
    date: event.eventDate.toISOString().slice(0, 10),
    startTime: event.startTime,
    endTime: event.endTime
  };
}

function buildValidationDetail(field, message) {
  return [{ field, location: 'body', message }];
}

function assertValidTimeRange(startTime, endTime) {
  // El módulo permite solapamientos: solo exige un rango horario internamente coherente.
  if (startTime < endTime) {
    return;
  }

  throw new ValidationError(buildValidationDetail('startTime', 'La hora de inicio debe ser anterior a la hora de fin'), {
    message: 'El rango horario del evento no es válido'
  });
}

function buildMonthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  // El mes es el segmento natural de consulta y se acota en UTC para evitar deriva por zona horaria.
  return {
    startDate: new Date(Date.UTC(year, monthNumber - 1, 1)),
    endDate: new Date(Date.UTC(year, monthNumber, 1))
  };
}

async function requireCalendarMembershipAccess(userId, communityId) {
  // Calendar reutiliza la noción de "pertenece a la comunidad", que incluye memberships suspendidas.
  return membersService.requireCommunityMembershipAccess(userId, communityId, membersRepository);
}

async function getCalendarMonthEvents(context, communityId, input, repository) {
  const { membership } = await requireCalendarMembershipAccess(context.userId, communityId);
  const { startDate, endDate } = buildMonthRange(input.month);
  // La vista mensual mezcla eventos automáticos de comunidad con los personales del miembro actual.
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
  assertValidTimeRange(input.startTime, input.endTime);

  const event = await repository.createPersonalEvent({
    communityId,
    ownerMembershipId: membership.id,
    title: input.title,
    eventDate: input.date,
    startTime: input.startTime,
    endTime: input.endTime
  });

  return mapCalendarEvent(event);
}

async function updatePersonalEvent(context, communityId, eventId, input, repository) {
  const { membership } = await requireCalendarMembershipAccess(context.userId, communityId);
  const existingEvent = await repository.findOwnedPersonalEventById({ communityId, ownerMembershipId: membership.id, eventId });

  if (!existingEvent) {
    throw new NotFoundError('Evento personal no encontrado');
  }

  const nextStartTime = input.startTime || existingEvent.startTime;
  const nextEndTime = input.endTime || existingEvent.endTime;

  // PATCH permite modificar solo uno de los extremos horarios (se valida el rango final combinado).
  assertValidTimeRange(nextStartTime, nextEndTime);

  const updatedEvent = await repository.updateOwnedPersonalEvent({
    communityId,
    ownerMembershipId: membership.id,
    eventId,
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.date !== undefined ? { eventDate: input.date } : {}),
      ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
      ...(input.endTime !== undefined ? { endTime: input.endTime } : {})
    }
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

async function upsertAutomaticEvent(input, repository = calendarRepository) {
  // Los eventos automáticos son internos al backend: PERSONAL queda reservado al CRUD del usuario.
  if (input.type === 'PERSONAL') {
    throw new ValidationError(buildValidationDetail('type', 'Los eventos automáticos no pueden usar el tipo PERSONAL'));
  }

  if (!input.sourceEntityId) {
    throw new ValidationError(buildValidationDetail('sourceEntityId', 'El identificador del origen es obligatorio'));
  }

  assertValidTimeRange(input.startTime, input.endTime);

  const event = await repository.upsertAutomaticEvent({
    communityId: input.communityId,
    type: input.type,
    sourceEntityId: input.sourceEntityId,
    title: input.title,
    eventDate: input.date,
    startTime: input.startTime,
    endTime: input.endTime
  });

  return mapCalendarEvent(event);
}

async function deleteAutomaticEvent(input, repository = calendarRepository) {
  if (input.type === 'PERSONAL') {
    throw new ValidationError(buildValidationDetail('type', 'Los eventos automáticos no pueden usar el tipo PERSONAL'));
  }

  if (!input.sourceEntityId) {
    throw new ValidationError(buildValidationDetail('sourceEntityId', 'El identificador del origen es obligatorio'));
  }

  const result = await repository.softDeleteAutomaticEvent({
    communityId: input.communityId,
    type: input.type,
    sourceEntityId: input.sourceEntityId
  });

  return { deleted: result.count === 1, type: input.type, sourceEntityId: input.sourceEntityId };
}

module.exports = {
  getCalendarMonthEvents,
  createPersonalEvent,
  updatePersonalEvent,
  deletePersonalEvent,
  upsertAutomaticEvent,
  deleteAutomaticEvent
};