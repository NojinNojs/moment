const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Moment API Documentation',
      version: '1.0.0',
      description: 'Documentation for Moment API endpoints',
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
        url: '/api',
        description: 'Development server',
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
    font-weight: 700;
  }
  .swagger-ui .scheme-container {
    background-color: #f7f7f7;
  }
  .swagger-ui .btn.authorize {
    background-color: #4CAF50;
    border-color: #4CAF50;
    color: #fff;
  }
  .swagger-ui .btn.authorize svg {
    fill: #fff;
  }
`;

module.exports = {
  swaggerUi,
  swaggerDocs,
  customCss,
}; 