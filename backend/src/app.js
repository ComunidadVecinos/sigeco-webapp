require('dotenv').config();

// Configura la aplicación Express del backend sin abrir todavía el puerto HTTP.
// Reúne middleware global, assets públicos y rutas de cada módulo; expone la app para que el bootstrap la arranque.
// Lo consume index.js al inicio del proceso.
const express = require('express');
const cookieParser = require('cookie-parser');

const errorHandler = require('./lib/http/errorHandler');
const notFound = require('./lib/http/notFound');
const { getUploadsRootPath } = require('./lib/storage/storage');
const sessionService = require('./lib/session');
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
// Rutas públicas del módulo help, que no requieren contexto de comunidad.
//   - Las rutas de help dentro de comunidades se montan desde communities.routes.js.
const helpPublicRoutes = require('./modules/help/help.public.routes');
const communitiesRoutes = require('./modules/communities/communities.routes');
const requestsRoutes = require('./modules/requests/requests.routes');

const app = express();

// Evita exponer cabeceras innecesarias y valida desde el arranque la configuración crítica.
app.disable('x-powered-by');
sessionService.getSessionSecret();

// Middleware base que todo request necesita antes de llegar a los módulos HTTP.
app.use(express.json());
app.use(cookieParser());

// Endpoint mínimo de salud para despliegue, healthchecks y diagnóstico rápido.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is alive' });
});

// Publica el contenido de storage/uploads bajo la URL /uploads.
//   - "fallthrough: true" hace que un archivo inexistente no cierre la request aquí: continúa hasta notFound/errorHandler (404).
app.use('/uploads', express.static(getUploadsRootPath(), { fallthrough: true }));

// Rutas HTTP agrupadas por dominio funcional.
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/help', helpPublicRoutes);
app.use('/api/communities', communitiesRoutes);
app.use('/api/requests', requestsRoutes);

// Cierre uniforme del pipeline HTTP cuando ninguna ruta respondió o se lanzó un error.
app.use(notFound);
app.use(errorHandler);

module.exports = app;

