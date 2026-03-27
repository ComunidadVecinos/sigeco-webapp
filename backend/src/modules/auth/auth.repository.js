// Acceso a datos del módulo auth.
const prisma = require('../../lib/prisma');

// Nota. Todas las lecturas de usuario en auth filtran borrado lógico para no reactivar credenciales de cuentas "borradas" del sistema.

async function findUserByEmail(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  return user && user.deletedAt === null ? user : null;
}

async function findUserByPhone(phone) {
  if (!phone) {
    return null;
  }
  const user = await prisma.user.findUnique({ where: { phone } });
  return user && user.deletedAt === null ? user : null;
}

// Variante ligera para bootstrap de contexto y respuestas autenticadas.
async function findUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      lastActiveMembershipId: true,
      deletedAt: true
    }
  });

  if (!user || user.deletedAt !== null) {
    return null;
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    lastActiveMembershipId: user.lastActiveMembershipId
  };
}

// Variante mínima para operaciones sobre credenciales.
async function findUserAuthById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      passwordChangedAt: true,
      deletedAt: true
    }
  });

  if (!user || user.deletedAt !== null) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    passwordChangedAt: user.passwordChangedAt
  };
}

// El alta persiste "passwordChangedAt" desde el inicio para políticas de invalidez de sesiones.
async function createUser({ firstName, lastName, email, phone, passwordHash }) {
  return prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone: phone || null,
      passwordHash,
      passwordChangedAt: new Date()
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true
    }
  });
}

async function updateUserPassword(userId, passwordHash) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordChangedAt: new Date() },
    select: { id: true }
  });
}

// Función auxiliar: reset password aplica rollback si falla el servicio de correos.
async function restoreUserPasswordState(userId, { passwordHash, passwordChangedAt }) {
  return prisma.user.update({
    where: { id: userId },
    data: {  passwordHash, passwordChangedAt },
    select: { id: true }
  });
}

// Devuelve memberships activas (no borradas, no finalizadas, comunidades no borradas) de un usuario para uso en contexto de acceso.
async function findActiveMembershipsByUserId(userId) {
  return prisma.membership.findMany({
    where: {
      userId,
      deletedAt: null,
      endedAt: null,
      community: {
        deletedAt: null
      }
    },
    select: {
      id: true,
      communityId: true,
      role: true,
      alias: true,
      suspendedAt: true,
      suspendedUntil: true,
      suspensionReason: true,
      joinedAt: true,
      community: {
        select: { id: true, name: true }
      }
    },
    orderBy: { joinedAt: 'asc' }
  });
}

async function updateUserLastActiveMembership(userId, membershipId) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastActiveMembershipId: membershipId }
  });
}

// Crea sesión sin lógica de contexto activo ni sincronización de último contexto activo del usuario para casos puntuales (ej. bootstrap, logout).
//   - Para login: createSessionWithAccessContext. 
//   - Para middleware de sesión: findSessionById + repairSessionAccessContext.
async function createSession({ id, userId, activeMembershipId, expiresAt }) {
  return prisma.session.create({
    data: {
      id,
      userId,
      activeMembershipId: activeMembershipId || null,
      expiresAt
    },
    select: {
      id: true,
      userId: true,
      activeMembershipId: true,
      createdAt: true,
      expiresAt: true
    }
  });
}

// Login: persiste sesión y sincroniza el último contexto activo. 
async function createSessionWithAccessContext({ id, userId, currentLastActiveMembershipId, activeMembershipId, expiresAt }) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.session.create({
      data: {
        id,
        userId,
        activeMembershipId: activeMembershipId || null,
        expiresAt
      },
      select: {
        id: true,
        userId: true,
        activeMembershipId: true,
        createdAt: true,
        expiresAt: true
      }
    });

    if (activeMembershipId && activeMembershipId !== currentLastActiveMembershipId) {
      await tx.user.update({
        where: { id: userId },
        data: { lastActiveMembershipId: activeMembershipId }
      });
    }

    return session;
  });
}

// Carga también el usuario y la membership activa (objetivo: validar y reparar el contexto).
async function findSessionById(sessionId) {
  return prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      activeMembershipId: true,
      createdAt: true,
      expiresAt: true,
      invalidatedAt: true,
      activeMembership: {
        select: {
          id: true,
          userId: true,
          endedAt: true,
          deletedAt: true,
          community: {
            select: { deletedAt: true }
          }
        }
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          deletedAt: true,
          lastActiveMembershipId: true
        }
      }
    }
  });
}

// Mantiene alineados session.activeMembershipId y user.lastActiveMembershipId.
async function updateSessionAccessContext({ sessionId, userId, activeMembershipId }) {
  return prisma.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: sessionId },
      data: { activeMembershipId }
    });

    await tx.user.update({
      where: { id: userId },
      data: { lastActiveMembershipId: activeMembershipId }
    });
  });
}

// Invalida sesión por ID si no ha sido ya invalidada ni ha expirado (ej. logout, cambio de password).
//   - Se utiliza updateMany para evitar excepción por update (tratar 0 como un caso más --> no hay nada que invalidar).
async function invalidateSession(sessionId) {
  return prisma.session.updateMany({
    where: {
      id: sessionId,
      invalidatedAt: null,
      expiresAt: { gt: new Date() }
    },
    data: { invalidatedAt: new Date() }
  });
}

async function invalidateActiveSessionsByUserId(userId) {
  return prisma.session.updateMany({
    where: { userId, invalidatedAt: null },
    data: { invalidatedAt: new Date() }
  });
}

// Tras cambio de password se conserva la sesión actual, invalidando el resto.
async function invalidateOtherActiveSessionsByUserId(userId, excludedSessionId) {
  return prisma.session.updateMany({
    where: {
      userId,
      invalidatedAt: null,
      id: { not: excludedSessionId }
    },
    data: { invalidatedAt: new Date() }
  });
}

module.exports = {
  findUserById,
  findUserAuthById,
  findUserByEmail,
  findUserByPhone,
  createUser,
  updateUserPassword,
  restoreUserPasswordState,
  findActiveMembershipsByUserId,
  updateUserLastActiveMembership,
  createSession,
  createSessionWithAccessContext,
  findSessionById,
  updateSessionAccessContext,
  invalidateSession,
  invalidateActiveSessionsByUserId,
  invalidateOtherActiveSessionsByUserId
};