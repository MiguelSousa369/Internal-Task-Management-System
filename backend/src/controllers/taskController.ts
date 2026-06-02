import { Response, NextFunction } from 'express';
import * as taskService from '../services/taskService';
import {
  createTaskSchema,
  updateTaskSchema,
  prioritySchema,
  taskFiltersSchema,
  idParamSchema
} from '../schemas/taskSchema';
import { AuthenticatedRequest } from '../middlewares/authGuard';
import { Prioridade } from '@prisma/client';

export const getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const result = taskFiltersSchema.safeParse(req.query);
  if (!result.success) {
    const err: any = new Error('Filtros inválidos');
    err.status = 400;
    err.zodErrors = result.error.issues;
    return next(err);
  }

  try {
    const tasks = await taskService.findAll({
      estado: result.data.estado,
      prioridade: result.data.prioridade,
      emTratamentoPorId: result.data.emTratamentoPor,
      search: result.data.search
    });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const paramResult = idParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    const err: any = new Error('ID inválido');
    err.status = 400;
    return next(err);
  }

  try {
    const task = await taskService.findById(paramResult.data.id);
    if (!task) {
      const err: any = new Error('Tarefa não encontrada');
      err.status = 404;
      return next(err);
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const result = createTaskSchema.safeParse(req.body);
  if (!result.success) {
    const err: any = new Error('Dados inválidos');
    err.status = 400;
    err.zodErrors = result.error.issues;
    return next(err);
  }

  try {
    const task = await taskService.create({
      ...result.data,
      criadoPorId: req.user!.id
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const paramResult = idParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    const err: any = new Error('ID inválido');
    err.status = 400;
    return next(err);
  }

  const bodyResult = updateTaskSchema.safeParse(req.body);
  if (!bodyResult.success) {
    const err: any = new Error('Dados inválidos');
    err.status = 400;
    err.zodErrors = bodyResult.error.issues;
    return next(err);
  }

  try {
    const task = await taskService.update(paramResult.data.id, bodyResult.data);
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const start = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const paramResult = idParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    const err: any = new Error('ID inválido');
    err.status = 400;
    return next(err);
  }

  try {
    const task = await taskService.start(paramResult.data.id, req.user!.id);
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const release = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const paramResult = idParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    const err: any = new Error('ID inválido');
    err.status = 400;
    return next(err);
  }

  try {
    const task = await taskService.release(paramResult.data.id);
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const updatePriority = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const paramResult = idParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    const err: any = new Error('ID inválido');
    err.status = 400;
    return next(err);
  }

  const bodyResult = prioritySchema.safeParse(req.body);
  if (!bodyResult.success) {
    const err: any = new Error('Dados inválidos');
    err.status = 400;
    err.zodErrors = bodyResult.error.issues;
    return next(err);
  }

  try {
    const task = await taskService.updatePriority(
      paramResult.data.id,
      bodyResult.data.prioridade as Prioridade
    );
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const complete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const paramResult = idParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    const err: any = new Error('ID inválido');
    err.status = 400;
    return next(err);
  }

  try {
    const task = await taskService.complete(paramResult.data.id);
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const reopen = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const paramResult = idParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    const err: any = new Error('ID inválido');
    err.status = 400;
    return next(err);
  }

  try {
    const task = await taskService.reopen(paramResult.data.id);
    res.json(task);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const paramResult = idParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    const err: any = new Error('ID inválido');
    err.status = 400;
    return next(err);
  }

  try {
    await taskService.remove(paramResult.data.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
