const { PrismaClient } = require('@prisma/client');

// Singleton de Prisma compartido por repositorios.
module.exports = new PrismaClient();