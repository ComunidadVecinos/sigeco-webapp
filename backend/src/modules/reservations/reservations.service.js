// Servicio del módulo reservations.
// Centraliza permisos, validaciones de horarios/reglas y sincronización con calendar.
const { ConflictError, ForbiddenError, NotFoundError, ValidationError } = require('../../lib/errors');
const { addMinutesToInstant, buildBusinessDateOnly, buildBusinessDateTime, formatBusinessDate, formatBusinessTime } = require('../calendar/calendar.datetime');
const calendarRepository = require('../calendar/calendar.repository');
const { hasAdministrativeRole } = require('../members/members.access');
const membersRepository = require('../members/members.repository');
const membersService = require('../members/members.service');

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

const STRUCTURAL_SPACE_FIELDS = [
  'occupancyMode',
  'totalCapacity',
  'maxSeatsPerBooking',
  'openingTime',
  'closingTime',
  'slotMinutes',
  'maxConsecutiveSlots',
  'mondayEnabled',
  'tuesdayEnabled',
  'wednesdayEnabled',
  'thursdayEnabled',
  'fridayEnabled',
  'saturdayEnabled',
  'sundayEnabled'
];

// --- Common ---
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

function parseTimeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

function formatTimeFromMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function buildMonthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return {
    startDate: new Date(Date.UTC(year, monthNumber - 1, 1)),
    endDate: new Date(Date.UTC(year, monthNumber, 1))
  };
}

function buildBookingRange(bookingDate, startTime, endTime) {
  return {
    startsAt: buildBusinessDateTime(bookingDate, startTime),
    endsAt: buildBusinessDateTime(bookingDate, endTime)
  };
}

function mapMembershipRef(membership) {
  if (!membership) {
    return null;
  }
  return { membershipId: membership.id, alias: membership.alias || null, role: membership.role };
}

// --- Spaces ---
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

function buildSpaceData(existingSpace, input) {
  const currentSpace = existingSpace || {};
  const allowedDays = buildAllowedDays(currentSpace, input.allowedDays);
  const occupancyMode = input.occupancyMode ?? currentSpace.occupancyMode;

  return {
    name: input.name ?? currentSpace.name,
    description: input.description !== undefined ? (input.description || null) : (currentSpace.description || null),
    colorHex: input.colorHex ?? currentSpace.colorHex,
    isActive: input.isActive ?? currentSpace.isActive,
    totalCapacity: input.totalCapacity ?? currentSpace.totalCapacity,
    occupancyMode,
    maxSeatsPerBooking: resolveMaxSeatsPerBooking(existingSpace, input, occupancyMode),
    openingTime: input.openingTime ?? currentSpace.openingTime,
    closingTime: input.closingTime ?? currentSpace.closingTime,
    slotMinutes: input.slotMinutes ?? currentSpace.slotMinutes,
    ...storeAllowedDays(allowedDays),
    maxConsecutiveSlots: input.maxConsecutiveSlots ?? currentSpace.maxConsecutiveSlots,
    minAdvanceMinutes: input.minAdvanceMinutes ?? currentSpace.minAdvanceMinutes,
    maxAdvanceDays: input.maxAdvanceDays ?? currentSpace.maxAdvanceDays,
    cancellationNoticeMinutes: input.cancellationNoticeMinutes ?? currentSpace.cancellationNoticeMinutes
  };
}

function isStructuralSpaceChange(existingSpace, nextSpace) {
  return STRUCTURAL_SPACE_FIELDS.some((field) => existingSpace[field] !== nextSpace[field]);
}

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

// --- Bookings ---
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
  const minimumAllowedStartsAt = addMinutesToInstant(now, space.minAdvanceMinutes);
  if (bookingCandidate.startsAt < minimumAllowedStartsAt) {
    throw new ConflictError('La reserva debe hacerse con la antelación mínima configurada');
  }
  const maximumAllowedStartsAt = addMinutesToInstant(now, space.maxAdvanceDays * 24 * 60);
  if (bookingCandidate.startsAt > maximumAllowedStartsAt) {
    throw new ConflictError('La reserva supera la antelación máxima permitida');
  }
}

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

// --- Access ---
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

function assertCanReadBooking(actorMembership, booking) {
  if (booking.ownerMembershipId === actorMembership.id || hasAdministrativeRole(actorMembership)) {
    return;
  }
  throw new ForbiddenError('No tienes permisos para consultar esta reserva');
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

async function assertStructuralChangesAllowed(existingSpace, nextSpace, reservationsRepository) {
  if (!isStructuralSpaceChange(existingSpace, nextSpace)) {
    return;
  }
  const now = new Date();
  const futureBookings = await reservationsRepository.findFutureActiveBookingsForSpace({
    communityId: existingSpace.communityId,
    spaceId: existingSpace.id,
    nowDate: buildBusinessDateOnly(now),
    nowTime: formatBusinessTime(now)
  });
  if (futureBookings.length > 0) {
    throw new ConflictError('No se puede cambiar la configuración estructural del espacio mientras existan reservas futuras activas');
  }
}

// --- Public spaces ---
async function createSpace(context, communityId, input, reservationsRepository) {
  await requireReservationsAdminAccess(context.userId, communityId);
  const spaceData = buildSpaceData(null, input);
  assertValidSpaceConfiguration(spaceData);
  const space = await reservationsRepository.withTransaction((tx) =>
    reservationsRepository.createSpace(tx, { communityId, ...spaceData })
  );
  return { space: mapSpace(space) };
}

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

async function updateSpace(context, communityId, spaceId, input, reservationsRepository) {
  await requireReservationsAdminAccess(context.userId, communityId);

  const existingSpace = await requireSpace(communityId, spaceId, reservationsRepository);
  const nextSpace = buildSpaceData(existingSpace, input);

  assertValidSpaceConfiguration(nextSpace);
  await assertStructuralChangesAllowed(existingSpace, nextSpace, reservationsRepository);

  const updatedSpace = await reservationsRepository.withTransaction((tx) =>
    reservationsRepository.updateSpace(tx, { communityId, spaceId, data: nextSpace })
  );

  if (!updatedSpace) {
    throw new ConflictError('No se ha podido actualizar el espacio');
  }
  return { space: mapSpace(updatedSpace) };
}

async function updateSpaceStatus(context, communityId, spaceId, input, reservationsRepository) {
  await requireReservationsAdminAccess(context.userId, communityId);
  await requireSpace(communityId, spaceId, reservationsRepository);

  const updatedSpace = await reservationsRepository.withTransaction((tx) =>
    reservationsRepository.updateSpace(tx, { communityId, spaceId, data: { isActive: input.isActive } })
  );

  if (!updatedSpace) {
    throw new ConflictError('No se ha podido actualizar el estado del espacio');
  }
  return { space: mapSpace(updatedSpace) };
}

async function deleteSpace(context, communityId, spaceId, reservationsRepository) {
  await requireReservationsAdminAccess(context.userId, communityId);

  const space = await requireSpace(communityId, spaceId, reservationsRepository);
  const deleted = await reservationsRepository.withTransaction((tx) =>
    reservationsRepository.softDeleteSpace(tx, { communityId, spaceId, deletedAt: new Date() })
  );

  if (!deleted) {
    throw new ConflictError('No se ha podido eliminar el espacio');
  }
  return { deleted: true, spaceId: space.id };
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

// --- Public bookings ---
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
      title: `Reserva: ${booking.space.name}`,
      eventDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime
    });
    return booking;
  });

  return { booking: mapBooking(createdBooking, membership) };
}

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

async function cancelBooking(context, communityId, bookingId, input, reservationsRepository) {
  const { membership } = await requireReservationsAccess(context.userId, communityId);
  const booking = await requireBooking(communityId, bookingId, reservationsRepository);

  assertCanReadBooking(membership, booking);
  assertCanCancelBooking(membership, booking);

  const cancelledAt = new Date();
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

  return { booking: mapBooking(cancelledBooking, membership, cancelledAt) };
}

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
  createSpace,
  getSpaceList,
  getSpaceDetail,
  updateSpace,
  updateSpaceStatus,
  deleteSpace,
  getSpaceAvailability,
  getSpaceCalendar,
  createBooking,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
  getAdminBookings
};