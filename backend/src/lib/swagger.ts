import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Gestão de Tarefas — API',
      version: '1.0.0',
      description: 'API interna para gestão e acompanhamento de pedidos de suporte',
      contact: {
        name: 'Suporte Interno'
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de Desenvolvimento'
      }
    ]
  },
  apis: ['./src/docs/*.yaml']
};

export const specs = swaggerJSDoc(options);
