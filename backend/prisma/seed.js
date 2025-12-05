const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: passwordHash
    }
  });

  await prisma.item.createMany({
    data: [
      {
        name: 'User item 1',
        description: 'First item belonging to the seeded user',
        userId: user.id
      },
      {
        name: 'User item 2',
        description: 'Second item belonging to the seeded user',
        userId: user.id
      }
    ]
  });

  console.log('Seeded user test@example.com / password123 with items.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
