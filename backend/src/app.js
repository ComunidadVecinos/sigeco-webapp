require('dotenv').config();

// Construye la aplicación Express del backend, sin abrir todavía el puerto HTTP.
const express = require('express');
const cookieParser = require('cookie-parser');

const errorHandler = require('./lib/http/errorHandler');
const notFound = require('./lib/http/notFound');
const { getUploadsRootPath } = require('./lib/storage/storage');
const sessionService = require('./lib/session');
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
// Rutas publicas del módulo help, que no requieren contexto de comunidad.
//   - Las rutas de help dentro de comunidades se montan desde communities.routes.js.
const helpPublicRoutes = require('./modules/help/help.public.routes');
const communitiesRoutes = require('./modules/communities/communities.routes');
const requestsRoutes = require('./modules/requests/requests.routes');

const app = express();

// Valida al arrancar que la configuracion de sesión sea utilizable.
sessionService.getSessionSecret();

// Parseo base del body JSON y de la cookie de sesión antes de entrar en rutas.
app.use(express.json());
app.use(cookieParser());

// Endpoint mínimo de salud para comprobaciones de despliegue y diagnóstico rápido.
app.get('/api/health', (req, res) => { res.json({ status: 'ok', message: 'Backend is alive' }); });

// Publica el contenido de storage/uploads bajo la URL /uploads.
//   - "fallthrough: true" hace que un archivo inexistente no cierre la request aquí: continúa hasta notFound/errorHandler (404).
app.use('/uploads', express.static(getUploadsRootPath(), { fallthrough: true }));

// Montaje de módulos HTTP por dominio funcional.
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/help', helpPublicRoutes);
app.use('/api/communities', communitiesRoutes);
app.use('/api/requests', requestsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
