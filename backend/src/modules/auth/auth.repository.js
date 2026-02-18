const prisma = require('../../config/prisma');

async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email }
  });
}

async function findUserByPhoneCandidates(phoneCandidates) {
  if (!phoneCandidates || phoneCandidates.length === 0) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      OR: phoneCandidates.map((phone) => ({ phone }))
    }
  });
}

async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      authVersion: true
    }
  });
}

async function createUser({ firstName, lastName, email, phone, passwordHash }) {
  return prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone: phone || null,
      passwordHash
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      authVersion: true,
      createdAt: true
    }
  });
}

async function updateUserPassword(userId, passwordHash) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      authVersion: { increment: 1 }
    },
    select: {
      id: true
    }
  });
}

module.exports = {
  findUserById,
  findUserByEmail,
  findUserByPhoneCandidates,
  createUser,
  updateUserPassword
};
