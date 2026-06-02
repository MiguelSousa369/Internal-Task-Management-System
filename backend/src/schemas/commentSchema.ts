import { z } from 'zod';

export const createCommentSchema = z.object({
  comentario: z.string().min(1, 'Comentário não pode estar vazio')
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID inválido')
});
