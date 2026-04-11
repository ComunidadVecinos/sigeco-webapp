// Acceso a datos del módulo requests.

const prisma = require('../../lib/prisma');

async function findCommunityByAccessCode(accessCode) {
  return prisma.community.findFirst({
    where: { accessCode, deletedAt: null },
    select: { id: true, name: true, accessCode: true }
  });
}

async function findActiveMembershipByUserAndCommunity(userId, communityId) {
  // Membresía vigente incluye usuarios suspendidos.
  return prisma.membership.findFirst({
    where: { userId, communityId, deletedAt: null, endedAt: null },
    select: { id: true }
  });
}

async function findPendingRequestByUserAndCommunity(userId, communityId) {
  // Solo se permite una petición pendiente por usuario y comunidad.
  return prisma.communityRequest.findFirst({
    where: { userId, communityId, status: 'PENDING', archivedAt: null },
    select: {  id: true, type: true, status: true }
  });
}

async function findRequestsByUserId(userId) {
  return prisma.communityRequest.findMany({
    where: { userId, archivedAt: null },
    select: {
      id: true,
      type: true,
      status: true,
      requestComment: true,
      createdAt: true,
      resolvedAt: true,
      community: { select: { id: true, name: true } },
      details: {
        select: {
          proposedAlias: true,
          country: true,
          province: true,
          municipality: true,
          streetType: true,
          streetName: true,
          postalCode: true,
          streetNumberKm: true,
          block: true,
          floor: true,
          door: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function findPendingRequestsByCommunity({ communityId, type, page, pageSize }) {
  const where = { communityId, status: 'PENDING', archivedAt: null };

  if (type) {  where.type = type; }

  const skip = (page - 1) * pageSize;

  // El listado de administración solo trabaja sobre pendientes visibles,
  const [total, items] = await prisma.$transaction([
    prisma.communityRequest.count({ where }),
    prisma.communityRequest.findMany({
      where,
      select: {
        id: true,
        type: true,
        status: true,
        requestComment: true,
        createdAt: true,
        community: {
          select: { id: true, name: true }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        details: {
          select: {
            proposedAlias: true,
            country: true,
            province: true,
            municipality: true,
            streetType: true,
            streetName: true,
            postalCode: true,
            streetNumberKm: true,
            block: true,
            floor: true,
            door: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    })
  ]);

  return { total, items };
}

async function findRequestById(requestId) {
  return prisma.communityRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      userId: true,
      type: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      cancelledAt: true,
      archivedAt: true
    }
  });
}

async function findRequestForReviewById(requestId) {
  return prisma.communityRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      userId: true,
      communityId: true,
      type: true,
      status: true,
      archivedAt: true,
      createdAt: true,
      resolvedAt: true,
      cancelledAt: true,
      community: {
        select: { id: true, name: true }
      },
      details: {
        select: {
          proposedAlias: true,
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
          door: true
        }
      }
    }
  });
}

// Las transiciones simples (cancelar, archivar) actualizan solo la solicitud.
async function updateRequestState(requestId, data) {
  return prisma.communityRequest.update({
    where: { id: requestId },
    data,
    select: {
      id: true,
      type: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      cancelledAt: true,
      archivedAt: true
    }
  });
}

// La aprobación materializa efectos reales: 
//   - JOIN crea membership/property;
//   - UPDATE_INFO actualiza la membership existente y su vivienda asociada.
async function approveRequest({ requestId, resolvedByMembershipId, resolutionMessage }) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.communityRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        userId: true,
        communityId: true,
        type: true,
        status: true,
        archivedAt: true,
        details: {
          select: {
            proposedAlias: true,
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
            door: true
          }
        }
      }
    });

    if (!request || request.status !== 'PENDING' || request.archivedAt) {
      return null;
    }

    if (!request.details) {
      throw new Error('REQUEST_APPROVAL_DETAILS_NOT_FOUND');
    }

    if (request.type === 'JOIN') {
      const activeMembership = await tx.membership.findFirst({
        where: { userId: request.userId, communityId: request.communityId, deletedAt: null, endedAt: null },
        select: { id: true }
      });

      if (activeMembership) {
        throw new Error('REQUEST_APPROVAL_JOIN_MEMBERSHIP_ALREADY_EXISTS');
      }

      const reusableMembership = await tx.membership.findFirst({
        where: {
          userId: request.userId,
          communityId: request.communityId,
          deletedAt: null,
          endedAt: { not: null }
        },
        select: { id: true }
      });

      const membershipData = {
        role: 'MEMBER',
        alias: request.details.proposedAlias || request.details.label || 'Miembro',
        joinedAt: new Date(),
        endedAt: null,
        endReason: null,
        suspendedAt: null,
        suspendedUntil: null,
        suspensionReason: null
      };

      let membershipId;

      // Si existía una membership cerrada para la misma comunidad, se reabre
      if (reusableMembership) {
        const membership = await tx.membership.update({
          where: { id: reusableMembership.id },
          data: membershipData,
          select: { id: true }
        });
        membershipId = membership.id;
      } 
      else {
        const membership = await tx.membership.create({
          data: { userId: request.userId, communityId: request.communityId, ...membershipData },
          select: { id: true }
        });
        membershipId = membership.id;
      }

      const propertyData = {
        label: request.details.label || `Vivienda de ${request.details.proposedAlias || 'miembro'}`,
        country: request.details.country,
        province: request.details.province,
        municipality: request.details.municipality,
        streetType: request.details.streetType,
        streetName: request.details.streetName,
        postalCode: request.details.postalCode,
        streetNumberKm: request.details.streetNumberKm,
        block: request.details.block || null,
        floor: request.details.floor || null,
        door: request.details.door || null,
        deletedAt: null
      };
      const property = await tx.property.findUnique({
        where: { membershipId },
        select: { id: true }
      });

      if (property) {
        await tx.property.update({
          where: { id: property.id },
          data: propertyData
        });
      } 
      else {
        await tx.property.create({
          data: { membershipId, ...propertyData }
        });
      }

      const user = await tx.user.findUnique({
        where: { id: request.userId },
        select: {
          id: true,
          lastActiveMembershipId: true,
          deletedAt: true
        }
      });

      if (!user || user.deletedAt !== null) {
        throw new Error('REQUEST_APPROVAL_JOIN_USER_NOT_FOUND');
      }

      // Solo se promueve el nuevo contexto si el usuario no tenía ya uno activo.
      if (!user.lastActiveMembershipId) {
        await tx.user.update({
          where: { id: request.userId },
          data: { lastActiveMembershipId: membershipId }
        });
      }

      await tx.session.updateMany({
        where: {
          userId: request.userId,
          invalidatedAt: null,
          expiresAt: { gt: new Date() },
          activeMembershipId: null
        },
        data: { activeMembershipId: membershipId }
      });
    }

    if (request.type === 'UPDATE_INFO') {
      // UPDATE_INFO modifica los datos visibles de la membership vigente y de su vivienda asociada.
      const membership = await tx.membership.findFirst({
        where: {
          userId: request.userId,
          communityId: request.communityId,
          deletedAt: null,
          endedAt: null
        },
        select: { id: true }
      });

      if (!membership) {
        throw new Error('REQUEST_APPROVAL_UPDATE_INFO_MEMBERSHIP_NOT_FOUND');
      }

      await tx.membership.update({
        where: { id: membership.id },
        data: { alias: request.details.proposedAlias || 'Miembro' }
      });

      const property = await tx.property.findUnique({
        where: { membershipId: membership.id },
        select: { id: true }
      });

      const propertyData = {
        label: request.details.label || `Vivienda de ${request.details.proposedAlias || 'miembro'}`,
        country: request.details.country,
        province: request.details.province,
        municipality: request.details.municipality,
        streetType: request.details.streetType,
        streetName: request.details.streetName,
        postalCode: request.details.postalCode,
        streetNumberKm: request.details.streetNumberKm,
        block: request.details.block || null,
        floor: request.details.floor || null,
        door: request.details.door || null,
        deletedAt: null
      };

      if (property) {
        await tx.property.update({
          where: { id: property.id },
          data: propertyData
        });
      } 
      else {
        await tx.property.create({
          data: { membershipId: membership.id, ...propertyData }
        });
      }
    }

    return tx.communityRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        resolvedAt: new Date(),
        resolutionMessage: resolutionMessage || null,
        resolvedByMembershipId
      },
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        cancelledAt: true,
        archivedAt: true
      }
    });
  });
}

// El rechazo solo resuelve la solicitud; no toca memberships ni propiedades.
async function rejectRequest({ requestId, resolvedByMembershipId, resolutionMessage }) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.communityRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
        archivedAt: true
      }
    });

    if (!request || request.status !== 'PENDING' || request.archivedAt) {
      return null;
    }

    return tx.communityRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        resolvedAt: new Date(),
        resolutionMessage: resolutionMessage || null,
        resolvedByMembershipId
      },
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        cancelledAt: true,
        archivedAt: true
      }
    });
  });
}

// Request y details se crean juntos.
async function createRequestWithDetails(data) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.communityRequest.create({
      data: {
        communityId: data.communityId,
        userId: data.userId,
        type: data.type,
        status: 'PENDING',
        requestComment: data.requestComment || null
      },
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true
      }
    });

    const details = await tx.communityRequestDetails.create({
      data: {
        communityRequestId: request.id,
        proposedAlias: data.proposedAlias,
        label: data.label,
        country: data.country,
        province: data.province,
        municipality: data.municipality,
        streetType: data.streetType,
        streetName: data.streetName,
        postalCode: data.postalCode,
        streetNumberKm: data.streetNumberKm,
        block: data.block || null,
        floor: data.floor || null,
        door: data.door || null
      },
      select: {
        id: true,
        proposedAlias: true,
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
        door: true
      }
    });

    return { request, details };
  });
}

async function cancelPendingRequestsByUserAndCommunity(db, { userId, communityId, cancelledAt = new Date() }) {
  return db.communityRequest.updateMany({
    where: {
      userId,
      communityId,
      status: 'PENDING',
      archivedAt: null
    },
    data: {
      status: 'CANCELLED',
      cancelledAt
    }
  });
}

async function archiveRequestsByUserId(db, { userId, archivedAt = new Date() }) {
  // Las pendientes se cancelan antes de archivar para no dejar solicitudes "abiertas" de una cuenta inexistente.
  await db.communityRequest.updateMany({
    where: {
      userId,
      status: 'PENDING',
      archivedAt: null
    },
    data: {
      status: 'CANCELLED',
      cancelledAt: archivedAt
    }
  });

  // Al eliminar la cuenta desaparece la superficie de gestión del usuario; se archivan todas sus solicitudes visibles.
  return db.communityRequest.updateMany({
    where: {
      userId,
      archivedAt: null
    },
    data: {
      archivedAt
    }
  });
}

module.exports = {
  findCommunityByAccessCode,
  findActiveMembershipByUserAndCommunity,
  findPendingRequestByUserAndCommunity,
  findRequestsByUserId,
  findPendingRequestsByCommunity,
  findRequestById,
  findRequestForReviewById,
  updateRequestState,
  approveRequest,
  rejectRequest,
  createRequestWithDetails,
  cancelPendingRequestsByUserAndCommunity,
  archiveRequestsByUserId
};
