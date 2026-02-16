// backend/src/index.js
const app = require('./app');
const logger = require('./lib/logger');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`Backend listening on port ${PORT}`);
});
