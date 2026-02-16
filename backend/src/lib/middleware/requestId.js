// backend/src/lib/middleware/requestId.js
const { v4: uuidv4 } = require('uuid');

function requestId(req, res, next) {
  const existing = req.headers['x-request-id'];

  const id = existing || uuidv4();
  req.id = id;
  res.setHeader('X-Request-Id', id);

  next();
}

module.exports = requestId;
