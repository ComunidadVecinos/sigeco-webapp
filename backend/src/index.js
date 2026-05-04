// Arranca el proceso HTTP del backend y prepara dependencias locales previas.
// El flujo cubre bootstrap del storage de la seed, apertura del puerto y logging básico.
// Expone solo el arranque del servidor (la configuración de Express vive en app.js).

const app = require('./app');
const { initializeSeedAssetsStorage } = require('../prisma/seedAssetsBootstrap');

const PORT = process.env.PORT || 4000;

async function start() {
  // Antes de aceptar requests, deja listo el storage local con los assets que la seed pueda necesitar.
  await initializeSeedAssetsStorage();

  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

// Un fallo aquí impide que la aplicación quede medio arrancada y sin servir tráfico.
start().catch((error) => {
  console.error('Failed to start backend', error);
  process.exit(1);
});