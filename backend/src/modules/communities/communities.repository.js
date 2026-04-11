// Acceso a datos del módulo communities.
const prisma = require('../../lib/prisma');
const { ConflictError } = require('../../lib/errors');
const { isMembershipCurrentlySuspended } = require('../../lib/membership');

// El tombstone conserva el CIF previo. Ejemplo: `H-12345678-D-ABC123`.
function buildDeletedCommunityCif(currentCif, communityId) {
  const communitySuffix = String(communityId).replace(/-/g, '').slice(-6).toUpperCase();
  return `${currentCif}-D-${communitySuffix}`;
}

// Communities considera "activos" solo los miembros cuyo acceso no está suspendido en este instante. 
function buildCurrentlyActiveMembershipWhere(communityId, now = new Date()) {
  return {
    communityId,
    deletedAt: null,
    endedAt: null,
    OR: [{ suspendedUntil: null }, { suspendedUntil: { lte: now } }]
  };
}

async function findCommunityByCif(cif) {
  return prisma.community.findFirst({
    where: { cif, deletedAt: null },
    select: { id: true }
  });
}

async function findCommunityStatusById(communityId) {
  return prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true, deletedAt: true }
  });
}

async function updateCommunityBasicData(communityId, data) {
  return prisma.$transaction(async (tx) => {
    const updateResult = await tx.community.updateMany({
      where: { id: communityId, deletedAt: null },
      data
    });

    if (updateResult.count !== 1) {
      return null;
    }

    return tx.community.findFirst({
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
  return prisma.$transaction(async (tx) => {
    const updateResult = await tx.community.updateMany({
      where: { id: communityId, deletedAt: null },
      data: {  accessCode }
    });

    if (updateResult.count !== 1) {
      return null;
    }

    return tx.community.findFirst({
      where: { id: communityId, deletedAt: null },
      select: { id: true, accessCode: true }
    });
  });
}

async function findCommunityProfileImageContext(communityId) {
  const community = await prisma.community.findFirst({
    where: { id: communityId, deletedAt: null },
    select: {
      id: true,
      avatar: { select: { id: true,  storagePath: true } }
    }
  });

  return community;
}

// Upsert mantiene una sola fila de avatar por comunidad.
async function replaceCommunityProfileImage(communityId, fileData) {
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.findFirst({
      where: { id: communityId, deletedAt: null },
      select: { id: true }
    });

    if (!community) {
      return null;
    }

    const file = await tx.communityAvatar.upsert({
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
  return prisma.$transaction(async (tx) => {
    const community = await tx.community.findFirst({
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

    await tx.communityAvatar.delete({ where: { communityId } });

    return { communityId: community.id, storagePath: community.avatar.storagePath };
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

  // Si todas las memberships restantes estan suspendidas, mantenemos una referencia válida.
  return firstNonSuspendedMembership || memberships[0];
}

async function softDeleteCommunityWithActorContext({ communityId, actorUserId, actorMembershipId, sessionId, currentSessionActiveMembershipId, nextAccessCode }) {
  // El borrado lógico libera identificadores únicos y limpia referencias de sesión.
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const community = await tx.community.findFirst({
      where: { id: communityId, deletedAt: null },
      select: {
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
    const communityMemberships = await tx.membership.findMany({
      where: { communityId, deletedAt: null, endedAt: null },
      select: { id: true, userId: true }
    });
    const deletedMembershipIds = communityMemberships.map((membership) => membership.id);

    const updateResult = await tx.community.updateMany({
      where: { id: communityId, deletedAt: null },
      // Se libera el código de acceso.
      data: { deletedAt: now, cif: deletedCif, accessCode: nextAccessCode }
    });

    if (updateResult.count !== 1) {
      return null;
    }

    // Se cierran las memberships actias/abiertas.
    await tx.membership.updateMany({
      where: { communityId, deletedAt: null, endedAt: null },
      data: { endedAt: now, endReason: 'COMMUNITY_DELETED' }
    });

    await tx.communityRequest.updateMany({
      where: { communityId, status: 'PENDING', archivedAt: null },
      data: { status: 'CANCELLED', cancelledAt: now }
    });

    if (deletedMembershipIds.length > 0) {
      await tx.session.updateMany({
        where: { activeMembershipId: { in: deletedMembershipIds }, invalidatedAt: null },
        data: { activeMembershipId: null }
      });
    }

    const actorUser = await tx.user.findUnique({
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
      const remainingMemberships = await tx.membership.findMany({
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

      const nextActiveMembership = selectNextActiveMembership(remainingMemberships, shouldUpdateSessionActiveMembership ? null : currentSessionActiveMembershipId);

      nextActiveMembershipId = nextActiveMembership?.id || null;

      if (shouldUpdateSessionActiveMembership) {
        await tx.session.update({
          where: { id: sessionId },
          data: { activeMembershipId: nextActiveMembershipId }
        });
      }

      if (shouldUpdateUserLastActiveMembership) {
        await tx.user.update({
          where: { id: actorUserId },
          data: { lastActiveMembershipId: nextActiveMembershipId }
        });
      }
    }

    return {
      nextActiveMembershipId,
      storedFiles: {
        communityAvatarStoragePath: community.avatar?.storagePath || null,
        newsImageStoragePaths: community.newsItems.map((item) => item.imageStoragePath).filter(Boolean),
        incidentImageStoragePaths: community.incidents.map((item) => item.imageStoragePath).filter(Boolean),
        documentStoragePaths: community.documents.map((document) => document.storagePath).filter(Boolean)
      }
    };
  });
}

async function findCommunityLeaders(communityId) {
  return prisma.membership.findMany({
    where: { ...buildCurrentlyActiveMembershipWhere(communityId), role: { in: ['PRESIDENT', 'VICE_PRESIDENT'] } },
    select: { id: true, alias: true, role: true, createdAt: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  });
}

async function createCommunityWithCreatorContext(data) {
  // Crear comunidad concede rol de presidente al usuario en la sesión.
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: { id: data.userId, deletedAt: null },
      select: { id: true }
    });

    if (!user) {
      return null;
    }

    const session = await tx.session.findFirst({
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

    const community = await tx.community.create({
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

    const membership = await tx.membership.create({
      data: { userId: data.userId, communityId: community.id, role: 'PRESIDENT', alias: data.alias },
      select: { id: true, role: true, alias: true, joinedAt: true }
    });

    const property = await tx.property.create({
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

    await tx.user.update({
      where: { id: data.userId },
      data: { lastActiveMembershipId: membership.id }
    });

    const sessionUpdate = await tx.session.updateMany({
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
