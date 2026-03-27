const { ValidationError } = require('../errors');
const formatZodIssues = require('./formatZodIssues');

const REQUEST_SEGMENTS = ['body', 'query', 'params', 'headers'];

// Acepta tanto un schema unico para body como un mapa por segmento HTTP.
function normalizeSchemas(schemaOrMap) {
  if (schemaOrMap && typeof schemaOrMap.safeParse === 'function') {
    return { body: schemaOrMap };
  }

  return schemaOrMap || {};
}

/**
 * Middleware de validación basado en Zod.
 * 
 * Aplica esquemas por segmento (body, query, params, headers), reemplaza cada segmento por los datos saneados de Zod 
 * y acumula todos los errores antes de delegar en ValidationError.
 * 
 */

function validate(schemaOrMap) {
  const schemas = normalizeSchemas(schemaOrMap);

  return (req, res, next) => {
    const details = [];

    for (const segment of REQUEST_SEGMENTS) {
      const schema = schemas[segment];

      if (!schema) {
        continue;
      }

      const result = schema.safeParse(req[segment]);
      if (!result.success) {
        details.push(...formatZodIssues(result.error, segment));
        continue;
      }

      req[segment] = result.data;
    }

    if (details.length > 0) {
      return next(new ValidationError(details));
    }

    return next();
  };
}

module.exports = validate;
