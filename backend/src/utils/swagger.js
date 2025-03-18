const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Moment API Documentation',
      version: '1.0.0',
      description: 'Documentation for Moment RESTful API endpoints with complete examples',
      contact: {
        name: 'API Support',
        email: 'support@momentapp.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API V1 Server',
      },
      {
        url: '/api',
        description: 'Legacy API Server (redirects to V1)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'object',
              example: {
                field: ['Validation error message'],
              },
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
              example: {},
            },
            meta: {
              type: 'object',
              example: {
                page: 1,
                limit: 10,
                total: 50,
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Unauthorized access',
              },
            },
          },
        },
        BadRequestError: {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Validation failed',
                errors: {
                  email: ['Email is required', 'Email format is invalid'],
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Resource not found',
              },
            },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Server error',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User operations',
      },
      {
        name: 'Transactions',
        description: 'Transaction operations',
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/models/*.js'
  ],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Custom CSS for swagger UI
const customCss = `
  .swagger-ui .topbar { 
    background-color: #24292e; 
  }
  .swagger-ui .topbar .download-url-wrapper .select-label select {
    border: 2px solid #6c6c6c;
  }
  .swagger-ui .info .title {
    color: #3b4151;
    font-size: 36px;
    font-weight: 700;
  }
  .swagger-ui .info .title small.version-stamp {
    background-color: #4CAF50;
  }
  .swagger-ui .info .base-url {
    font-size: 16px;
  }
  .swagger-ui .scheme-container {
    background-color: #f7f7f7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 20px 0;
    margin: 0 0 20px;
  }
  .swagger-ui .btn.authorize {
    background-color: #4CAF50;
    border-color: #4CAF50;
    color: #fff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  .swagger-ui .btn.authorize:hover {
    background-color: #45a049;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  .swagger-ui .opblock.opblock-get {
    border-color: #61affe;
    background: rgba(97, 175, 254, 0.1);
  }
  .swagger-ui .opblock.opblock-post {
    border-color: #49cc90;
    background: rgba(73, 204, 144, 0.1);
  }
  .swagger-ui .opblock.opblock-put {
    border-color: #fca130;
    background: rgba(252, 161, 48, 0.1);
  }
  .swagger-ui .opblock.opblock-delete {
    border-color: #f93e3e;
    background: rgba(249, 62, 62, 0.1);
  }
  .swagger-ui .opblock .opblock-summary-operation-id,
  .swagger-ui .opblock .opblock-summary-path,
  .swagger-ui .opblock .opblock-summary-path__deprecated {
    font-size: 16px;
  }
  .swagger-ui .opblock {
    margin: 0 0 15px;
    border-radius: 6px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  .swagger-ui .opblock-tag {
    font-size: 24px;
    font-weight: 600;
    margin: 30px 0 10px;
  }
  .swagger-ui .opblock .opblock-section-header {
    padding: 12px 20px;
  }
  .swagger-ui table {
    border-collapse: separate;
    border-spacing: 0;
    border-radius: 6px;
    overflow: hidden;
  }
  .swagger-ui table tbody tr td {
    padding: 12px 10px;
  }
  .swagger-ui .response-col_status {
    font-size: 14px;
    font-weight: 600;
  }
`;

module.exports = {
  swaggerUi,
  swaggerDocs,
  customCss,
}; 