// Repositorio de auth: reúne las consultas de usuario, memberships y sesiones persistidas.
// Flujo cubierto: service/middleware -> queries Prisma -> credenciales, contexto y sesiones persistidas.
// Expone lecturas de usuario, bootstrap de contexto y operaciones de sesión/contraseña. Lo consumen los módulos que necesitan contexto de acceso.
const prisma = require('../../lib/prisma');

// --- Helpers comunes ---
// Todas las lecturas de usuario en auth filtran borrado lógico para no reactivar cuentas ya eliminadas.
function pickActiveUser(user) {
  return user && user.deletedAt === null ? user : null;
}

// --- Usuarios: búsquedas por identidad ---
async function findUserByEmail(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  return pickActiveUser(user);
}

async function findUserByPhone(phone) {
  if (!phone) {
    return null;
  }
  const user = await prisma.user.findUnique({ where: { phone } });
  return pickActiveUser(user);
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

  if (!pickActiveUser(user)) {
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

  if (!pickActiveUser(user)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    passwordChangedAt: user.passwordChangedAt
  };
}

// --- Usuarios: escritura de credenciales ---
// El alta persiste passwordChangedAt desde el inicio para las políticas de invalidez de sesiones.
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

// Reset de password aplica rollback si falla el envío de correo.
async function restoreUserPasswordState(userId, { passwordHash, passwordChangedAt }) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordChangedAt },
    select: { id: true }
  });
}

// --- Memberships: contexto de acceso ---
// Devuelve memberships activas para construir el contexto visible del usuario autenticado.
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
      community: { select: { id: true, name: true } }
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

// --- Sesiones: creación y lectura ---
// Crea sesión sin lógica de contexto activo para usos puntuales.
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

// Carga también usuario y membership activa para validar o reparar el contexto persistido.
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

// --- Sesiones: reparación e invalidación ---
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

// Se usa updateMany para tratar "count = 0" como un caso controlado, no como excepción Prisma.
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

// Tras cambio de password se conserva la sesión actual e invalida el resto.
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