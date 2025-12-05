const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/items
async function getItems(req, res) {
  try {
    // req.user.sub contains authenticated user id
    const userId = req.user.sub;

    const items = await prisma.item.findMany({
      where: { userId },
      orderBy: { id: 'asc' }
    });

    res.json(items);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getItems
};
