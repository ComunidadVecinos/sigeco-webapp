const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const prisma = require('../src/config/prisma');
const sessionService = require('../src/lib/session/session.service');

async function main() {
  const deleted = await sessionService.cleanupExpiredSessions();
  console.log(`Sessions removed: ${deleted}`);
}

main()
  .catch((error) => {
    console.error('Session cleanup failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
