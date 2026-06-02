import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { loginSchema } from '../schemas/authSchema';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    const err: any = new Error('Dados inválidos');
    err.status = 400;
    err.zodErrors = result.error.issues;
    return next(err);
  }

  try {
    const { email, password } = result.data;
    const authResult = await authService.login(email, password);
    res.json(authResult);
  } catch (error) {
    next(error);
  }
};
