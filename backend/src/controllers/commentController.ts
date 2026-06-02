import { Response, NextFunction } from 'express';
import * as commentService from '../services/commentService';
import { createCommentSchema, idParamSchema } from '../schemas/commentSchema';
import { AuthenticatedRequest } from '../middlewares/authGuard';

export const getByTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const paramResult = idParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    const err: any = new Error('ID inválido');
    err.status = 400;
    return next(err);
  }

  try {
    const comments = await commentService.findByTask(paramResult.data.id);
    res.json(comments);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const paramResult = idParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    const err: any = new Error('ID inválido');
    err.status = 400;
    return next(err);
  }

  const bodyResult = createCommentSchema.safeParse(req.body);
  if (!bodyResult.success) {
    const err: any = new Error('Dados inválidos');
    err.status = 400;
    err.zodErrors = bodyResult.error.issues;
    return next(err);
  }

  try {
    const comment = await commentService.create(
      paramResult.data.id,
      req.user!.id,
      bodyResult.data.comentario
    );
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};
