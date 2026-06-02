import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { createUserSchema, updateUserSchema, idParamSchema } from '../schemas/userSchema';
import { Role } from '@prisma/client';

export const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userService.findAll();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  const paramResult = idParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    const err: any = new Error('ID inválido');
    err.status = 400;
    return next(err);
  }

  try {
    const user = await userService.findById(paramResult.data.id);
    if (!user) {
      const err: any = new Error('Utilizador não encontrado');
      err.status = 404;
      return next(err);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    const err: any = new Error('Dados inválidos');
    err.status = 400;
    err.zodErrors = result.error.issues;
    return next(err);
  }

  try {
    const user = await userService.create({
      ...result.data,
      role: result.data.role as Role
    });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  const paramResult = idParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    const err: any = new Error('ID inválido');
    err.status = 400;
    return next(err);
  }

  const bodyResult = updateUserSchema.safeParse(req.body);
  if (!bodyResult.success) {
    const err: any = new Error('Dados inválidos');
    err.status = 400;
    err.zodErrors = bodyResult.error.issues;
    return next(err);
  }

  try {
    const user = await userService.update(paramResult.data.id, {
      ...bodyResult.data,
      role: bodyResult.data.role as Role | undefined
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  const paramResult = idParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    const err: any = new Error('ID inválido');
    err.status = 400;
    return next(err);
  }

  try {
    await userService.remove(paramResult.data.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
