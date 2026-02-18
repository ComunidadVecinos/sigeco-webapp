const { authOpenApi } = require('./modules/auth/auth.openapi');

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SIGECO Backend API',
    version: '2.0.0',
    description: 'Auth based on signed HttpOnly sid cookie (no JWT, no DB session table).'
  },
  tags: [{ name: 'Auth' }],
  paths: {
    ...authOpenApi.paths
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'sid'
      }
    },
    schemas: {
      ...authOpenApi.components.schemas
    }
  }
};

module.exports = openApiSpec;
