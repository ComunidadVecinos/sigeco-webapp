// Acceso a datos del módulo members.
const prisma = require('../../lib/prisma');
const { isMembershipCurrentlySuspended } = require('../../lib/membership');
const calendarRepository = require('../calendar/calendar.repository');

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
    conditions.push({ joinedAt: { ...(filters.joinedAfter ? { gte: filters.joinedAfter } : {}), ...(filters.joinedBefore ? { lte: filters.joinedBefore } : {}) } });
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

async function findActiveCommunityById(communityId) {
  return prisma.community.findFirst({
    where: { id: communityId, deletedAt: null },
    select: {
      id: true,
      name: true,
      cif: true,
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
      community: { select: { id: true, name: true }
      }
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
      property: {
        select: {
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
        }
      }
    }
  });
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

  // Si todas las memberships restantes estan suspendidas, conservamos una referencia activa en lugar de dejar el contexto indeterminado.
  return firstNonSuspendedMembership || memberships[0];
}

async function finalizeMembershipAndResolveActiveContext({ userId, membershipId, communityId, endReason }) {
  // Cerrar una membership puede invalidar el contexto activo de usuario y sesiones; por eso se resuelve en una sola transacción.
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const updateResult = await tx.membership.updateMany({
      where: {
        id: membershipId,
        userId,
        communityId,
        deletedAt: null,
        endedAt: null
      },
      data: { endedAt: now, endReason }
    });

    if (updateResult.count !== 1) {
      return null;
    }

    await calendarRepository.softDeletePersonalEventsByMembershipIds(tx, [membershipId], now);

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        lastActiveMembershipId: true,
        deletedAt: true
      }
    });

    if (!user || user.deletedAt !== null) {
      return null;
    }

    const sessionsWithExpelledMembership = await tx.session.findMany({
      where: {
        userId,
        activeMembershipId: membershipId,
        invalidatedAt: null
      },
      select: { id: true }
    });

    const shouldUpdateSessions = sessionsWithExpelledMembership.length > 0;
    const shouldUpdateUserLastActiveMembership = user.lastActiveMembershipId === membershipId;

    let nextActiveMembershipId = null;

    if (shouldUpdateSessions || shouldUpdateUserLastActiveMembership) {
      const remainingMemberships = await tx.membership.findMany({
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
        orderBy: [ { joinedAt: 'asc' }, { id: 'asc' } ]
      });

      const nextActiveMembership = selectNextActiveMembership(remainingMemberships);
      nextActiveMembershipId = nextActiveMembership?.id || null;

      if (shouldUpdateSessions) {
        await tx.session.updateMany({
          where: { userId, activeMembershipId: membershipId, invalidatedAt: null },
          data: { activeMembershipId: nextActiveMembershipId }
        });
      }

      if (shouldUpdateUserLastActiveMembership) {
        await tx.user.update({
          where: { id: userId },
          data: { lastActiveMembershipId: nextActiveMembershipId }
        });
      }
    }

    return { nextActiveMembershipId };
  });
}

// Este listado se reutiliza desde members y communities
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
      property: {
        select: {
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
        }
      },
      user: { select: { avatar: { select: { storagePath: true } } } }
    },
    orderBy: [ { createdAt: 'desc' }, { id: 'asc' } ],
    skip: options.skip || 0,
    take: options.take
  });

  if (!includeTotal) {
    return { total: null, items: await query };
  }

  const [total, items] = await prisma.$transaction([prisma.membership.count({ where }), query]);

  return { total, items };
}

async function suspendMembership({ memberId, communityId, suspendedUntil, suspensionReason }) {
  return prisma.$transaction(async (tx) => {
    const updateResult = await tx.membership.updateMany({
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

    if (updateResult.count !== 1) {
      return null;
    }

    // Se relee la fila ya persistida para devolver al service el estado efectivo.
    return tx.membership.findFirst({
      where: { id: memberId, communityId },
      select: {
        id: true,
        communityId: true,
        role: true,
        alias: true,
        createdAt: true,
        suspendedAt: true,
        suspendedUntil: true,
        suspensionReason: true,
        endedAt: true,
        deletedAt: true,
        property: {
          select: {
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
          }
        }
      }
    });
  });
}

async function clearMembershipSuspension({ memberId, communityId }) {
  return prisma.$transaction(async (tx) => {
    const updateResult = await tx.membership.updateMany({
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

    if (updateResult.count !== 1) {
      return null;
    }

    // El borrado de suspension es fisico sobre los campos de suspension para que
    // el resto del backend no tenga que reconciliar flags derivados.
    return tx.membership.findFirst({
      where: { id: memberId, communityId },
      select: {
        id: true,
        communityId: true,
        role: true,
        alias: true,
        createdAt: true,
        suspendedAt: true,
        suspendedUntil: true,
        suspensionReason: true,
        endedAt: true,
        deletedAt: true,
        property: {
          select: {
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
          }
        }
      }
    });
  });
}

async function assignUniqueAdministrativeRole({ communityId, actorMembershipId, targetMembershipId, role }) {
  // Aquí se garantiza la unicidad de presidente y vicepresidente.
  return prisma.$transaction(async (tx) => {
    const membershipIds = Array.from(new Set([actorMembershipId, targetMembershipId]));
    const memberships = await tx.membership.findMany({
      where: {
        id: { in: membershipIds },
        communityId,
        deletedAt: null,
        endedAt: null
      },
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
        deletedAt: true
      }
    });

    const actorMembership = memberships.find((membership) => membership.id === actorMembershipId) || null;
    const targetMembership = memberships.find((membership) => membership.id === targetMembershipId) || null;

    if (!actorMembership || !targetMembership) {
      return null;
    }

    if (targetMembershipId === actorMembershipId && actorMembership.role === role) {
      return { actorMembership, targetMembership };
    }

    // La reasignación degrada primero al ocupante anterior del rol para evitar dos titulares simultáneos.
    if (role === 'PRESIDENT') {
      await tx.membership.updateMany({
        where: {
          communityId,
          role: 'PRESIDENT',
          deletedAt: null,
          endedAt: null,
          id: { not: targetMembershipId }
        },
        data: { role: 'MEMBER' }
      });

      if (targetMembership.role !== 'PRESIDENT') {
        await tx.membership.update({
          where: { id: targetMembershipId },
          data: { role: 'PRESIDENT' }
        });
      }
    }

    if (role === 'VICE_PRESIDENT') {
      await tx.membership.updateMany({
        where: {
          communityId,
          role: 'VICE_PRESIDENT',
          deletedAt: null,
          endedAt: null,
          id: { not: targetMembershipId }
        },
        data: { role: 'MEMBER' }
      });

      if (targetMembership.role !== 'VICE_PRESIDENT') {
        await tx.membership.update({
          where: { id: targetMembershipId },
          data: { role: 'VICE_PRESIDENT' }
        });
      }
    }

    const updatedMemberships = await tx.membership.findMany({
      where: {
        id: { in: membershipIds }
      },
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
        deletedAt: true
      }
    });

    return {
      actorMembership: updatedMemberships.find((membership) => membership.id === actorMembershipId) || null,
      targetMembership: updatedMemberships.find((membership) => membership.id === targetMembershipId) || null
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
  assignUniqueAdministrativeRole
};
