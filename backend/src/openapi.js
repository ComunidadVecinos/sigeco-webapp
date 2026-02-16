const { authOpenApi } = require('./modules/auth/auth.openapi');

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SIGECO Backend API',
    version: '2.0.0',
    description: 'Auth based on stateful sessions stored in PostgreSQL and HttpOnly sid cookie.'
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
