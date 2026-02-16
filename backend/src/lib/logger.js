// backend/src/lib/logger.js
function formatLog(level, message, meta) {
  const base = {
    level,
    time: new Date().toISOString(),
    ...meta
  };

  if (typeof message === 'string') {
    base.message = message;
  } else {
    base.message = JSON.stringify(message);
  }

  return JSON.stringify(base);
}

function info(message, meta = {}) {
  console.log(formatLog('info', message, meta));
}

function error(message, meta = {}) {
  console.error(formatLog('error', message, meta));
}

function warn(message, meta = {}) {
  console.warn(formatLog('warn', message, meta));
}

module.exports = {
  info,
  error,
  warn
};
