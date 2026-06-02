import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authGuard';

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Permissão negada' });
      return;
    }
    next();
  };
};
