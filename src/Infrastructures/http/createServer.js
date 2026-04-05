import express from 'express';
import ClientError from '../../Commons/exceptions/ClientError.js';
import DomainErrorTranslator from '../../Commons/exceptions/DomainErrorTranslator.js';
import users from '../../Interfaces/http/api/users/index.js';
import authentications from '../../Interfaces/http/api/authentications/index.js';
import threads from '../../Interfaces/http/api/threads/index.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'accessToken',
  'refreshToken',
  'authorization',
]);

const sanitizeForLog = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLog(item));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, val]) => {
      if (SENSITIVE_KEYS.has(key)) {
        acc[key] = '[REDACTED]';
      } else {
        acc[key] = sanitizeForLog(val);
      }

      return acc;
    }, {});
  }

  return value;
};

const createServer = async (container) => {
  const app = express();

  // Middleware for parsing JSON
  app.use(express.json());

  // Root endpoint - Say Hello World
  app.get('/', (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Hello World, Welcome to Forum API',
    });
  });

  // Register routes
  app.use('/users', users(container));
  app.use('/authentications', authentications(container));
  app.use('/threads', threads(container));

  // Global error handler
  app.use((error, req, res, next) => {
    // bila response tersebut error, tangani sesuai kebutuhan
    const translatedError = DomainErrorTranslator.translate(error);

    // penanganan client error secara internal.
    if (translatedError instanceof ClientError) {
      return res.status(translatedError.statusCode).json({
        status: 'fail',
        message: translatedError.message,
      });
    }

    const requestContext = {
      method: req.method,
      path: req.originalUrl,
      params: sanitizeForLog(req.params),
      query: sanitizeForLog(req.query),
      body: sanitizeForLog(req.body),
      userId: req.auth?.id,
    };

    console.error('[INTERNAL_SERVER_ERROR]', {
      request: requestContext,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });

    // penanganan server error sesuai kebutuhan
    return res.status(500).json({
      status: 'error',
      message: 'terjadi kegagalan pada server kami',
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      status: 'fail',
      message: 'Route not found',
    });
  });

  return app;
};

export default createServer;
