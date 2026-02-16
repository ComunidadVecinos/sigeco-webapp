const { ZodError } = require('zod');
const AppError = require('../errors/AppError');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    const payload = {
      error: {
        code: err.code,
        message: err.message
      }
    };

    if (err.details !== undefined) {
      payload.error.details = err.details;
    }

    return res.status(err.statusCode).json(payload);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
        details: err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }
    });
  }

  console.error(err);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal error'
    }
  });
}

module.exports = errorHandler;
