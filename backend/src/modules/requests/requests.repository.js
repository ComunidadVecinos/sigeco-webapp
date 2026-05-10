// Repositorio de requests: centraliza solicitudes, revisión y efectos laterales persistidos.
// Flujo cubierto: servicio -> queries/transacciones Prisma -> entidades listas para validar, mapear o resolver.
// Expone lecturas de solicitudes, creación, resolución y utilidades de limpieza usadas también por otros módulos.
// Lo consumen requests.service.js y algunos repositorios vecinos como users/members.
const prisma = require('../../lib/prisma');

const managedRequestSelect = {
  id: true,
  type: true,
  status: true,
  createdAt: true,
  resolvedAt: true,
  cancelledAt: true,
  archivedAt: true
};

const requestDetailsSelect = {
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
};

const requestDetailsWithLabelSelect = {
  ...requestDetailsSelect,
  label: true
};

function buildRequestPropertyData(details) {
  return {
    label: details.label || `Vivienda de ${details.proposedAlias || 'miembro'}`,
    country: details.country,
    province: details.province,
    municipality: details.municipality,
    streetType: details.streetType,
    streetName: details.streetName,
    postalCode: details.postalCode,
    streetNumberKm: details.streetNumberKm,
    block: details.block || null,
    floor: details.floor || null,
    door: details.door || null,
    deletedAt: null
  };
}

// --- Comunidad y contexto base ---
async function findCommunityByAccessCode(accessCode) {
  return prisma.community.findFirst({
    where: { accessCode, deletedAt: null },
    select: { id: true, name: true, accessCode: true }
  });
}

async function findActiveMembershipByUserAndCommunity(userId, communityId) {
  // Pertenecer a la comunidad cuenta aunque la membership esté suspendida temporalmente.
  return prisma.membership.findFirst({
    where: { userId, communityId, deletedAt: null, endedAt: null },
    select: { id: true }
  });
}

async function findUpdateInfoContext(userId, communityId) {
  return prisma.membership.findFirst({
    where: { userId, communityId, deletedAt: null, endedAt: null },
    select: {
      id: true,
      alias: true,
      property: {
        select: {
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

async function findPendingRequestByUserAndCommunity(userId, communityId) {
  // Solo se permite una solicitud pendiente visible por usuario y comunidad.
  return prisma.communityRequest.findFirst({
    where: { userId, communityId, status: 'PENDING', archivedAt: null },
    select: { id: true, type: true, status: true }
  });
}

async function findCommunityNotificationLeaders(communityId) {
  return prisma.membership.findMany({
    where: {
      communityId,
      role: { in: ['PRESIDENT', 'VICE_PRESIDENT'] },
      deletedAt: null,
      endedAt: null,
      OR: [{ suspendedUntil: null }, { suspendedUntil: { lte: new Date() } }]
    },
    select: {
      id: true,
      alias: true,
      role: true,
      user: { select: { email: true } }
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  });
}

// --- Solicitudes: listados y lectura ---
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
      details: { select: requestDetailsSelect }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function findPendingRequestsByCommunity({ communityId, type, page, pageSize }) {
  const where = { communityId, status: 'PENDING', archivedAt: null };
  if (type) {
    where.type = type;
  }

  const skip = (page - 1) * pageSize;

  // La bandeja administrativa solo trabaja sobre solicitudes pendientes y todavía visibles.
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
        community: { select: { id: true, name: true } },
        user: { select: { firstName: true, lastName: true } },
        details: { select: requestDetailsSelect }
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
      community: { select: { id: true, name: true } },
      user: { select: { email: true, firstName: true, lastName: true } },
      details: { select: requestDetailsWithLabelSelect }
    }
  });
}

// --- Solicitudes: cambios simples de estado ---
// Cancelar y archivar solo cambian la propia solicitud; no tocan memberships ni propiedades.
async function updateRequestState(requestId, data) {
  return prisma.communityRequest.update({
    where: { id: requestId },
    data,
    select: managedRequestSelect
  });
}

// --- Solicitudes: aprobación y rechazo ---
// JOIN crea o reabre membership/property; UPDATE_INFO actualiza la información visible del miembro.
async function approveRequest({ requestId, resolvedByMembershipId, resolutionMessage }) {
  return prisma.$transaction(async (db) => {
    const request = await db.communityRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        userId: true,
        communityId: true,
        type: true,
        status: true,
        archivedAt: true,
        details: { select: requestDetailsWithLabelSelect }
      }
    });

    if (!request || request.status !== 'PENDING' || request.archivedAt) {
      return null;
    }
    if (!request.details) {
      throw new Error('REQUEST_APPROVAL_DETAILS_NOT_FOUND');
    }

    if (request.type === 'JOIN') {
      const activeMembership = await db.membership.findFirst({
        where: { userId: request.userId, communityId: request.communityId, deletedAt: null, endedAt: null },
        select: { id: true }
      });
      if (activeMembership) {
        throw new Error('REQUEST_APPROVAL_JOIN_MEMBERSHIP_ALREADY_EXISTS');
      }

      const reusableMembership = await db.membership.findFirst({
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

      // Si ya hubo una membership cerrada en esa comunidad, se reaprovecha para mantener historial.
      if (reusableMembership) {
        const reopenedMembership = await db.membership.update({
          where: { id: reusableMembership.id },
          data: membershipData,
          select: { id: true }
        });
        membershipId = reopenedMembership.id;
      }
      else {
        const createdMembership = await db.membership.create({
          data: { userId: request.userId, communityId: request.communityId, ...membershipData },
          select: { id: true }
        });
        membershipId = createdMembership.id;
      }

      const existingProperty = await db.property.findUnique({
        where: { membershipId },
        select: { id: true }
      });

      const propertyData = buildRequestPropertyData(request.details);

      if (existingProperty) {
        await db.property.update({
          where: { id: existingProperty.id },
          data: propertyData
        });
      }
      else {
        await db.property.create({ data: { membershipId, ...propertyData } });
      }

      const user = await db.user.findUnique({
        where: { id: request.userId },
        select: { id: true, lastActiveMembershipId: true, deletedAt: true }
      });

      if (!user || user.deletedAt !== null) {
        throw new Error('REQUEST_APPROVAL_JOIN_USER_NOT_FOUND');
      }

      // Solo promovemos la nueva membership si el usuario aún no tenía ningún contexto activo.
      if (!user.lastActiveMembershipId) {
        await db.user.update({
          where: { id: request.userId },
          data: { lastActiveMembershipId: membershipId }
        });
      }

      await db.session.updateMany({
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
      // UPDATE_INFO aplica los nuevos datos sobre la membership abierta y su vivienda actual.
      const membership = await db.membership.findFirst({
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

      await db.membership.update({
        where: { id: membership.id },
        data: { alias: request.details.proposedAlias || 'Miembro' }
      });

      const existingProperty = await db.property.findUnique({
        where: { membershipId: membership.id },
        select: { id: true }
      });

      const propertyData = buildRequestPropertyData(request.details);

      if (existingProperty) {
        await db.property.update({
          where: { id: existingProperty.id },
          data: propertyData
        });
      }
      else {
        await db.property.create({ data: { membershipId: membership.id, ...propertyData } });
      }
    }

    return db.communityRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        resolvedAt: new Date(),
        resolutionMessage: resolutionMessage || null,
        resolvedByMembershipId
      },
      select: managedRequestSelect
    });
  });
}

// El rechazo solo resuelve la solicitud; no altera la pertenencia ni la vivienda del usuario.
async function rejectRequest({ requestId, resolvedByMembershipId, resolutionMessage }) {
  return prisma.$transaction(async (db) => {
    const request = await db.communityRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, archivedAt: true }
    });

    if (!request || request.status !== 'PENDING' || request.archivedAt) {
      return null;
    }

    return db.communityRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        resolvedAt: new Date(),
        resolutionMessage: resolutionMessage || null,
        resolvedByMembershipId
      },
      select: managedRequestSelect
    });
  });
}

// --- Solicitudes: creación ---
// La solicitud y su snapshot de datos se crean juntas para que la revisión posterior no dependa del perfil actual.
async function createRequestWithDetails(data) {
  return prisma.$transaction(async (db) => {
    const request = await db.communityRequest.create({
      data: {
        communityId: data.communityId,
        userId: data.userId,
        type: data.type,
        status: 'PENDING',
        requestComment: data.requestComment || null
      },
      select: { id: true, type: true, status: true, createdAt: true }
    });

    const details = await db.communityRequestDetails.create({
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
      select: requestDetailsWithLabelSelect
    });

    return { request, details };
  });
}

// --- Solicitudes: limpieza usada por otros módulos ---
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
  // Las pendientes se cancelan antes de archivar para no dejar solicitudes abiertas de una cuenta ya eliminada.
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

  // Tras la baja de cuenta desaparece la superficie de gestión del usuario, así que se archiva todo lo visible.
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
  findUpdateInfoContext,
  findPendingRequestByUserAndCommunity,
  findCommunityNotificationLeaders,
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