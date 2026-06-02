import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status || 500;
  const message = `${req.method} ${req.originalUrl} | ${err.message}`;

  if (statusCode >= 500) {
    logger.error(message);
  } else {
    logger.warn(message);
  }

  const response: any = {
    success: false,
    status: statusCode,
    error: err.message || 'Erro interno do servidor.',
    timestamp: new Date().toISOString()
  };

  if (err.zodErrors) {
    response.fields = err.zodErrors.map((issue: any) => issue.path.join('.') || issue.message);
  }

  res.status(statusCode).json(response);
};
