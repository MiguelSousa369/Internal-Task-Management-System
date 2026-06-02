import { z } from 'zod';

export const createUserSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password deve ter pelo menos 6 caracteres'),
  role: z.enum(['Admin', 'Tecnico', 'Rececionista'])
});

export const updateUserSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['Admin', 'Tecnico', 'Rececionista']).optional(),
  ativo: z.boolean().optional()
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID inválido')
});
