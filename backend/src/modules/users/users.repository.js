// Acceso a datos del módulo users.
const prisma = require('../../lib/prisma');
const calendarRepository = require('../calendar/calendar.repository');
const forumRepository = require('../forum/forum.repository');
const requestsRepository = require('../requests/requests.repository');
const votingRepository = require('../voting/voting.repository');

async function findUserProfileById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      deletedAt: true,
      avatar: { select: { storagePath: true } },
      memberships: {
        where: {
          deletedAt: null,
          endedAt: null,
          community: { deletedAt: null }
        },
        orderBy: { joinedAt: 'asc' },
        // El perfil necesita datos suficientes para la relación del usuario con cada comunidad.
        select: {
          id: true,
          role: true,
          alias: true,
          suspendedAt: true,
          suspendedUntil: true,
          suspensionReason: true,
          joinedAt: true,
          community: { select: { id: true, name: true } },
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
      }
    }
  });

  return user && user.deletedAt === null ? user : null;
}

async function findUserProfileImageContext(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      deletedAt: true,
      avatar: {
        select: { id: true, storagePath: true }
      }
    }
  });

  return user && user.deletedAt === null ? user : null;
}

async function updateActiveMembershipContext({ userId, sessionId, membershipId }) {
  // El contexto activo se persiste en la sesión como en el usuario.
  return prisma.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: sessionId },
      data: { activeMembershipId: membershipId }
    });

    await tx.user.update({
      where: { id: userId },
      data: { lastActiveMembershipId: membershipId }
    });

    return { membershipId };
  });
}

async function updateUserProfile(userId, data) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null
    },
    select: { id: true }
  });
}

async function replaceUserProfileImage(userId, fileData) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true }
    });

    if (!user || user.deletedAt !== null) {
      return null;
    }

    const file = await tx.userAvatar.upsert({
      where: { userId },
      update: {
        storagePath: fileData.storagePath,
        mimeType: fileData.mimeType,
        sizeBytes: fileData.sizeBytes
      },
      create: {
        userId,
        storagePath: fileData.storagePath,
        mimeType: fileData.mimeType,
        sizeBytes: fileData.sizeBytes
      },
      select: { id: true, storagePath: true }
    });

    return { file };
  });
}

async function deleteUserAccount(userId, deletionData) {
  // El borrado de cuenta es lógico: invalida acceso y relaciones activas, pero conserva trazabilidad mínima.
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        deletedAt: true,
        avatar: { select: { id: true, storagePath: true } },
        memberships: {
          where: { deletedAt: null },
          select: { id: true }
        }
      }
    });

    if (!user || user.deletedAt !== null) {
      return null;
    }

    const now = new Date();
    const membershipIds = user.memberships.map((membership) => membership.id);

    if (membershipIds.length > 0) {
      await calendarRepository.softDeletePersonalEventsByMembershipIds(tx, membershipIds, now);
      await votingRepository.deleteVotesOfMembershipsInOpenPolls(tx, membershipIds, now);
      await forumRepository.deleteForumLikesByMembershipIds(tx, membershipIds);
      await forumRepository.softDeleteForumPostsByMembershipIds(tx, membershipIds, now);
      await forumRepository.anonymizeForumCommentsByMembershipIds(tx, membershipIds);
      await requestsRepository.archiveRequestsByUserId(tx, { userId, archivedAt: now });
      // Se marca también la vivienda, porque su significado depende de la membership eliminada.
      await tx.property.updateMany({
        where: { membershipId: { in: membershipIds }, deletedAt: null
        },
        data: { deletedAt: now }
      });

      await tx.membership.updateMany({
        where: {
          id: { in: membershipIds },
          deletedAt: null
        },
        data: { endedAt: now, endReason: 'USER_ACCOUNT_DELETED', deletedAt: now }
      });
    }
    else {
      await requestsRepository.archiveRequestsByUserId(tx, { userId, archivedAt: now });
    }

    await tx.session.updateMany({
      where: { userId, invalidatedAt: null },
      data: { invalidatedAt: now }
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        firstName: deletionData.firstName,
        lastName: deletionData.lastName,
        email: deletionData.email,
        phone: deletionData.phone,
        passwordHash: deletionData.passwordHash,
        passwordChangedAt: now,
        lastActiveMembershipId: null,
        deletedAt: now
      }
    });

    if (user.avatar?.id) {
      // El registro de avatar se elimina dentro de la transaccion; el fichero se limpia después.
      await tx.userAvatar.delete({ where: { userId } });
    }

    return { profileImageStoragePath: user.avatar?.storagePath || null };
  });
}

module.exports = { findUserProfileById, findUserProfileImageContext, updateActiveMembershipContext, updateUserProfile, replaceUserProfileImage, deleteUserAccount };
