const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const password = 'Sigeco-2026';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: 'demo1@ucm.es' },
    update: {
      firstName: 'Demo',
      lastName: 'UserOne',
      passwordHash,
      phone: '+34600000001',
      imageUrl: '/uploads/profiles/demo1.png',
      isActive: true
    },
    create: {
      firstName: 'Demo',
      lastName: 'UserOne',
      email: 'demo1@ucm.es',
      passwordHash,
      phone: '+34600000001',
      imageUrl: '/uploads/profiles/demo1.png',
      isActive: true
    }
  });

  await prisma.user.upsert({
    where: { email: 'demo2@ucm.es' },
    update: {
      firstName: 'Demo',
      lastName: 'UserTwo',
      passwordHash,
      phone: '+34600000002',
      imageUrl: '/uploads/profiles/demo2.png',
      isActive: true
    },
    create: {
      firstName: 'Demo',
      lastName: 'UserTwo',
      email: 'demo2@ucm.es',
      passwordHash,
      phone: '+34600000002',
      imageUrl: '/uploads/profiles/demo2.png',
      isActive: true
    }
  });

  console.log('Seed completado');
}

main()
  .catch((e) => {
    console.error('Error en seed: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
