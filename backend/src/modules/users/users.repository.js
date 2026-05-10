// Repositorio de users: concentra perfil, avatar, contexto activo y limpieza de cuenta.
// Flujo cubierto: servicio -> queries/transacciones Prisma -> entidades listas para mapear o validar.
// Expone lecturas de perfil, cambios de contexto activo, operaciones de avatar y borrado lógico.
// Lo consume users.service.js.
const prisma = require('../../lib/prisma');
const calendarRepository = require('../calendar/calendar.repository');
const forumRepository = require('../forum/forum.repository');
const incidentsRepository = require('../incidents/incidents.repository');
const newsRepository = require('../news/news.repository');
const requestsRepository = require('../requests/requests.repository');
const reservationsRepository = require('../reservations/reservations.repository');
const votingRepository = require('../voting/voting.repository');

// --- Selects compartidos ---
// Campos necesarios para construir el perfil público del usuario autenticado y sus comunidades activas.
const userProfileSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  avatar: { select: { storagePath: true } },
  memberships: {
    where: {
      deletedAt: null,
      endedAt: null,
      community: { deletedAt: null }
    },
    orderBy: { joinedAt: 'asc' },
    select: {
      id: true,
      role: true,
      alias: true,
      suspendedAt: true,
      suspendedUntil: true,
      suspensionReason: true,
      joinedAt: true,
      community: { select: { id: true, name: true, avatar: {select: {storagePath: true} } } },
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
};

// Contexto mínimo para sincronizar avatar entre BD y storage.
const userAvatarContextSelect = {
  id: true,
  avatar: { select: { id: true, storagePath: true } }
};

// Contexto mínimo para borrar cuenta y decidir limpiezas posteriores.
const accountDeletionContextSelect = {
  id: true,
  avatar: { select: { id: true, storagePath: true } },
  memberships: {
    where: { deletedAt: null },
    select: { id: true }
  }
};

// --- Helpers comunes ---
// Reutiliza la misma comprobación de borrado lógico en lecturas de usuario.
async function findActiveUser(db, userId, select) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { deletedAt: true, ...select }
  });
  return user?.deletedAt === null ? user : null;
}

// --- Perfil propio: GET ---
async function findUserProfileById(userId) {
  return findActiveUser(prisma, userId, userProfileSelect);
}

// --- Perfil propio: PATCH ---
// Actualiza solo los campos editables del perfil básico.
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

// --- Contexto del usuario: PUT ---
// La comunidad activa vive en sesión y también en el usuario para recordar el último contexto elegido.
async function updateActiveMembershipContext({ userId, sessionId, membershipId }) {
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

// --- Avatar propio: PUT/DELETE ---
async function findUserProfileImageContext(userId) {
  return findActiveUser(prisma, userId, userAvatarContextSelect);
}

async function replaceUserProfileImage(userId, fileData) {
  return prisma.$transaction(async (tx) => {
    const user = await findActiveUser(tx, userId, { id: true });

    if (!user) {
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

async function deleteUserProfileImage(userId) {
  return prisma.$transaction(async (tx) => {
    const user = await findActiveUser(tx, userId, {
      id: true,
      avatar: { select: { id: true, storagePath: true } }
    });

    if (!user) {
      return null;
    }
    if (!user.avatar?.id) {
      return { storagePath: null };
    }

    await tx.userAvatar.delete({ where: { userId } });

    return { storagePath: user.avatar.storagePath };
  });
}

// --- Baja de cuenta: validaciones previas ---
async function findActivePresidenciesByUserId(userId) {
  return prisma.membership.findMany({
    where: {
      userId,
      role: 'PRESIDENT',
      deletedAt: null,
      endedAt: null,
      community: { deletedAt: null }
    },
    orderBy: { joinedAt: 'asc' },
    select: { community: { select: { id: true, name: true } } }
  });
}

// --- Baja de cuenta: DELETE lógico ---
async function deleteUserAccount(userId, deletionData) {
  // El borrado es lógico: anulamos acceso y relaciones activas, pero mantenemos la trazabilidad mínima.
  return prisma.$transaction(async (tx) => {
    const user = await findActiveUser(tx, userId, accountDeletionContextSelect);

    if (!user) {
      return null;
    }

    const now = new Date();
    const membershipIds = user.memberships.map(({ id }) => id);

    await requestsRepository.archiveRequestsByUserId(tx, { userId, archivedAt: now });

    if (membershipIds.length > 0) {
      // Este bloque limpia o anonimiza lo que depende directamente de memberships activas.
      await calendarRepository.softDeletePersonalEventsByMembershipIds(tx, membershipIds, now);
      const cancelledBookingIds = await reservationsRepository.cancelBookingsByOwnerMembershipIds(tx, membershipIds, {
        cancelledAt: now,
        cancellationReason: 'USER_ACCOUNT_DELETED'
      });

      await calendarRepository.softDeleteReservationEventsBySourceEntityIds(tx, cancelledBookingIds, now);
      await votingRepository.deleteVotesOfMembershipsInOpenPolls(tx, membershipIds, now);
      await forumRepository.deleteForumLikesByMembershipIds(tx, membershipIds);
      await forumRepository.softDeleteForumPostsByMembershipIds(tx, membershipIds, now);
      await forumRepository.anonymizeForumCommentsByMembershipIds(tx, membershipIds);
      await newsRepository.anonymizeNewsByMembershipIds(tx, membershipIds);
      await incidentsRepository.anonymizeIncidentsByMembershipIds(tx, membershipIds);

      // La vivienda asociada a memberships activas también se retira del circuito funcional.
      await tx.property.updateMany({
        where: { membershipId: { in: membershipIds }, deletedAt: null },
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
      // El registro del avatar cae dentro de la transacción; el fichero físico se borra fuera.
      await tx.userAvatar.delete({ where: { userId } });
    }

    return { profileImageStoragePath: user.avatar?.storagePath || null };
  });
}

module.exports = {
  findUserProfileById,
  findUserProfileImageContext,
  updateActiveMembershipContext,
  updateUserProfile,
  replaceUserProfileImage,
  deleteUserProfileImage,
  findActivePresidenciesByUserId,
  deleteUserAccount
};