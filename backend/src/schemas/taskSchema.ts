import { z } from 'zod';

export const createTaskSchema = z.object({
  descricao: z.string().optional(),
  cliente: z.string().min(1, 'Cliente é obrigatório'),
  contacto: z.string().optional(),
  prioridade: z.enum(['Normal', 'Urgente']).default('Normal'),
  tecnicoSolicitadoId: z.number().int().positive().optional()
});

export const updateTaskSchema = z.object({
  descricao: z.string().optional(),
  cliente: z.string().min(1).optional(),
  contacto: z.string().optional(),
  prioridade: z.enum(['Normal', 'Urgente']).optional(),
  tecnicoSolicitadoId: z.number().int().positive().nullable().optional()
});

export const prioritySchema = z.object({
  prioridade: z.enum(['Normal', 'Urgente'])
});

export const taskFiltersSchema = z.object({
  estado: z.enum(['Novo', 'EmTratamento', 'Concluido']).optional(),
  prioridade: z.enum(['Normal', 'Urgente']).optional(),
  emTratamentoPor: z.coerce.number().int().positive().optional(),
  search: z.string().optional()
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID inválido')
});
