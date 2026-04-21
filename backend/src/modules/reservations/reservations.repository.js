const prisma = require('../../lib/prisma');

/**
 * Capa de acceso a datos del modulo reservations.
 */

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
  ownerMembership: { select: { id: true, alias: true, role: true } },
  cancelledByMembership: { select: { id: true, alias: true, role: true } }
};

// --- Common ---
function buildSpaceWhere({ communityId, search, status = 'active' }) {
  const where = { communityId, deletedAt: null };

  if (status === 'active') {
    where.isActive = true;
  }
  else if (status === 'inactive') {
    where.isActive = false;
  }

  if (search) {
    where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
  }
  return where;
}

function buildBookingTimeWhere(scope, nowDate, nowTime) {
  if (scope === 'past') {
    return { OR: [{ bookingDate: { lt: nowDate } }, { bookingDate: nowDate, endTime: { lt: nowTime } }] };
  }
  return { OR: [{ bookingDate: { gt: nowDate } }, { bookingDate: nowDate, endTime: { gte: nowTime } }] };
}

function buildBookingOrder(direction = 'asc') {
  return [
    { bookingDate: direction },
    { startTime: direction },
    { endTime: direction },
    { createdAt: direction },
    { id: direction }
  ];
}

function buildPageArgs(page, pageSize) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

async function findPage(modelName, { where, select, orderBy, page, pageSize }) {
  const model = prisma[modelName];
  const { skip, take } = buildPageArgs(page, pageSize);

  const [total, items] = await prisma.$transaction([
    model.count({ where }),
    model.findMany({ where, select, orderBy, skip, take })
  ]);
  return { total, items };
}

async function updateOneAndFind(db, modelName, { updateWhere, data, findWhere, select }) {
  const updated = await db[modelName].updateMany({ where: updateWhere, data });

  if (updated.count !== 1) {
    return null;
  }
  return db[modelName].findFirst({ where: findWhere, select });
}

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

async function withTransaction(callback) {
  return prisma.$transaction(callback);
}

// --- Spaces ---
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

async function createSpace(db, input) {
  return db.reservationSpace.create({
    data: input,
    select: spaceSelect
  });
}

async function updateSpace(db, { communityId, spaceId, data }) {
  return updateOneAndFind(db, 'reservationSpace', {
    updateWhere: { id: spaceId, communityId, deletedAt: null },
    data,
    findWhere: { id: spaceId, communityId },
    select: spaceSelect
  });
}

async function softDeleteSpace(db, { communityId, spaceId, deletedAt }) {
  const updated = await db.reservationSpace.updateMany({
    where: { id: spaceId, communityId, deletedAt: null },
    data: { deletedAt, isActive: false }
  });
  return updated.count === 1;
}

// --- Bookings ---
async function findFutureActiveBookingsForSpace({ communityId, spaceId, nowDate, nowTime }) {
  return prisma.reservationBooking.findMany({
    where: {
      communityId,
      spaceId,
      status: 'ACTIVE',
      ...buildBookingTimeWhere('upcoming', nowDate, nowTime)
    },
    select: { id: true },
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

async function createBooking(db, input) {
  return db.reservationBooking.create({
    data: input,
    select: bookingSelect
  });
}

async function findBookingById({ communityId, bookingId }) {
  return prisma.reservationBooking.findFirst({
    where: { id: bookingId, communityId },
    select: bookingSelect
  });
}

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

  await db.reservationBooking.updateMany({
    where: {
      id: { in: activeBookings.map((booking) => booking.id) },
      status: 'ACTIVE'
    },
    data: {
      status: 'CANCELLED',
      cancelledAt,
      cancelledByMembershipId: null,
      cancellationReason: cancellationReason || null
    }
  });
  return activeBookings.map((booking) => booking.id);
}

async function findBookingPageForMembership({ communityId, ownerMembershipId, spaceId, scope, page, pageSize, nowDate, nowTime }) {
  const query = buildMembershipBookingPageQuery({
    communityId,
    ownerMembershipId,
    spaceId,
    scope,
    nowDate,
    nowTime
  });
  return findBookingPage({ ...query, page, pageSize });
}

async function findBookingPageAdmin({ communityId, spaceId, status, from, to, page, pageSize }) {
  const query = buildAdminBookingPageQuery({ communityId, spaceId, status, from, to });
  return findBookingPage({ ...query, page, pageSize });
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
  findBookingPageForMembership,
  findBookingPageAdmin
};