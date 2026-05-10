// Manifiesto de assets seed.
// Centraliza ids estables y metadatos de ficheros que el seed persiste en BBDD.

const SEED_NO_COMMUNITY_USER_ID = '11111111-1111-4111-8111-111111111111';
const SEED_COMMUNITY_ID = '22222222-2222-4222-8222-222222222222';
const SEED_SECOND_COMMUNITY_ID = '33333333-3333-4333-8333-333333333333';

const seedAssets = {
  userAvatar: {
    userId: SEED_NO_COMMUNITY_USER_ID,
    storagePath: `uploads/images/users/${SEED_NO_COMMUNITY_USER_ID}/avatar.png`,
    mimeType: 'image/png',
    sizeBytes: 5783
  },
  communityAvatar: {
    communityId: SEED_COMMUNITY_ID,
    storagePath: `uploads/images/communities/${SEED_COMMUNITY_ID}/avatar.png`,
    mimeType: 'image/png',
    sizeBytes: 26633
  }
};

module.exports = { SEED_NO_COMMUNITY_USER_ID, SEED_COMMUNITY_ID, SEED_SECOND_COMMUNITY_ID, seedAssets };
