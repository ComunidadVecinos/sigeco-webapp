// Instancia única de Prisma compartida por todos los repositorios.
// Este archivo existe para que el backend abra un solo cliente por proceso (Singleton).
const { PrismaClient } = require('@prisma/client');

module.exports = new PrismaClient();