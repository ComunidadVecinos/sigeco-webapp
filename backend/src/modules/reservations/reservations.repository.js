// Acceso a datos del módulo reservations: encapsula consultas Prisma de espacios y reservas.
// Flujo cubierto: filtros del servicio -> queries Prisma -> entidades seleccionadas para mapear.
// Expone transacciones, CRUD de espacios, consultas de reservas, cancelaciones y destinatarios de correo.
// Lo consume reservations.service.js.
const prisma = require('../../lib/prisma');

// --- Selects compartidos ---
// Campos que el servicio necesita para mapear espacios sin exponer columnas internas innecesarias.
const spaceSelect = {
  id: true,
  communityId: true,
  name: true,
  description: true,
  colorHex: true,
  isActive: true,
  totalCapacity: true,
  occupancyMode: true,
  maxSeatsPerBooking: true,
  mondayEnabled: true,
  tuesdayEnabled: true,
  wednesdayEnabled: true,
  thursdayEnabled: true,
  fridayEnabled: true,
  saturdayEnabled: true,
  sundayEnabled: true,
  openingTime: true,
  closingTime: true,
  slotMinutes: true,
  maxConsecutiveSlots: true,
  minAdvanceMinutes: true,
  maxAdvanceDays: true,
  cancellationNoticeMinutes: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
};

// Incluye espacio, propietario y cancelador porque las respuestas y correos se construyen en servicio.
const bookingSelect = {
  id: true,
  communityId: true,
  spaceId: true,
  ownerMembershipId: true,
  status: true,
  bookingDate: true,
  startSlotIndex: true,
  slotCount: true,
  startTime: true,
  endTime: true,
  requestedSeats: true,
  cancelledAt: true,
  cancelledByMembershipId: true,
  cancellationReason: true,
  createdAt: true,
  updatedAt: true,
  space: {
    select: {
      id: true,
      name: true,
      colorHex: true,
      isActive: true,
      occupancyMode: true,
      totalCapacity: true,
      maxSeatsPerBooking: true,
      cancellationNoticeMinutes: true,
      deletedAt: true
    }
  },
  ownerMembership: {
    select: {
      id: true,
      alias: true,
      role: true,
      deletedAt: true,
      endReason: true,
      user: { select: { email: true } }
    }
  },
  cancelledByMembership: { select: { id: true, alias: true, role: true, deletedAt: true, endReason: true } }
};

// --- Helpers comunes ---
// Transacción genérica para que el servicio mantenga juntas operaciones de reservas y calendar.
async function withTransaction(callback) {
  return prisma.$transaction(callback);
}

function buildPageArgs(page, pageSize) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

// Paginación consistente: cuenta y trae página dentro de la misma transacción de lectura.
async function findPage(modelName, { where, select, orderBy, page, pageSize }) {
  const model = prisma[modelName];
  const { skip, take } = buildPageArgs(page, pageSize);
  const [total, items] = await prisma.$transaction([model.count({ where }), model.findMany({ where, select, orderBy, skip, take })]);
  return { total, items };
}

// Usa updateMany para respetar filtros de concurrencia y vuelve a leer el registro ya actualizado.
async function updateOneAndFind(db, modelName, { updateWhere, data, findWhere, select }) {
  const updated = await db[modelName].updateMany({ where: updateWhere, data });
  if (updated.count !== 1) {
    return null;
  }
  return db[modelName].findFirst({ where: findWhere, select });
}

// --- Helpers de espacios ---
// Filtros de GET /spaces: comunidad, borrado lógico, estado y búsqueda por texto.
function buildSpaceWhere({ communityId, search, status = 'active' }) {
  const where = { communityId, deletedAt: null };

  if (status === 'active') { where.isActive = true; } 
  else if (status === 'inactive') { where.isActive = false; }

  if (search) {
    where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
  }
  return where;
}

// --- Helpers de reservas ---
// Separa reservas pasadas/futuras usando fecha de negocio y hora local ya calculadas por el servicio.
function buildBookingTimeWhere(scope, nowDate, nowTime) {
  if (scope === 'past') {
    return { OR: [{ bookingDate: { lt: nowDate } }, { bookingDate: nowDate, endTime: { lt: nowTime } }] };
  }
  return { OR: [{ bookingDate: { gt: nowDate } }, { bookingDate: nowDate, endTime: { gte: nowTime } }] };
}

// Orden estable para listados y calendarios de reservas.
function buildBookingOrder(direction = 'asc') {
  return [{ bookingDate: direction }, { startTime: direction }, { endTime: direction }, { createdAt: direction }, { id: direction }];
}

// Filtros comunes para reservas de un espacio: un día exacto o un rango de calendario.
function buildSpaceBookingWhere({ communityId, spaceId, bookingDate, startDate, endDate, status }) {
  const where = { communityId, spaceId, ...(status ? { status } : {}) };
  if (bookingDate) {
    where.bookingDate = bookingDate;
  } 
  else if (startDate || endDate) {
    where.bookingDate = { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lt: endDate } : {}) };
  }
  return where;
}

async function findSpaceBookings(filters) {
  return prisma.reservationBooking.findMany({
    where: buildSpaceBookingWhere(filters),
    select: bookingSelect,
    orderBy: buildBookingOrder('asc')
  });
}

async function findBookingPage({ where, direction = 'asc', page, pageSize }) {
  return findPage('reservationBooking', {
    where,
    select: bookingSelect,
    orderBy: buildBookingOrder(direction),
    page,
    pageSize
  });
}

// Query de GET /bookings/me: scope decide estado, ventana temporal y orden.
function buildMembershipBookingPageQuery({ communityId, ownerMembershipId, spaceId, scope, nowDate, nowTime }) {
  const where = { communityId, ownerMembershipId, ...(spaceId ? { spaceId } : {}) };

  if (scope === 'cancelled') {
    return { where: { ...where, status: 'CANCELLED' }, direction: 'desc' };
  }
  else if (scope === 'upcoming') {
    return {
      where: { ...where, status: 'ACTIVE', AND: [buildBookingTimeWhere('upcoming', nowDate, nowTime)] },
      direction: 'asc'
    };
  }
  else if (scope === 'past') {
    return {
      where: { ...where, status: 'ACTIVE', AND: [buildBookingTimeWhere('past', nowDate, nowTime)] },
      direction: 'desc'
    };
  }
  return { where, direction: 'asc' };
}

// Query de GET /bookings admin: estado, espacio y rango opcional de fechas.
function buildAdminBookingPageQuery({ communityId, spaceId, status, from, to }) {
  return {
    where: {
      communityId,
      ...(spaceId ? { spaceId } : {}),
      ...(status === 'active' ? { status: 'ACTIVE' } : {}),
      ...(status === 'cancelled' ? { status: 'CANCELLED' } : {}),
      ...(from || to ? { bookingDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {})
    },
    direction: status === 'cancelled' ? 'desc' : 'asc'
  };
}

// --- Espacios: GET ---
async function findSpacePage({ communityId, search, status, page, pageSize }) {
  return findPage('reservationSpace', {
    where: buildSpaceWhere({ communityId, search, status }),
    select: spaceSelect,
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    page,
    pageSize
  });
}

async function findSpaceById({ communityId, spaceId }) {
  return prisma.reservationSpace.findFirst({
    where: { id: spaceId, communityId },
    select: spaceSelect
  });
}

// --- Espacios: POST ---
async function createSpace(db, input) {
  return db.reservationSpace.create({
    data: input,
    select: spaceSelect
  });
}

// --- Espacios: PATCH ---
async function updateSpace(db, { communityId, spaceId, data }) {
  return updateOneAndFind(db, 'reservationSpace', {
    updateWhere: { id: spaceId, communityId, deletedAt: null },
    data,
    findWhere: { id: spaceId, communityId },
    select: spaceSelect
  });
}

// --- Espacios: DELETE lógico ---
async function softDeleteSpace(db, { communityId, spaceId, deletedAt }) {
  const updated = await db.reservationSpace.updateMany({
    where: { id: spaceId, communityId, deletedAt: null },
    data: { deletedAt, isActive: false }
  });
  return updated.count === 1;
}

// --- Reservas: GET de consulta ---
async function findFutureActiveBookingsForSpace({ communityId, spaceId, nowDate, nowTime }) {
  return prisma.reservationBooking.findMany({
    where: {
      communityId,
      spaceId,
      status: 'ACTIVE',
      ...buildBookingTimeWhere('upcoming', nowDate, nowTime)
    },
    select: bookingSelect,
    orderBy: buildBookingOrder('asc')
  });
}

async function findSpaceBookingsOnDate({ communityId, spaceId, bookingDate, status = 'ACTIVE' }) {
  return findSpaceBookings({ communityId, spaceId, bookingDate, status });
}

async function findSpaceBookingsInDateRange({ communityId, spaceId, startDate, endDate }) {
  return findSpaceBookings({ communityId, spaceId, startDate, endDate });
}

async function findActiveBookingByMembershipSpaceAndDate({ communityId, ownerMembershipId, spaceId, bookingDate }) {
  return prisma.reservationBooking.findFirst({
    where: {
      communityId,
      ownerMembershipId,
      spaceId,
      bookingDate,
      status: 'ACTIVE'
    },
    select: { id: true }
  });
}

async function findBookingById({ communityId, bookingId }) {
  return prisma.reservationBooking.findFirst({
    where: { id: bookingId, communityId },
    select: bookingSelect
  });
}

async function findBookingPageForMembership({ communityId, ownerMembershipId, spaceId, scope, page, pageSize, nowDate, nowTime }) {
  const query = buildMembershipBookingPageQuery({ communityId, ownerMembershipId, spaceId, scope, nowDate, nowTime });
  return findBookingPage({ ...query, page, pageSize });
}

async function findBookingPageAdmin({ communityId, spaceId, status, from, to, page, pageSize }) {
  const query = buildAdminBookingPageQuery({ communityId, spaceId, status, from, to });
  return findBookingPage({ ...query, page, pageSize });
}

// --- Reservas: POST ---
async function createBooking(db, input) {
  return db.reservationBooking.create({
    data: input,
    select: bookingSelect
  });
}

// --- Reservas: cancelaciones ---
async function cancelBooking(db, { communityId, bookingId, cancelledAt, cancelledByMembershipId, cancellationReason }) {
  return updateOneAndFind(db, 'reservationBooking', {
    updateWhere: { id: bookingId, communityId, status: 'ACTIVE' },
    data: {
      status: 'CANCELLED',
      cancelledAt,
      cancelledByMembershipId: cancelledByMembershipId || null,
      cancellationReason: cancellationReason || null
    },
    findWhere: { id: bookingId, communityId },
    select: bookingSelect
  });
}

async function cancelBookingsByOwnerMembershipIds(db, membershipIds, { cancelledAt, cancellationReason }) {
  if (!membershipIds || membershipIds.length === 0) {
    return [];
  }

  const activeBookings = await db.reservationBooking.findMany({
    where: {
      ownerMembershipId: { in: membershipIds },
      status: 'ACTIVE'
    },
    select: { id: true }
  });

  if (activeBookings.length === 0) {
    return [];
  }

  const bookingIds = activeBookings.map((booking) => booking.id);

  // Cancelación masiva usada al cerrar membresías; no marca un actor concreto.
  await db.reservationBooking.updateMany({
    where: {
      id: { in: bookingIds },
      status: 'ACTIVE'
    },
    data: {
      status: 'CANCELLED',
      cancelledAt,
      cancelledByMembershipId: null,
      cancellationReason: cancellationReason || null
    }
  });
  return bookingIds;
}

async function cancelActiveBookingsBySpaceId(db, { communityId, spaceId, cancelledAt, cancelledByMembershipId, cancellationReason }) {
  const activeBookings = await db.reservationBooking.findMany({
    where: {
      communityId,
      spaceId,
      status: 'ACTIVE'
    },
    select: { id: true }
  });

  if (activeBookings.length === 0) {
    return [];
  }

  const bookingIds = activeBookings.map((booking) => booking.id);

  // Mantiene el filtro ACTIVE para no sobrescribir reservas canceladas entre lectura y escritura.
  await db.reservationBooking.updateMany({
    where: {
      id: { in: bookingIds },
      status: 'ACTIVE'
    },
    data: {
      status: 'CANCELLED',
      cancelledAt,
      cancelledByMembershipId: cancelledByMembershipId || null,
      cancellationReason: cancellationReason || null
    }
  });
  return bookingIds;
}

async function cancelActiveBookingsByIds(db, { communityId, bookingIds, cancelledAt, cancelledByMembershipId, cancellationReason }) {
  if (!bookingIds || bookingIds.length === 0) {
    return [];
  }

  // Se usa tras recalcular impacto de reglas; solo cancela reservas todavía activas de la comunidad.
  await db.reservationBooking.updateMany({
    where: {
      id: { in: bookingIds },
      communityId,
      status: 'ACTIVE'
    },
    data: {
      status: 'CANCELLED',
      cancelledAt,
      cancelledByMembershipId: cancelledByMembershipId || null,
      cancellationReason: cancellationReason || null
    }
  });
  return bookingIds;
}

// --- Reservas: PATCH interno ---
async function updateBookingSlotPositions(db, updates) {
  if (!updates || updates.length === 0) {
    return [];
  }

  // Al cambiar reglas de un espacio, algunas reservas siguen siendo válidas pero cambian de índice de franja.
  await Promise.all(updates.map((update) =>
    db.reservationBooking.updateMany({
      where: {
        id: update.bookingId,
        communityId: update.communityId,
        status: 'ACTIVE'
      },
      data: {
        startSlotIndex: update.startSlotIndex,
        slotCount: update.slotCount
      }
    })
  ));
  return updates.map((update) => update.bookingId);
}

// --- Correos: GET de destinatarios ---
// Destinatarios para avisos comunitarios del módulo; solo miembros vivos con correo disponible.
async function findCommunityReservationMailMembers(communityId) {
  return prisma.membership.findMany({
    where: {
      communityId,
      deletedAt: null,
      endedAt: null
    },
    select: {
      id: true,
      alias: true,
      user: { select: { email: true } },
      community: { select: { id: true, name: true } }
    },
    orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }]
  });
}

module.exports = {
  withTransaction,
  findSpacePage,
  findSpaceById,
  createSpace,
  updateSpace,
  softDeleteSpace,
  findFutureActiveBookingsForSpace,
  findSpaceBookingsOnDate,
  findSpaceBookingsInDateRange,
  findActiveBookingByMembershipSpaceAndDate,
  createBooking,
  findBookingById,
  cancelBooking,
  cancelBookingsByOwnerMembershipIds,
  cancelActiveBookingsBySpaceId,
  cancelActiveBookingsByIds,
  updateBookingSlotPositions,
  findCommunityReservationMailMembers,
  findBookingPageForMembership,
  findBookingPageAdmin
};