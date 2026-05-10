// Servicio de reservations: aplica permisos y reglas horarias sobre espacios y reservas.
// Flujo cubierto: contexto autenticado -> permisos -> reglas de horario/capacidad -> repositorio/calendar/mail.
// Expone casos de uso para CRUD de espacios, disponibilidad, reservas propias y administración.
// Lo consumen los controladores HTTP del módulo.
const { ConflictError, ForbiddenError, NotFoundError, ValidationError } = require('../../lib/errors');
const mailService = require('../../lib/mail');
const { addMinutesToInstant, buildBusinessDateOnly, buildBusinessDateTime, formatBusinessDate, formatBusinessTime } = require('../calendar/calendar.datetime');
const calendarRepository = require('../calendar/calendar.repository');
const { hasAdministrativeRole } = require('../members/members.access');
const membersRepository = require('../members/members.repository');
const membersService = require('../members/members.service');

// Relación entre el contrato público allowedDays y las columnas booleanas guardadas en Prisma.
const DAYS = [
  { key: 'monday', field: 'mondayEnabled', weekday: 1 },
  { key: 'tuesday', field: 'tuesdayEnabled', weekday: 2 },
  { key: 'wednesday', field: 'wednesdayEnabled', weekday: 3 },
  { key: 'thursday', field: 'thursdayEnabled', weekday: 4 },
  { key: 'friday', field: 'fridayEnabled', weekday: 5 },
  { key: 'saturday', field: 'saturdayEnabled', weekday: 6 },
  { key: 'sunday', field: 'sundayEnabled', weekday: 0 }
];

const DAY_FIELD_BY_WEEKDAY = DAYS.reduce((result, day) => {
  result[day.weekday] = day.field;
  return result;
}, {});

const DELETED_USER_ALIAS = 'Usuario eliminado';
const MAX_CALENDAR_TITLE_LENGTH = 160;

// --- Helpers comunes ---
function buildPagination(page, pageSize, total) {
  return { page, pageSize, total, totalPages: total === 0 ? 0 : Math.ceil(total / pageSize) };
}

function buildPageResult(input, pageResult, mapItem) {
  return {
    items: pageResult.items.map(mapItem),
    pagination: buildPagination(input.page, input.pageSize, pageResult.total)
  };
}

function throwValidation(field, message, errorMessage = 'Error de validación', location = 'body') {
  throw new ValidationError([{ field, location, message }], { message: errorMessage });
}

// Convierte HH:mm a minutos para comparar horarios y calcular franjas.
function parseTimeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

// Convierte minutos desde medianoche a HH:mm para responder slots y finales de reserva.
function formatTimeFromMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Rango [inicio, fin) de un mes para el calendario de un espacio.
function buildMonthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return {
    startDate: new Date(Date.UTC(year, monthNumber - 1, 1)),
    endDate: new Date(Date.UTC(year, monthNumber, 1))
  };
}

// Fechas absolutas usadas para reglas de antelación y capacidad de cancelación.
function buildBookingRange(bookingDate, startTime, endTime) {
  return {
    startsAt: buildBusinessDateTime(bookingDate, startTime),
    endsAt: buildBusinessDateTime(bookingDate, endTime)
  };
}

// Referencia pública de una membresía; oculta alias reales de cuentas eliminadas.
function mapMembershipRef(membership) {
  if (!membership) {
    return null;
  }
  if (membership.deletedAt && membership.endReason === 'USER_ACCOUNT_DELETED') {
    return { membershipId: membership.id, alias: DELETED_USER_ALIAS, role: membership.role };
  }
  return { membershipId: membership.id, alias: membership.alias || null, role: membership.role };
}

// --- Espacios: configuración y días permitidos ---
function readAllowedDays(source) {
  return DAYS.reduce((allowedDays, day) => {
    allowedDays[day.key] = Boolean(source[day.field]);
    return allowedDays;
  }, {});
}

function buildAllowedDays(existingSpace, patch = {}) {
  return DAYS.reduce((allowedDays, day) => {
    allowedDays[day.key] = patch[day.key] ?? (existingSpace ? existingSpace[day.field] : undefined);
    return allowedDays;
  }, {});
}

function storeAllowedDays(allowedDays) {
  return DAYS.reduce((spaceData, day) => {
    spaceData[day.field] = allowedDays[day.key];
    return spaceData;
  }, {});
}

function hasAnyAllowedDay(allowedDays) {
  return DAYS.some((day) => Boolean(allowedDays[day.key]));
}

function isAllowedDateForSpace(space, bookingDate) {
  return Boolean(space[DAY_FIELD_BY_WEEKDAY[bookingDate.getUTCDay()]]);
}

function resolveMaxSeatsPerBooking(existingSpace, input, occupancyMode) {
  if (occupancyMode !== 'SHARED') {
    return null;
  }
  if (input.maxSeatsPerBooking !== undefined) {
    return input.maxSeatsPerBooking || null;
  }
  return existingSpace ? existingSpace.maxSeatsPerBooking : null;
}

// Une datos actuales con el body validado; así creación y edición pasan por la misma validación final.
function buildSpaceData(existingSpace, input) {
  const current = existingSpace || {};
  const allowedDays = buildAllowedDays(current, input.allowedDays);
  const occupancyMode = input.occupancyMode ?? current.occupancyMode;

  return {
    name: input.name ?? current.name,
    description: input.description !== undefined ? (input.description || null) : (current.description || null),
    colorHex: input.colorHex ?? current.colorHex,
    isActive: input.isActive ?? current.isActive,
    totalCapacity: input.totalCapacity ?? current.totalCapacity,
    occupancyMode,
    maxSeatsPerBooking: resolveMaxSeatsPerBooking(existingSpace, input, occupancyMode),
    openingTime: input.openingTime ?? current.openingTime,
    closingTime: input.closingTime ?? current.closingTime,
    slotMinutes: input.slotMinutes ?? current.slotMinutes,
    ...storeAllowedDays(allowedDays),
    maxConsecutiveSlots: input.maxConsecutiveSlots ?? current.maxConsecutiveSlots,
    minAdvanceMinutes: input.minAdvanceMinutes ?? current.minAdvanceMinutes,
    maxAdvanceDays: input.maxAdvanceDays ?? current.maxAdvanceDays,
    cancellationNoticeMinutes: input.cancellationNoticeMinutes ?? current.cancellationNoticeMinutes
  };
}

// Valida la configuración completa del espacio, tanto en creación como tras aplicar un patch.
function assertValidSpaceConfiguration(spaceData) {
  const openingMinutes = parseTimeToMinutes(spaceData.openingTime);
  const closingMinutes = parseTimeToMinutes(spaceData.closingTime);
  const allowedDays = readAllowedDays(spaceData);

  if (openingMinutes >= closingMinutes) {
    throwValidation('openingTime', 'La hora de apertura debe ser anterior a la hora de cierre', 'El horario del espacio no es válido');
  }
  if (!hasAnyAllowedDay(allowedDays)) {
    throwValidation('allowedDays', 'Debes habilitar al menos un día de reserva', 'La configuración de días permitidos no es válida');
  }

  const minutesPerDay = closingMinutes - openingMinutes;
  if (minutesPerDay % spaceData.slotMinutes !== 0) {
    throwValidation('slotMinutes', 'La franja debe dividir exactamente el horario del espacio', 'El tamaño de franja del espacio no es válido');
  }

  const slotsPerDay = minutesPerDay / spaceData.slotMinutes;
  if (spaceData.maxConsecutiveSlots > slotsPerDay) {
    throwValidation('maxConsecutiveSlots', 'El máximo de franjas consecutivas no puede superar las franjas disponibles por día', 'La duración máxima de reserva no es válida');
  }
  if (spaceData.occupancyMode === 'SHARED' && spaceData.maxSeatsPerBooking && spaceData.maxSeatsPerBooking > spaceData.totalCapacity) {
    throwValidation('maxSeatsPerBooking', 'El máximo de plazas por reserva no puede superar el aforo total', 'La capacidad máxima por reserva no es válida');
  }
}

// --- Espacios: disponibilidad y mapeo ---
function buildDailySlots(space) {
  const openingMinutes = parseTimeToMinutes(space.openingTime);
  const closingMinutes = parseTimeToMinutes(space.closingTime);
  const slotsPerDay = (closingMinutes - openingMinutes) / space.slotMinutes;
  const slots = [];

  for (let slotIndex = 0; slotIndex < slotsPerDay; slotIndex += 1) {
    const startMinutes = openingMinutes + (slotIndex * space.slotMinutes);
    const endMinutes = startMinutes + space.slotMinutes;
    slots.push({ slotIndex, startTime: formatTimeFromMinutes(startMinutes), endTime: formatTimeFromMinutes(endMinutes) });
  }
  return slots;
}

// Acumula ocupación por franja; en modo EXCLUSIVE una reserva bloquea toda la capacidad.
function buildUsedSeatsBySlot(space, bookings) {
  const usedSeatsBySlot = new Map();

  for (const booking of bookings) {
    for (let slotIndex = booking.startSlotIndex; slotIndex < booking.startSlotIndex + booking.slotCount; slotIndex += 1) {
      const usedSeats = usedSeatsBySlot.get(slotIndex) || 0;
      usedSeatsBySlot.set(slotIndex, space.occupancyMode === 'EXCLUSIVE' ? space.totalCapacity : usedSeats + booking.requestedSeats);
    }
  }
  return usedSeatsBySlot;
}

function buildBookingRules(space) {
  return {
    maxConsecutiveSlots: space.maxConsecutiveSlots,
    minAdvanceMinutes: space.minAdvanceMinutes,
    maxAdvanceDays: space.maxAdvanceDays,
    cancellationNoticeMinutes: space.cancellationNoticeMinutes,
    oneBookingPerDay: true
  };
}

function mapSpace(space) {
  return {
    id: space.id,
    name: space.name,
    description: space.description || null,
    colorHex: space.colorHex,
    isActive: space.isActive,
    totalCapacity: space.totalCapacity,
    occupancyMode: space.occupancyMode,
    maxSeatsPerBooking: space.maxSeatsPerBooking || null,
    openingTime: space.openingTime,
    closingTime: space.closingTime,
    slotMinutes: space.slotMinutes,
    allowedDays: readAllowedDays(space),
    maxConsecutiveSlots: space.maxConsecutiveSlots,
    minAdvanceMinutes: space.minAdvanceMinutes,
    maxAdvanceDays: space.maxAdvanceDays,
    cancellationNoticeMinutes: space.cancellationNoticeMinutes,
    createdAt: space.createdAt.toISOString(),
    updatedAt: space.updatedAt.toISOString()
  };
}

function mapSpaceRef(space) {
  return {
    id: space.id,
    name: space.name,
    colorHex: space.colorHex,
    isActive: space.isActive,
    occupancyMode: space.occupancyMode,
    totalCapacity: space.totalCapacity,
    maxSeatsPerBooking: space.maxSeatsPerBooking || null
  };
}

// --- Reservas: reglas de creación y capacidad ---
// Convierte la petición del usuario en una reserva candidata con índices de franja y fechas absolutas.
function buildBookingCandidate(space, input) {
  const openingMinutes = parseTimeToMinutes(space.openingTime);
  const closingMinutes = parseTimeToMinutes(space.closingTime);
  const requestedStartMinutes = parseTimeToMinutes(input.startTime);

  if (requestedStartMinutes < openingMinutes || requestedStartMinutes >= closingMinutes) {
    throwValidation('startTime', 'La hora de inicio debe estar dentro del horario configurado del espacio', 'La franja solicitada no es válida');
  }

  const minutesFromOpening = requestedStartMinutes - openingMinutes;
  if (minutesFromOpening % space.slotMinutes !== 0) {
    throwValidation('startTime', 'La hora de inicio debe coincidir exactamente con una franja disponible', 'La franja solicitada no es válida');
  }
  if (input.slotCount > space.maxConsecutiveSlots) {
    throwValidation('slotCount', 'La reserva supera el máximo de franjas consecutivas permitido', 'La duración de la reserva no es válida');
  }

  const startSlotIndex = minutesFromOpening / space.slotMinutes;
  const endMinutes = requestedStartMinutes + (input.slotCount * space.slotMinutes);
  if (endMinutes > closingMinutes) {
    throwValidation('slotCount', 'La reserva debe terminar dentro del horario configurado del espacio', 'La franja solicitada no es válida');
  }

  const endTime = formatTimeFromMinutes(endMinutes);
  return {
    bookingDate: input.date,
    startSlotIndex,
    slotCount: input.slotCount,
    startTime: input.startTime,
    endTime,
    ...buildBookingRange(input.date, input.startTime, endTime)
  };
}

function overlaps(leftBooking, rightBooking) {
  const leftStart = leftBooking.startSlotIndex;
  const leftEnd = leftBooking.startSlotIndex + leftBooking.slotCount;
  const rightStart = rightBooking.startSlotIndex;
  const rightEnd = rightBooking.startSlotIndex + rightBooking.slotCount;
  return leftStart < rightEnd && rightStart < leftEnd;
}

function assertRequestedSeats(space, requestedSeats) {
  if (requestedSeats > space.totalCapacity) {
    throwValidation('requestedSeats', 'Las plazas solicitadas no pueden superar el aforo total del espacio', 'La capacidad solicitada no es válida');
  }
  if (space.occupancyMode === 'SHARED' && space.maxSeatsPerBooking && requestedSeats > space.maxSeatsPerBooking) {
    throwValidation('requestedSeats', 'Las plazas solicitadas no pueden superar el máximo configurado por reserva', 'La capacidad solicitada no es válida');
  }
}

function assertBookingAdvanceRules(space, bookingCandidate, now = new Date()) {
  const minStartsAt = addMinutesToInstant(now, space.minAdvanceMinutes);
  if (bookingCandidate.startsAt < minStartsAt) {
    throw new ConflictError('La reserva debe hacerse con la antelación mínima configurada');
  }

  const maxStartsAt = addMinutesToInstant(now, space.maxAdvanceDays * 24 * 60);
  if (bookingCandidate.startsAt > maxStartsAt) {
    throw new ConflictError('La reserva supera la antelación máxima permitida');
  }
}

// Revisa solapamientos y aforo sin tocar base de datos; el servicio decide antes de crear.
function assertBookingConflicts(space, bookingCandidate, requestedSeats, existingBookings) {
  if (space.occupancyMode === 'EXCLUSIVE') {
    const conflict = existingBookings.find((booking) => overlaps(bookingCandidate, booking));
    if (conflict) {
      throw new ConflictError('Ya existe una reserva que bloquea alguna de las franjas solicitadas');
    }
    return;
  }
  const usedSeatsBySlot = buildUsedSeatsBySlot(space, existingBookings);
  for (let slotIndex = bookingCandidate.startSlotIndex; slotIndex < bookingCandidate.startSlotIndex + bookingCandidate.slotCount; slotIndex += 1) {
    if ((usedSeatsBySlot.get(slotIndex) || 0) + requestedSeats > space.totalCapacity) {
      throw new ConflictError('La capacidad disponible no es suficiente para las plazas solicitadas');
    }
  }
}

function assertSpaceCanReceiveBooking(space, input, now = new Date()) {
  if (!space.isActive) {
    throw new ConflictError('El espacio no admite nuevas reservas porque está inactivo');
  }
  if (!isAllowedDateForSpace(space, input.date)) {
    throw new ConflictError('El espacio no permite reservas en el día seleccionado');
  }

  assertRequestedSeats(space, input.requestedSeats);

  const bookingCandidate = buildBookingCandidate(space, input);
  assertBookingAdvanceRules(space, bookingCandidate, now);
  return bookingCandidate;
}

// --- Reservas: reglas de lectura y cancelación ---
function canOwnerCancelBooking(booking, now = new Date()) {
  if (booking.status !== 'ACTIVE') {
    return false;
  }
  const { startsAt } = buildBookingRange(booking.bookingDate, booking.startTime, booking.endTime);
  const cutoff = addMinutesToInstant(startsAt, -booking.space.cancellationNoticeMinutes);
  return now <= cutoff;
}

function canActorCancelBooking(actorMembership, booking, now = new Date()) {
  if (booking.status !== 'ACTIVE') {
    return false;
  }
  if (hasAdministrativeRole(actorMembership)) {
    return true;
  }
  if (booking.ownerMembershipId !== actorMembership.id) {
    return false;
  }
  return canOwnerCancelBooking(booking, now);
}

// --- Reservas: mapeo de salida ---
function buildBookingCalendarItem(booking) {
  return {
    bookingId: booking.id,
    date: formatBusinessDate(booking.bookingDate),
    startTime: booking.startTime,
    endTime: booking.endTime,
    requestedSeats: booking.requestedSeats,
    status: booking.status
  };
}

function mapBooking(booking, actorMembership, now = new Date()) {
  const { startsAt, endsAt } = buildBookingRange(booking.bookingDate, booking.startTime, booking.endTime);

  return {
    id: booking.id,
    status: booking.status,
    date: formatBusinessDate(booking.bookingDate),
    startTime: booking.startTime,
    endTime: booking.endTime,
    slotCount: booking.slotCount,
    requestedSeats: booking.requestedSeats,
    startsAt: startsAt ? startsAt.toISOString() : null,
    endsAt: endsAt ? endsAt.toISOString() : null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    cancelledAt: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
    cancellationReason: booking.cancellationReason || null,
    canCancel: booking.space ? canActorCancelBooking(actorMembership, booking, now) : false,
    space: booking.space ? mapSpaceRef(booking.space) : null,
    owner: mapMembershipRef(booking.ownerMembership),
    cancelledBy: mapMembershipRef(booking.cancelledByMembership)
  };
}

// --- Correos del módulo ---
function formatBookingDateForMail(bookingDate) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeZone: 'UTC' }).format(bookingDate);
}

function formatParticipants(requestedSeats) {
  return `${requestedSeats} ${requestedSeats === 1 ? 'persona' : 'personas'}`;
}

function trimCalendarTitle(title) {
  if (title.length <= MAX_CALENDAR_TITLE_LENGTH) {
    return title;
  }
  return `${title.slice(0, MAX_CALENDAR_TITLE_LENGTH - 3).trimEnd()}...`;
}

function buildReservationCalendarTitle(booking) {
  return trimCalendarTitle(`Reserva: ${booking.space.name} · ${formatParticipants(booking.requestedSeats)}`);
}

// Los correos son auxiliares: si fallan, se registra el problema pero no se rompe la reserva.
async function notifyBookingCreated({ booking, membership }) {
  const targetEmail = membership.user?.email;

  if (!targetEmail) {
    return;
  }

  const greeting = membership.alias || 'usuario';
  const communityName = membership.community?.name || 'tu comunidad';
  const text = [
    `Hola ${greeting},`,
    '',
    `Tu reserva en la comunidad "${communityName}" se ha confirmado correctamente.`,
    '',
    `Espacio reservado: ${booking.space.name}`,
    `Número de plazas reservadas: ${formatParticipants(booking.requestedSeats)}`,
    `Fecha: ${formatBookingDateForMail(booking.bookingDate)}`,
    `Hora: ${booking.startTime} - ${booking.endTime}`,
    '',
    'Puedes consultar o cancelar la reserva desde SIGECO.'
  ].join('\n');

  try {
    await mailService.sendMail({ to: targetEmail, subject: `SIGECO - Reserva confirmada en ${booking.space.name}`, text });
  }
  catch (error) {
    console.warn('No se ha podido enviar el correo de confirmación de reserva', { bookingId: booking.id, communityId: booking.communityId, error });
  }
}

function bookingDateLabel(booking) {
  return formatBookingDateForMail(booking.bookingDate);
}

// Avisa al propietario cuando la administración cancela manualmente su reserva.
async function notifyBookingCancelledByAdmin({ booking, actorMembership, reason }) {
  const targetEmail = booking.ownerMembership?.user?.email;

  if (!targetEmail) {
    return;
  }

  const greeting = booking.ownerMembership?.alias || 'usuario';
  const communityName = actorMembership.community?.name || 'tu comunidad';
  const reasonLines = reason ? [`Motivo indicado: ${reason}`, ''] : [];
  const text = [
    `Hola ${greeting},`,
    '',
    `La administración de la comunidad "${communityName}" ha cancelado tu reserva.`,
    '',
    `Espacio reservado: ${booking.space.name}`,
    `Número de plazas reservadas: ${formatParticipants(booking.requestedSeats)}`,
    `Fecha: ${bookingDateLabel(booking)}`,
    `Hora: ${booking.startTime} - ${booking.endTime}`,
    '',
    ...reasonLines,
    'Puedes consultar tus reservas desde el portal SIGECO.'
  ].join('\n');

  try {
    await mailService.sendMail({ to: targetEmail, subject: `SIGECO - Reserva cancelada en ${booking.space.name}`, text });
  }
  catch (error) {
    console.warn('No se ha podido enviar el correo de cancelación administrativa de reserva', { bookingId: booking.id, communityId: booking.communityId, error });
  }
}

// Avisa una a una las reservas canceladas por cambios de reglas; cada envío falla de forma aislada.
async function notifyBookingsCancelledBySpaceUpdate({ bookings, space, communityName }) {
  for (const booking of bookings) {
    const targetEmail = booking.ownerMembership?.user?.email;

    if (!targetEmail) {
      continue;
    }

    const greeting = booking.ownerMembership?.alias || 'usuario';
    const text = [
      `Hola ${greeting},`,
      '',
      `Tu reserva del espacio "${space.name}" en la comunidad "${communityName}" ha sido cancelada porque se han actualizado las reglas del espacio.`,
      '',
      `Fecha: ${bookingDateLabel(booking)}`,
      `Hora: ${booking.startTime} - ${booking.endTime}`,
      '',
      'Puedes consultar la disponibilidad y realizar una nueva reserva desde SIGECO.'
    ].join('\n');

    try {
      await mailService.sendMail({ to: targetEmail, subject: `SIGECO - Reserva cancelada en ${space.name}`, text });
    } 
    catch (error) {
      console.warn('No se ha podido enviar el correo de cancelación por cambio de espacio', { bookingId: booking.id, communityId: booking.communityId, error });
    }
  }
}

// Aviso comunitario tras deshabilitar un espacio; los fallos de correo no cambian el resultado HTTP.
async function notifySpaceDisabledToCommunity({ communityId, space, cancelledBookingCount, reservationsRepository }) {
  try {
    const members = await reservationsRepository.findCommunityReservationMailMembers(communityId);
    const communityName = members[0]?.community?.name || 'tu comunidad';
    const cancellationLine = cancelledBookingCount > 0
      ? 'Por este motivo, las reservas pendientes asociadas a este espacio han sido canceladas.'
      : 'Actualmente no constaban reservas pendientes asociadas a este espacio.';

    for (const member of members) {
      const targetEmail = member.user?.email;

      if (!targetEmail) {
        continue;
      }

      const greeting = member.alias || 'usuario';
      const text = [
        `Hola ${greeting},`,
        '',
        `El espacio "${space.name}" de la comunidad "${communityName}" se ha deshabilitado temporalmente.`,
        '',
        cancellationLine,
        '',
        'Puedes consultar SIGECO para más información.'
      ].join('\n');

      try {
        await mailService.sendMail({ to: targetEmail, subject: `SIGECO - Espacio deshabilitado en ${communityName}`, text });
      } 
      catch (error) {
        console.warn('No se ha podido enviar un correo de espacio deshabilitado', { communityId, memberId: member.id, spaceId: space.id, error });
      }
    }
  } 
  catch (error) {
    console.warn('No se han podido preparar los correos de espacio deshabilitado', { communityId, spaceId: space.id, error });
  }
}

// --- Impacto de cambios en espacios ---
// Recalcula una reserva existente contra la nueva configuración del espacio.
function normalizeBookingForSpace(space, booking) {
  const openingMinutes = parseTimeToMinutes(space.openingTime);
  const closingMinutes = parseTimeToMinutes(space.closingTime);
  const startMinutes = parseTimeToMinutes(booking.startTime);
  const endMinutes = parseTimeToMinutes(booking.endTime);
  const durationMinutes = endMinutes - startMinutes;

  if (startMinutes < openingMinutes || startMinutes >= closingMinutes || endMinutes > closingMinutes || durationMinutes <= 0) {
    return null;
  }
  if ((startMinutes - openingMinutes) % space.slotMinutes !== 0 || durationMinutes % space.slotMinutes !== 0) {
    return null;
  }

  const slotCount = durationMinutes / space.slotMinutes;
  if (slotCount > space.maxConsecutiveSlots) {
    return null;
  }
  return {
    ...booking,
    startSlotIndex: (startMinutes - openingMinutes) / space.slotMinutes,
    slotCount
  };
}

function isBookingOverCapacity(space, booking) {
  if (booking.requestedSeats > space.totalCapacity) {
    return true;
  }
  return space.occupancyMode === 'SHARED' && space.maxSeatsPerBooking && booking.requestedSeats > space.maxSeatsPerBooking;
}

function groupBookingsByDate(bookings) {
  return bookings.reduce((groups, booking) => {
    const key = formatBusinessDate(booking.bookingDate);
    const group = groups.get(key) || [];
    group.push(booking);
    groups.set(key, group);
    return groups;
  }, new Map());
}

// Decide qué reservas sobreviven al nuevo aforo y cuáles deben cancelarse.
function findCapacityAffectedBookingIds(space, bookings) {
  const affectedIds = new Set();

  for (const group of groupBookingsByDate(bookings).values()) {
    const keptBookings = [];

    for (const booking of group) {
      if (space.occupancyMode === 'EXCLUSIVE') {
        if (keptBookings.some((keptBooking) => overlaps(booking, keptBooking))) {
          affectedIds.add(booking.id);
          continue;
        }
        keptBookings.push(booking);
        continue;
      }

      const usedSeatsBySlot = buildUsedSeatsBySlot(space, keptBookings);
      let exceedsCapacity = false;
      for (let slotIndex = booking.startSlotIndex; slotIndex < booking.startSlotIndex + booking.slotCount; slotIndex += 1) {
        if ((usedSeatsBySlot.get(slotIndex) || 0) + booking.requestedSeats > space.totalCapacity) {
          exceedsCapacity = true;
          break;
        }
      }

      if (exceedsCapacity) { affectedIds.add(booking.id); } 
      else { keptBookings.push(booking); }
    }
  }
  return affectedIds;
}

// Impacto de una actualización de espacio: reservas canceladas y reservas que solo cambian de índice.
function calculateSpaceUpdateImpact(existingSpace, nextSpace, bookings) {
  const affectedIds = new Set();
  const normalizedBookings = [];

  for (const booking of bookings) {
    if (existingSpace.slotMinutes !== nextSpace.slotMinutes || !isAllowedDateForSpace(nextSpace, booking.bookingDate)) {
      affectedIds.add(booking.id);
      continue;
    }

    const normalizedBooking = normalizeBookingForSpace(nextSpace, booking);
    if (!normalizedBooking || isBookingOverCapacity(nextSpace, normalizedBooking)) {
      affectedIds.add(booking.id);
      continue;
    }
    normalizedBookings.push(normalizedBooking);
  }

  for (const bookingId of findCapacityAffectedBookingIds(nextSpace, normalizedBookings)) {
    affectedIds.add(bookingId);
  }

  const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));
  const slotUpdates = normalizedBookings
    .filter((booking) => !affectedIds.has(booking.id))
    .filter((booking) => {
      const originalBooking = bookingById.get(booking.id);
      return booking.startSlotIndex !== originalBooking?.startSlotIndex || booking.slotCount !== originalBooking?.slotCount;
    })
    .map((booking) => ({
      bookingId: booking.id,
      communityId: booking.communityId,
      startSlotIndex: booking.startSlotIndex,
      slotCount: booking.slotCount
    }));

  return {
    affectedBookings: bookings.filter((booking) => affectedIds.has(booking.id)),
    slotUpdates
  };
}

// --- Permisos y existencia ---
async function requireReservationsAccess(userId, communityId) {
  return membersService.requireOperationalCommunityAccess(userId, communityId, membersRepository);
}

async function requireReservationsAdminAccess(userId, communityId) {
  return membersService.requireAdministrativeCommunityAccess(userId, communityId, membersRepository);
}

async function requireSpace(communityId, spaceId, reservationsRepository) {
  const space = await reservationsRepository.findSpaceById({ communityId, spaceId });
  if (!space || space.deletedAt) {
    throw new NotFoundError('Espacio no encontrado');
  }
  return space;
}

async function requireBooking(communityId, bookingId, reservationsRepository) {
  const booking = await reservationsRepository.findBookingById({ communityId, bookingId });
  if (!booking) {
    throw new NotFoundError('Reserva no encontrada');
  }
  return booking;
}

function assertCanReadInactiveSpaces(membership, status) {
  if (status === 'active' || hasAdministrativeRole(membership)) {
    return;
  }
  throw new ForbiddenError('Solo la administración puede consultar espacios inactivos');
}

function assertCanReadBooking(actorMembership, booking, forbiddenMessage = 'No tienes permisos para consultar esta reserva') {
  if (booking.ownerMembershipId === actorMembership.id || hasAdministrativeRole(actorMembership)) {
    return;
  }
  throw new ForbiddenError(forbiddenMessage);
}

function assertCanCancelBooking(actorMembership, booking, now = new Date()) {
  if (booking.status !== 'ACTIVE') {
    throw new ConflictError('La reserva ya está cancelada');
  }
  if (hasAdministrativeRole(actorMembership)) {
    return;
  }
  if (booking.ownerMembershipId !== actorMembership.id) {
    throw new ForbiddenError('No tienes permisos para cancelar esta reserva');
  }
  if (!canOwnerCancelBooking(booking, now)) {
    throw new ConflictError('La reserva ya no puede cancelarse dentro del plazo permitido');
  }
}

// --- Espacios: GET de consulta ---
async function getSpaceList(context, communityId, input, reservationsRepository) {
  const { membership } = await requireReservationsAccess(context.userId, communityId);
  assertCanReadInactiveSpaces(membership, input.status);
  const pageResult = await reservationsRepository.findSpacePage({
    communityId,
    search: input.search || undefined,
    status: input.status,
    page: input.page,
    pageSize: input.pageSize
  });
  return buildPageResult(input, pageResult, mapSpace);
}

async function getSpaceDetail(context, communityId, spaceId, reservationsRepository) {
  await requireReservationsAccess(context.userId, communityId);
  const space = await requireSpace(communityId, spaceId, reservationsRepository);
  return { space: mapSpace(space) };
}

async function getSpaceAvailability(context, communityId, spaceId, input, reservationsRepository) {
  await requireReservationsAccess(context.userId, communityId);

  const space = await requireSpace(communityId, spaceId, reservationsRepository);
  const bookings = await reservationsRepository.findSpaceBookingsOnDate({
    communityId,
    spaceId,
    bookingDate: input.date,
    status: 'ACTIVE'
  });

  const allowedDay = isAllowedDateForSpace(space, input.date);
  const usedSeatsBySlot = buildUsedSeatsBySlot(space, bookings);

  // Cada slot se calcula desde la configuración del espacio y la ocupación real del día.
  return {
    space: mapSpace(space),
    bookingRules: buildBookingRules(space),
    date: formatBusinessDate(input.date),
    slots: buildDailySlots(space).map((slot) => {
      const bookedSeats = usedSeatsBySlot.get(slot.slotIndex) || 0;
      const remainingCapacity = Math.max(space.totalCapacity - bookedSeats, 0);
      return {
        slotIndex: slot.slotIndex,
        startTime: slot.startTime,
        endTime: slot.endTime,
        available: space.isActive && allowedDay && remainingCapacity > 0,
        bookedSeats,
        remainingCapacity
      };
    })
  };
}

async function getSpaceCalendar(context, communityId, spaceId, input, reservationsRepository) {
  await requireReservationsAccess(context.userId, communityId);
  await requireSpace(communityId, spaceId, reservationsRepository);

  const { startDate, endDate } = buildMonthRange(input.month);
  const bookings = await reservationsRepository.findSpaceBookingsInDateRange({ communityId, spaceId, startDate, endDate });
  return { month: input.month, items: bookings.map(buildBookingCalendarItem) };
}

// --- Espacios: POST de creación ---
async function createSpace(context, communityId, input, reservationsRepository) {
  await requireReservationsAdminAccess(context.userId, communityId);
  const spaceData = buildSpaceData(null, input);

  assertValidSpaceConfiguration(spaceData);

  const space = await reservationsRepository.withTransaction((tx) =>
    reservationsRepository.createSpace(tx, { communityId, ...spaceData })
  );
  return { space: mapSpace(space) };
}

// --- Espacios: PATCH de edición ---
async function updateSpace(context, communityId, spaceId, input, reservationsRepository) {
  const { membership } = await requireReservationsAdminAccess(context.userId, communityId);
  const existingSpace = await requireSpace(communityId, spaceId, reservationsRepository);
  const nextSpace = buildSpaceData(existingSpace, input);

  assertValidSpaceConfiguration(nextSpace);

  const now = new Date();
  const futureBookings = await reservationsRepository.findFutureActiveBookingsForSpace({
    communityId,
    spaceId,
    nowDate: buildBusinessDateOnly(now),
    nowTime: formatBusinessTime(now)
  });
  const { affectedBookings, slotUpdates } = calculateSpaceUpdateImpact(existingSpace, nextSpace, futureBookings);
  const affectedBookingIds = affectedBookings.map((booking) => booking.id);

  // La actualización del espacio y el ajuste/cancelación de reservas viajan juntos para no desincronizar calendar.
  const updatedSpace = await reservationsRepository.withTransaction(async (tx) => {
    const updated = await reservationsRepository.updateSpace(tx, { communityId, spaceId, data: nextSpace });

    if (!updated) {
      return null;
    }

    await reservationsRepository.updateBookingSlotPositions(tx, slotUpdates);
    await reservationsRepository.cancelActiveBookingsByIds(tx, {
      communityId,
      bookingIds: affectedBookingIds,
      cancelledAt: now,
      cancelledByMembershipId: membership.id,
      cancellationReason: 'Reglas del espacio actualizadas'
    });
    await calendarRepository.softDeleteReservationEventsBySourceEntityIds(tx, affectedBookingIds, now);
    return updated;
  });

  if (!updatedSpace) {
    throw new ConflictError('No se ha podido actualizar el espacio');
  }
  await notifyBookingsCancelledBySpaceUpdate({
    bookings: affectedBookings,
    space: updatedSpace,
    communityName: membership.community?.name || 'tu comunidad'
  });
  return { space: mapSpace(updatedSpace) };
}

// Cambia solo el estado activo/inactivo. Al deshabilitar, cancela reservas futuras activas.
async function updateSpaceStatus(context, communityId, spaceId, input, reservationsRepository) {
  const { membership } = await requireReservationsAdminAccess(context.userId, communityId);
  const existingSpace = await requireSpace(communityId, spaceId, reservationsRepository);
  const disabledAt = new Date();
  const shouldCancelBookings = existingSpace.isActive && input.isActive === false;
  const bookingsToCancel = shouldCancelBookings
    ? await reservationsRepository.findFutureActiveBookingsForSpace({
        communityId,
        spaceId,
        nowDate: buildBusinessDateOnly(disabledAt),
        nowTime: formatBusinessTime(disabledAt)
      })
    : [];
  const bookingIdsToCancel = bookingsToCancel.map((booking) => booking.id);

  // Deshabilitar un espacio cancela futuras reservas activas y borra sus eventos en la misma transacción.
  const updatedSpace = await reservationsRepository.withTransaction(async (tx) => {
    const updated = await reservationsRepository.updateSpace(tx, { communityId, spaceId, data: { isActive: input.isActive } });

    if (!updated) {
      return null;
    }

    if (shouldCancelBookings) {
      await reservationsRepository.cancelActiveBookingsByIds(tx, {
        communityId,
        bookingIds: bookingIdsToCancel,
        cancelledAt: disabledAt,
        cancelledByMembershipId: membership.id,
        cancellationReason: 'Espacio deshabilitado temporalmente'
      });
      await calendarRepository.softDeleteReservationEventsBySourceEntityIds(tx, bookingIdsToCancel, disabledAt);
    }
    return updated;
  });

  if (!updatedSpace) {
    throw new ConflictError('No se ha podido actualizar el estado del espacio');
  }
  if (shouldCancelBookings) {
    await notifySpaceDisabledToCommunity({
      communityId,
      space: updatedSpace,
      cancelledBookingCount: bookingIdsToCancel.length,
      reservationsRepository
    });
  }
  return { space: mapSpace(updatedSpace) };
}

// --- Espacios: DELETE lógico ---
async function deleteSpace(context, communityId, spaceId, reservationsRepository) {
  const { membership } = await requireReservationsAdminAccess(context.userId, communityId);
  const space = await requireSpace(communityId, spaceId, reservationsRepository);
  const deletedAt = new Date();

  // El borrado lógico también limpia reservas activas y sus eventos asociados.
  const deleted = await reservationsRepository.withTransaction(async (tx) => {
    const deletedSpace = await reservationsRepository.softDeleteSpace(tx, { communityId, spaceId, deletedAt });

    if (!deletedSpace) {
      return false;
    }

    const cancelledBookingIds = await reservationsRepository.cancelActiveBookingsBySpaceId(tx, {
      communityId,
      spaceId,
      cancelledAt: deletedAt,
      cancelledByMembershipId: membership.id,
      cancellationReason: 'Espacio común eliminado'
    });

    await calendarRepository.softDeleteReservationEventsBySourceEntityIds(tx, cancelledBookingIds, deletedAt);
    return true;
  });

  if (!deleted) {
    throw new ConflictError('No se ha podido eliminar el espacio');
  }
  return { deleted: true, spaceId: space.id };
}

// --- Reservas propias: GET de consulta ---
async function getMyBookings(context, communityId, input, reservationsRepository) {
  const { membership } = await requireReservationsAccess(context.userId, communityId);
  const now = new Date();

  const pageResult = await reservationsRepository.findBookingPageForMembership({
    communityId,
    ownerMembershipId: membership.id,
    spaceId: input.spaceId || undefined,
    scope: input.scope,
    page: input.page,
    pageSize: input.pageSize,
    nowDate: buildBusinessDateOnly(now),
    nowTime: formatBusinessTime(now)
  });
  return buildPageResult(input, pageResult, (booking) => mapBooking(booking, membership, now));
}

async function getBookingDetail(context, communityId, bookingId, reservationsRepository) {
  const { membership } = await requireReservationsAccess(context.userId, communityId);
  const booking = await requireBooking(communityId, bookingId, reservationsRepository);
  assertCanReadBooking(membership, booking);
  return { booking: mapBooking(booking, membership) };
}

// --- Reservas propias: POST de creación/cancelación ---
async function createBooking(context, communityId, input, reservationsRepository) {
  const { membership } = await requireReservationsAccess(context.userId, communityId);
  const space = await requireSpace(communityId, input.spaceId, reservationsRepository);
  const bookingCandidate = assertSpaceCanReceiveBooking(space, input);

  const existingDailyBooking = await reservationsRepository.findActiveBookingByMembershipSpaceAndDate({
    communityId,
    ownerMembershipId: membership.id,
    spaceId: space.id,
    bookingDate: input.date
  });

  if (existingDailyBooking) {
    throw new ConflictError('Solo se permite una reserva activa por espacio y día para el mismo usuario');
  }

  const sameDayBookings = await reservationsRepository.findSpaceBookingsOnDate({
    communityId,
    spaceId: space.id,
    bookingDate: input.date,
    status: 'ACTIVE'
  });

  assertBookingConflicts(space, bookingCandidate, input.requestedSeats, sameDayBookings);

  // Crear reserva y evento propio de calendar es una sola operación lógica.
  const createdBooking = await reservationsRepository.withTransaction(async (tx) => {
    const booking = await reservationsRepository.createBooking(tx, {
      communityId,
      spaceId: space.id,
      ownerMembershipId: membership.id,
      bookingDate: bookingCandidate.bookingDate,
      startSlotIndex: bookingCandidate.startSlotIndex,
      slotCount: bookingCandidate.slotCount,
      startTime: bookingCandidate.startTime,
      endTime: bookingCandidate.endTime,
      requestedSeats: input.requestedSeats
    });

    await calendarRepository.upsertOwnedReservationEventInDb(tx, {
      communityId,
      ownerMembershipId: membership.id,
      bookingId: booking.id,
      title: buildReservationCalendarTitle(booking),
      eventDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime
    });
    return booking;
  });

  await notifyBookingCreated({ booking: createdBooking, membership });
  return { booking: mapBooking(createdBooking, membership) };
}

async function cancelBooking(context, communityId, bookingId, input, reservationsRepository) {
  const { membership } = await requireReservationsAccess(context.userId, communityId);
  const booking = await requireBooking(communityId, bookingId, reservationsRepository);

  assertCanReadBooking(membership, booking, 'No tienes permisos para cancelar esta reserva');
  assertCanCancelBooking(membership, booking);

  const cancelledAt = new Date();

  // Cancelar una reserva también borra su evento propio del calendario.
  const cancelledBooking = await reservationsRepository.withTransaction(async (tx) => {
    const updatedBooking = await reservationsRepository.cancelBooking(tx, {
      communityId,
      bookingId,
      cancelledAt,
      cancelledByMembershipId: membership.id,
      cancellationReason: input.reason
    });

    if (!updatedBooking) {
      throw new ConflictError('No se ha podido cancelar la reserva');
    }

    await calendarRepository.softDeleteOwnedReservationEventInDb(tx, {
      communityId,
      ownerMembershipId: booking.ownerMembershipId,
      bookingId,
      deletedAt: cancelledAt
    });
    return updatedBooking;
  });

  if (hasAdministrativeRole(membership) && booking.ownerMembershipId !== membership.id) {
    await notifyBookingCancelledByAdmin({ booking: cancelledBooking, actorMembership: membership, reason: input.reason });
  }

  return { booking: mapBooking(cancelledBooking, membership, cancelledAt) };
}

// --- Administración de reservas: GET de consulta ---
async function getAdminBookings(context, communityId, input, reservationsRepository) {
  const { membership } = await requireReservationsAdminAccess(context.userId, communityId);
  const pageResult = await reservationsRepository.findBookingPageAdmin({
    communityId,
    spaceId: input.spaceId || undefined,
    status: input.status,
    from: input.from,
    to: input.to,
    page: input.page,
    pageSize: input.pageSize
  });
  return buildPageResult(input, pageResult, (booking) => mapBooking(booking, membership));
}

module.exports = {
  getSpaceList,
  getSpaceDetail,
  getSpaceAvailability,
  getSpaceCalendar,
  createSpace,
  updateSpace,
  updateSpaceStatus,
  deleteSpace,
  getMyBookings,
  getBookingDetail,
  createBooking,
  cancelBooking,
  getAdminBookings
};