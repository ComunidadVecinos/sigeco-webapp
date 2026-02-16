const crypto = require('crypto');

const prisma = require('../../config/prisma');

function getSessionTtlDays() {
  const raw = process.env.SESSION_TTL_DAYS;
  const days = Number(raw ?? 7);
  if (!Number.isFinite(days) || days <= 0) return 7;
  return days;
}

function getSessionTtlMs() {
  return getSessionTtlDays() * 24 * 60 * 60 * 1000;
}

function generateSessionId() {
  return crypto.randomBytes(32).toString('base64url');
}

async function createSession(userId, context = {}, ttlMs = getSessionTtlMs()) {
  const id = generateSessionId();
  const expiresAt = new Date(Date.now() + ttlMs);
  const now = new Date();

  await prisma.session.create({
    data: {
      id,
      userId,
      expiresAt,
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
      lastSeenAt: now
    }
  });

  return { id, expiresAt };
}

async function getValidSession(sid) {
  if (!sid) return null;

  return prisma.session.findFirst({
    where: {
      id: sid,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true
        }
      }
    }
  });
}

async function revokeSession(sid) {
  if (!sid) return { count: 0 };

  return prisma.session.updateMany({
    where: { id: sid, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

async function revokeAllUserSessions(userId) {
  return prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

async function touchSession(sid) {
  if (!sid) return { count: 0 };

  return prisma.session.updateMany({
    where: { id: sid, revokedAt: null },
    data: { lastSeenAt: new Date() }
  });
}

async function cleanupExpiredSessions() {
  const now = new Date();
  const result = await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lte: now } },
        { revokedAt: { not: null } }
      ]
    }
  });

  return result.count;
}

module.exports = {
  getSessionTtlDays,
  getSessionTtlMs,
  createSession,
  getValidSession,
  revokeSession,
  revokeAllUserSessions,
  touchSession,
  cleanupExpiredSessions
};
