const authOpenApi = {
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register user and create session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRegisterRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'User created',
            headers: {
              'Set-Cookie': {
                description: 'sid cookie with HttpOnly; Path=/; SameSite=Lax; persistent Max-Age',
                schema: { type: 'string' }
              }
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthRegisterResponse' }
              }
            }
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          409: {
            description: 'Email already registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          500: {
            description: 'Internal error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and create session',
        description: 'Provide email or phone plus password. If both are provided, email is checked first.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthLoginRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            headers: {
              'Set-Cookie': {
                description: 'sid cookie with HttpOnly; Path=/; SameSite=Lax; persistent Max-Age',
                schema: { type: 'string' }
              }
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthUserResponse' }
              }
            }
          },
          400: {
            description: 'Missing credentials or validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          500: {
            description: 'Internal error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout current session',
        description: 'Revokes current session when present and clears sid cookie.',
        responses: {
          200: {
            description: 'Logout successful',
            headers: {
              'Set-Cookie': {
                description: 'sid cookie cleared with Max-Age=0',
                schema: { type: 'string' }
              }
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthLogoutResponse' }
              }
            }
          },
          500: {
            description: 'Internal error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get authenticated user',
        description: 'Validates sid cookie against Session table and returns current user.',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Authenticated user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthUserResponse' }
              }
            }
          },
          401: {
            description: 'Missing, invalid or expired session',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          500: {
            description: 'Internal error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change password (authenticated user)',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthChangePasswordRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Password changed; all sessions revoked; current cookie cleared',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthMessageResponse' }
              }
            }
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: {
            description: 'Unauthorized or invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          500: {
            description: 'Internal error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Generate a new temporary password and send it by email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthForgotPasswordRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Reset request accepted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthMessageResponse' }
              }
            }
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          500: {
            description: 'Internal error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      AuthRegisterRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email', example: 'ana@ucm.es' },
          phone: { type: 'string', nullable: true, example: '+34600123456' },
          password: { type: 'string', minLength: 8, example: 'Password1' }
        }
      },
      AuthLoginRequest: {
        type: 'object',
        required: ['password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'ana@ucm.es' },
          phone: { type: 'string', nullable: true, example: '+34600123456' },
          password: { type: 'string', minLength: 1, example: 'Password1' }
        },
        description: 'Provide email or phone (at least one).'
      },
      AuthChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword', 'confirmNewPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
          confirmNewPassword: { type: 'string', minLength: 8 }
        }
      },
      AuthForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'ana@ucm.es' }
        }
      },
      AuthUserResponse: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', nullable: true }
        }
      },
      AuthRegisterResponse: {
        allOf: [
          { $ref: '#/components/schemas/AuthUserResponse' },
          {
            type: 'object',
            properties: {
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        ]
      },
      AuthLogoutResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Logged out successfully' }
        }
      },
      AuthMessageResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      },
      ErrorDetail: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          message: { type: 'string' }
        }
      },
      ErrorEnvelope: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          details: {
            type: 'array',
            items: { $ref: '#/components/schemas/ErrorDetail' }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { $ref: '#/components/schemas/ErrorEnvelope' }
        }
      }
    }
  }
};

module.exports = { authOpenApi };
