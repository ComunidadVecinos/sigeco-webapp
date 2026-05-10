// Repositorio de communities: agrupa la persistencia de comunidad, avatar y cambios de contexto.
// Flujo cubierto: servicio -> queries/transacciones Prisma -> entidades listas para mapear o validar.
// Expone lecturas de comunidad, cambios de avatar, creación y borrado lógico con impacto en memberships y sesiones.
// Lo consume communities.service.js.
const prisma = require('../../lib/prisma');
const { ConflictError } = require('../../lib/errors');
const { isMembershipCurrentlySuspended } = require('../../lib/membership');

// --- Helpers comunes ---
// El tombstone conserva el CIF previo y libera su unicidad tras el borrado lógico.
function buildDeletedCommunityCif(currentCif, communityId) {
  const communitySuffix = String(communityId).replace(/-/g, '').slice(-6).toUpperCase();
  return `${currentCif}-D-${communitySuffix}`;
}

// Communities considera "activos" solo los miembros no borrados, no finalizados y no suspendidos en este instante.
function buildCurrentlyActiveMembershipWhere(communityId, now = new Date()) {
  return {
    communityId,
    deletedAt: null,
    endedAt: null,
    OR: [{ suspendedUntil: null }, { suspendedUntil: { lte: now } }]
  };
}

// Si el contexto preferido del actor deja de existir, intentamos moverlo a una membership restante no suspendida.
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
  return firstNonSuspendedMembership || memberships[0];
}

// --- Comunidad: GET y búsquedas base ---
async function findCommunityByCif(cif) {
  return prisma.community.findFirst({
    where: { cif, deletedAt: null },
    select: { id: true }
  });
}

async function findCommunityStatusById(communityId) {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true, deletedAt: true }
  });
  return community ? { id: community.id, deletedAt: community.deletedAt } : null;
}

async function findCommunityProfileImageContext(communityId) {
  return prisma.community.findFirst({
    where: { id: communityId, deletedAt: null },
    select: {
      id: true,
      avatar: { select: { id: true, storagePath: true } }
    }
  });
}

async function findCommunityLeaders(communityId) {
  return prisma.membership.findMany({
    where: {
      ...buildCurrentlyActiveMembershipWhere(communityId),
      role: { in: ['PRESIDENT', 'VICE_PRESIDENT'] }
    },
    select: { id: true, alias: true, role: true, createdAt: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  });
}

// --- Comunidad: PATCH de datos base ---
async function updateCommunityBasicData(communityId, data) {
  return prisma.$transaction(async (db) => {
    const updated = await db.community.updateMany({
      where: { id: communityId, deletedAt: null },
      data
    });
    if (updated.count !== 1) {
      return null;
    }
    return db.community.findFirst({
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
        createdAt: true
      }
    });
  });
}

async function updateCommunityAccessCode(communityId, accessCode) {
  return prisma.$transaction(async (db) => {
    const updated = await db.community.updateMany({
      where: { id: communityId, deletedAt: null },
      data: { accessCode }
    });
    if (updated.count !== 1) {
      return null;
    }
    return db.community.findFirst({
      where: { id: communityId, deletedAt: null },
      select: { id: true, accessCode: true }
    });
  });
}

// --- Comunidad: PUT/DELETE de avatar ---
// El upsert mantiene una sola fila de avatar por comunidad.
async function replaceCommunityProfileImage(communityId, fileData) {
  return prisma.$transaction(async (db) => {
    const community = await db.community.findFirst({
      where: { id: communityId, deletedAt: null },
      select: { id: true }
    });
    if (!community) {
      return null;
    }
    const file = await db.communityAvatar.upsert({
      where: { communityId },
      update: {
        storagePath: fileData.storagePath,
        mimeType: fileData.mimeType,
        sizeBytes: fileData.sizeBytes
      },
      create: {
        communityId,
        storagePath: fileData.storagePath,
        mimeType: fileData.mimeType,
        sizeBytes: fileData.sizeBytes
      },
      select: { id: true, storagePath: true }
    });
    return { communityId: community.id, file };
  });
}

async function deleteCommunityProfileImage(communityId) {
  return prisma.$transaction(async (db) => {
    const community = await db.community.findFirst({
      where: { id: communityId, deletedAt: null },
      select: {
        id: true,
        avatar: { select: { id: true, storagePath: true } }
      }
    });
    if (!community) {
      return null;
    }
    if (!community.avatar?.id) {
      return { communityId: community.id, storagePath: null };
    }
    await db.communityAvatar.delete({ where: { communityId } });
    return { communityId: community.id, storagePath: community.avatar.storagePath };
  });
}

// --- Comunidad: DELETE lógico con impacto en contexto del actor ---
async function softDeleteCommunityWithActorContext({
  communityId,
  actorUserId,
  actorMembershipId,
  sessionId,
  currentSessionActiveMembershipId,
  nextAccessCode
}) {
  // El borrado lógico libera identificadores únicos, cierra memberships y limpia referencias de sesión.
  return prisma.$transaction(async (db) => {
    const now = new Date();
    const community = await db.community.findFirst({
      where: { id: communityId, deletedAt: null },
      select: {
        id: true,
        name: true,
        cif: true,
        avatar: { select: { storagePath: true } },
        newsItems: { select: { imageStoragePath: true } },
        incidents: { select: { imageStoragePath: true } },
        documents: { select: { storagePath: true } }
      }
    });

    if (!community) {
      return null;
    }

    const deletedCif = buildDeletedCommunityCif(community.cif, communityId);
    const communityMemberships = await db.membership.findMany({
      where: { communityId, deletedAt: null, endedAt: null },
      select: {
        id: true,
        userId: true,
        alias: true,
        role: true,
        user: { select: { email: true } }
      }
    });
    const deletedMembershipIds = communityMemberships.map((membership) => membership.id);

    const updated = await db.community.updateMany({
      where: { id: communityId, deletedAt: null },
      data: {
        deletedAt: now,
        cif: deletedCif,
        accessCode: nextAccessCode
      }
    });

    if (updated.count !== 1) {
      return null;
    }

    await db.membership.updateMany({
      where: { communityId, deletedAt: null, endedAt: null },
      data: { endedAt: now, endReason: 'COMMUNITY_DELETED' }
    });

    await db.communityRequest.updateMany({
      where: { communityId, status: 'PENDING', archivedAt: null },
      data: { status: 'CANCELLED', cancelledAt: now }
    });

    if (deletedMembershipIds.length > 0) {
      await db.session.updateMany({
        where: { activeMembershipId: { in: deletedMembershipIds }, invalidatedAt: null },
        data: { activeMembershipId: null }
      });
    }

    const actorUser = await db.user.findUnique({
      where: { id: actorUserId },
      select: { id: true, lastActiveMembershipId: true, deletedAt: true }
    });

    if (!actorUser || actorUser.deletedAt !== null) {
      return null;
    }

    const shouldUpdateSessionActiveMembership = currentSessionActiveMembershipId === actorMembershipId;
    const shouldUpdateUserLastActiveMembership = actorUser.lastActiveMembershipId === actorMembershipId;

    let nextActiveMembershipId = currentSessionActiveMembershipId || null;

    if (shouldUpdateSessionActiveMembership || shouldUpdateUserLastActiveMembership) {
      const remainingMemberships = await db.membership.findMany({
        where: {
          userId: actorUserId,
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

      const nextActiveMembership = selectNextActiveMembership(
        remainingMemberships,
        shouldUpdateSessionActiveMembership ? null : currentSessionActiveMembershipId
      );

      nextActiveMembershipId = nextActiveMembership?.id || null;

      if (shouldUpdateSessionActiveMembership) {
        await db.session.update({
          where: { id: sessionId },
          data: { activeMembershipId: nextActiveMembershipId }
        });
      }
      if (shouldUpdateUserLastActiveMembership) {
        await db.user.update({
          where: { id: actorUserId },
          data: { lastActiveMembershipId: nextActiveMembershipId }
        });
      }
    }

    return {
      nextActiveMembershipId,
      community: { id: community.id, name: community.name },
      deletedMembers: communityMemberships,
      storedFiles: {
        communityAvatarStoragePath: community.avatar?.storagePath || null,
        newsImageStoragePaths: community.newsItems.map((item) => item.imageStoragePath).filter(Boolean),
        incidentImageStoragePaths: community.incidents.map((item) => item.imageStoragePath).filter(Boolean),
        documentStoragePaths: community.documents.map((document) => document.storagePath).filter(Boolean)
      }
    };
  });
}

// --- Comunidad: POST de creación ---
async function createCommunityWithCreatorContext(data) {
  // Crear comunidad concede rol de presidente al actor y actualiza su contexto activo.
  return prisma.$transaction(async (db) => {
    const user = await db.user.findFirst({
      where: { id: data.userId, deletedAt: null },
      select: { id: true }
    });

    if (!user) {
      return null;
    }

    const session = await db.session.findFirst({
      where: {
        id: data.sessionId,
        userId: data.userId,
        invalidatedAt: null,
        expiresAt: { gt: new Date() }
      },
      select: { id: true }
    });

    if (!session) {
      return null;
    }

    const community = await db.community.create({
      data: {
        name: data.community.name,
        cif: data.community.cif,
        country: data.community.country,
        province: data.community.province,
        municipality: data.community.municipality,
        streetType: data.community.streetType,
        streetName: data.community.streetName,
        postalCode: data.community.postalCode,
        streetNumberKm: data.community.streetNumberKm,
        accessCode: data.accessCode
      },
      select: { id: true, name: true, cif: true, accessCode: true }
    });

    const membership = await db.membership.create({
      data: {
        userId: data.userId,
        communityId: community.id,
        role: 'PRESIDENT',
        alias: data.alias
      },
      select: { id: true, role: true, alias: true, joinedAt: true }
    });

    const property = await db.property.create({
      data: {
        membershipId: membership.id,
        label: data.creatorProperty.label,
        country: data.creatorProperty.country,
        province: data.creatorProperty.province,
        municipality: data.creatorProperty.municipality,
        streetType: data.creatorProperty.streetType,
        streetName: data.creatorProperty.streetName,
        postalCode: data.creatorProperty.postalCode,
        streetNumberKm: data.creatorProperty.streetNumberKm,
        block: data.creatorProperty.block || null,
        floor: data.creatorProperty.floor || null,
        door: data.creatorProperty.door || null
      },
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
        door: true
      }
    });

    await db.user.update({
      where: { id: data.userId },
      data: { lastActiveMembershipId: membership.id }
    });

    const sessionUpdate = await db.session.updateMany({
      where: { id: data.sessionId, userId: data.userId, invalidatedAt: null },
      data: { activeMembershipId: membership.id }
    });

    if (sessionUpdate.count !== 1) {
      throw new ConflictError('No se ha podido actualizar la sesión');
    }

    return { community, membership, property };
  });
}

module.exports = {
  findCommunityByCif,
  findCommunityStatusById,
  updateCommunityBasicData,
  updateCommunityAccessCode,
  findCommunityProfileImageContext,
  replaceCommunityProfileImage,
  deleteCommunityProfileImage,
  softDeleteCommunityWithActorContext,
  findCommunityLeaders,
  createCommunityWithCreatorContext
};