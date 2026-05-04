// Repositorio de members: maneja memberships, roles, suspensiones y su impacto en otros recursos.
// Flujo cubierto: servicio -> queries/transacciones Prisma -> entidades listas para validar o mapear.
// Expone búsquedas de comunidad/miembro, listados y operaciones que afectan también a sesiones, reservas, calendario y solicitudes.
// Lo consumen members.service.js y varios servicios comunitarios de forma indirecta.
const prisma = require('../../lib/prisma');
const { isMembershipCurrentlySuspended } = require('../../lib/membership');
const calendarRepository = require('../calendar/calendar.repository');
const requestsRepository = require('../requests/requests.repository');
const reservationsRepository = require('../reservations/reservations.repository');

const propertySelect = {
  id: true,
  label: true,
  country: true,
  province: true,
  municipality: true,
  streetType: true,
  streetName: true,
  postalCode: true,
  streetNumberKm: true,
  block: true,
  floor: true,
  door: true,
  deletedAt: true
};

const roleMembershipSelect = {
  id: true,
  userId: true,
  communityId: true,
  role: true,
  alias: true,
  createdAt: true,
  suspendedAt: true,
  suspendedUntil: true,
  suspensionReason: true,
  endedAt: true,
  deletedAt: true,
  user: { select: { email: true } },
  community: { select: { id: true, name: true } }
};

const membershipWithPropertySelect = {
  ...roleMembershipSelect,
  property: { select: propertySelect }
};

// --- Helpers comunes ---
function buildInactiveMembershipWhere(now) {
  return { suspendedUntil: { gt: now } };
}

function buildActiveMembershipWhere(now) {
  return { OR: [{ suspendedUntil: null }, { suspendedUntil: { lte: now } }] };
}

function buildPropertySearchConditions(query) {
  const stringFields = [
    'label',
    'country',
    'province',
    'municipality',
    'streetType',
    'streetName',
    'postalCode',
    'streetNumberKm',
    'block',
    'floor',
    'door'
  ];

  return stringFields.map((field) => ({ [field]: { contains: query, mode: 'insensitive' } }));
}

function buildCommunityMembersWhere(filters, now = new Date()) {
  const conditions = [];

  if (filters.q) {
    conditions.push({
      OR: [
        { alias: { contains: filters.q, mode: 'insensitive' } },
        { property: { is: { deletedAt: null, OR: buildPropertySearchConditions(filters.q) } } }
      ]
    });
  }

  if (filters.joinedAfter || filters.joinedBefore) {
    conditions.push({
      joinedAt: {
        ...(filters.joinedAfter ? { gte: filters.joinedAfter } : {}),
        ...(filters.joinedBefore ? { lte: filters.joinedBefore } : {})
      }
    });
  }

  if (filters.suspensionStatus === 'ACTIVE') {
    conditions.push(buildActiveMembershipWhere(now));
  }
  if (filters.suspensionStatus === 'INACTIVE') {
    conditions.push(buildInactiveMembershipWhere(now));
  }

  return {
    communityId: filters.communityId,
    deletedAt: null,
    endedAt: null,
    ...(conditions.length > 0 ? { AND: conditions } : {})
  };
}

function selectNextActiveMembership(memberships, preferredMembershipId = null) {
  if (!memberships || memberships.length === 0) {
    return null;
  }
  if (preferredMembershipId) {
    const preferredMembership = memberships.find((membership) => membership.id === preferredMembershipId);
    if (preferredMembership) {
      return preferredMembership;
    }
  }
  const firstNonSuspendedMembership = memberships.find((membership) => !isMembershipCurrentlySuspended(membership));
  // Si todas las memberships restantes están suspendidas, conservamos una referencia válida en vez de dejar el contexto indeterminado.
  return firstNonSuspendedMembership || memberships[0];
}

// --- Comunidad y memberships: búsquedas base ---
async function findActiveCommunityById(communityId) {
  return prisma.community.findFirst({
    where: { id: communityId, deletedAt: null },
    select: {
      id: true,
      name: true,
      cif: true,
      storageQuotaBytes: true,
      storageUsedBytes: true,
      country: true,
      province: true,
      municipality: true,
      streetType: true,
      streetName: true,
      postalCode: true,
      streetNumberKm: true,
      accessCode: true,
      createdAt: true,
      avatar: { select: { storagePath: true } }
    }
  });
}

async function findMembershipByUserAndCommunity(userId, communityId) {
  return prisma.membership.findFirst({
    where: { userId, communityId },
    select: {
      id: true,
      userId: true,
      communityId: true,
      role: true,
      alias: true,
      suspendedAt: true,
      suspendedUntil: true,
      suspensionReason: true,
      endedAt: true,
      deletedAt: true,
      user: { select: { email: true } },
      community: { select: { id: true, name: true } }
    }
  });
}

async function findMembershipByIdAndCommunity(memberId, communityId) {
  return prisma.membership.findFirst({
    where: { id: memberId, communityId },
    select: {
      id: true,
      userId: true,
      communityId: true,
      role: true,
      alias: true,
      createdAt: true,
      suspendedAt: true,
      suspendedUntil: true,
      suspensionReason: true,
      endedAt: true,
      deletedAt: true,
      user: { select: { email: true } },
      community: { select: { id: true, name: true } },
      property: { select: propertySelect }
    }
  });
}

// --- Miembros: listados ---
// Este listado se reutiliza desde members y communities.
async function findCommunityMembers(filters, options = {}) {
  const includeTotal = options.includeTotal !== false;
  const where = buildCommunityMembersWhere(filters);
  const query = prisma.membership.findMany({
    where,
    select: {
      id: true,
      alias: true,
      role: true,
      createdAt: true,
      endedAt: true,
      suspendedAt: true,
      suspendedUntil: true,
      suspensionReason: true,
      property: { select: propertySelect },
      user: { select: { avatar: { select: { storagePath: true } } } }
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    skip: options.skip || 0,
    take: options.take
  });
  if (!includeTotal) {
    return { total: null, items: await query };
  }
  const [total, items] = await prisma.$transaction([
    prisma.membership.count({ where }),
    query
  ]);
  return { total, items };
}

// --- Miembros: cierre de pertenencia y resincronización de contexto ---
async function finalizeMembershipAndResolveActiveContext({ userId, membershipId, communityId, endReason }) {
  // Cerrar una membership puede afectar a reservas, calendario, solicitudes y sesión activa; por eso se resuelve en una sola transacción.
  return prisma.$transaction(async (db) => {
    const now = new Date();
    const updated = await db.membership.updateMany({
      where: {
        id: membershipId,
        userId,
        communityId,
        deletedAt: null,
        endedAt: null
      },
      data: { endedAt: now, endReason }
    });
    if (updated.count !== 1) {
      return null;
    }
    await calendarRepository.softDeletePersonalEventsByMembershipIds(db, [membershipId], now);
    const cancelledBookingIds = await reservationsRepository.cancelBookingsByOwnerMembershipIds(db, [membershipId], {
      cancelledAt: now,
      cancellationReason: endReason
    });

    await calendarRepository.softDeleteReservationEventsBySourceEntityIds(db, cancelledBookingIds, now);
    
    // Al dejar de pertenecer a la comunidad, las solicitudes pendientes de esa misma comunidad se cancelan.
    await requestsRepository.cancelPendingRequestsByUserAndCommunity(db, {
      userId,
      communityId,
      cancelledAt: now
    });

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, lastActiveMembershipId: true, deletedAt: true }
    });

    if (!user || user.deletedAt !== null) {
      return null;
    }

    const sessionsWithClosedMembership = await db.session.findMany({
      where: { userId, activeMembershipId: membershipId, invalidatedAt: null },
      select: { id: true }
    });

    const shouldUpdateSessions = sessionsWithClosedMembership.length > 0;
    const shouldUpdateUserLastActiveMembership = user.lastActiveMembershipId === membershipId;
    let nextActiveMembershipId = null;

    if (shouldUpdateSessions || shouldUpdateUserLastActiveMembership) {
      const remainingMemberships = await db.membership.findMany({
        where: {
          userId,
          deletedAt: null,
          endedAt: null,
          community: { deletedAt: null }
        },
        select: {
          id: true,
          communityId: true,
          role: true,
          alias: true,
          suspendedAt: true,
          suspendedUntil: true,
          suspensionReason: true,
          community: { select: { id: true, name: true } }
        },
        orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }]
      });

      const nextActiveMembership = selectNextActiveMembership(remainingMemberships);
      nextActiveMembershipId = nextActiveMembership?.id || null;

      if (shouldUpdateSessions) {
        await db.session.updateMany({
          where: { userId, activeMembershipId: membershipId, invalidatedAt: null },
          data: { activeMembershipId: nextActiveMembershipId }
        });
      }

      if (shouldUpdateUserLastActiveMembership) {
        await db.user.update({
          where: { id: userId },
          data: { lastActiveMembershipId: nextActiveMembershipId }
        });
      }
    }

    return { nextActiveMembershipId };
  });
}

// --- Miembros: suspensiones ---
async function suspendMembership({ memberId, communityId, suspendedUntil, suspensionReason }) {
  return prisma.$transaction(async (db) => {
    const updated = await db.membership.updateMany({
      where: {
        id: memberId,
        communityId,
        deletedAt: null,
        endedAt: null
      },
      data: {
        suspendedAt: new Date(),
        suspendedUntil,
        suspensionReason: suspensionReason || null
      }
    });

    if (updated.count !== 1) {
      return null;
    }

    // Se relee la fila ya persistida para devolver al servicio el estado efectivo de suspensión.
    return db.membership.findFirst({
      where: { id: memberId, communityId },
      select: membershipWithPropertySelect
    });
  });
}

async function clearMembershipSuspension({ memberId, communityId }) {
  return prisma.$transaction(async (db) => {
    const updated = await db.membership.updateMany({
      where: {
        id: memberId,
        communityId,
        deletedAt: null,
        endedAt: null
      },
      data: {
        suspendedAt: null,
        suspendedUntil: null,
        suspensionReason: null
      }
    });

    if (updated.count !== 1) {
      return null;
    }

    // La suspensión se limpia físicamente en la fila para que el resto del backend no tenga que reconciliar flags derivados.
    return db.membership.findFirst({
      where: { id: memberId, communityId },
      select: membershipWithPropertySelect
    });
  });
}

// --- Miembros: roles administrativos ---
async function updateAdministrativeRole({ communityId, actorMembershipId, targetMembershipId, role }) {
  // Aquí se garantiza la unicidad de presidente y vicepresidente dentro de la comunidad.
  return prisma.$transaction(async (db) => {
    const membershipIds = Array.from(new Set([actorMembershipId, targetMembershipId]));
    const memberships = await db.membership.findMany({
      where: {
        id: { in: membershipIds },
        communityId,
        deletedAt: null,
        endedAt: null
      },
      select: roleMembershipSelect
    });

    const actorMembership = memberships.find((membership) => membership.id === actorMembershipId) || null;
    const targetMembership = memberships.find((membership) => membership.id === targetMembershipId) || null;

    if (!actorMembership || !targetMembership) {
      return null;
    }
    if (targetMembershipId === actorMembershipId && actorMembership.role === role) {
      return { actorMembership, targetMembership, downgradedMemberships: [] };
    }

    let previousRoleHolders = [];
    if (role === 'PRESIDENT' || role === 'VICE_PRESIDENT') {
      previousRoleHolders = await db.membership.findMany({
        where: {
          communityId,
          role,
          deletedAt: null,
          endedAt: null,
          id: { not: targetMembershipId }
        },
        select: roleMembershipSelect
      });
    }

    // La reasignación degrada primero al ocupante anterior para evitar dos titulares simultáneos.
    if (role === 'MEMBER') {
      await db.membership.update({
        where: { id: targetMembershipId },
        data: { role: 'MEMBER' }
      });
    }
    if (role === 'PRESIDENT' || role === 'VICE_PRESIDENT') {
      await db.membership.updateMany({
        where: {
          communityId,
          role,
          deletedAt: null,
          endedAt: null,
          id: { not: targetMembershipId }
        },
        data: { role: 'MEMBER' }
      });
      if (targetMembership.role !== role) {
        await db.membership.update({
          where: { id: targetMembershipId },
          data: { role }
        });
      }
    }

    const updatedMemberships = await db.membership.findMany({
      where: { id: { in: membershipIds } },
      select: roleMembershipSelect
    });

    return {
      actorMembership: updatedMemberships.find((membership) => membership.id === actorMembershipId) || null,
      targetMembership: updatedMemberships.find((membership) => membership.id === targetMembershipId) || null,
      downgradedMemberships: previousRoleHolders.map((previousRoleHolder) => {
        const updatedMembership = updatedMemberships.find((membership) => membership.id === previousRoleHolder.id);
        return updatedMembership || { ...previousRoleHolder, role: 'MEMBER' };
      })
    };
  });
}

module.exports = {
  findActiveCommunityById,
  findMembershipByUserAndCommunity,
  findMembershipByIdAndCommunity,
  findCommunityMembers,
  finalizeMembershipAndResolveActiveContext,
  suspendMembership,
  clearMembershipSuspension,
  updateAdministrativeRole
};