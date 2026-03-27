// Arranque del proceso HTTP del backend.
const app = require('./app');
const { initializeSeedAssetsStorage } = require('../prisma/seedAssetsBootstrap');

const PORT = process.env.PORT || 4000;

async function start() {
  // Antes de abrir puerto HTTP, deja listo el storage local con los assets del seed. 
  await initializeSeedAssetsStorage();

  app.listen(PORT, () => { console.log(`Backend listening on port ${PORT}`); });
}

// Fallo en bootstrap o en listen registra error fatal y termina el proceso.
start().catch((error) => {
  console.error('Failed to start backend', error);
  process.exit(1);
});
