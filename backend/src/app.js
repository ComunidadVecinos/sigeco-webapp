require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');

const authRoutes = require('./modules/auth/auth.routes');
const requestId = require('./lib/middleware/requestId');
const logger = require('./lib/logger');
const errorHandler = require('./lib/middleware/errorHandler');
const notFound = require('./lib/middleware/notFound');
const openApiSpec = require('./openapi');

const app = express();
const corsOrigins = String(process.env.CORS_ORIGIN || 'http://localhost')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(requestId);

app.use(
  morgan('combined', {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      }
    }
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: corsOrigins
  })
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is alive' });
});

app.use('/api/auth', authRoutes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
