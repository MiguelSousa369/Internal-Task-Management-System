import { z } from 'zod';

export const createCommentSchema = z.object({
  comentario: z.string().trim().min(1, 'Comentário não pode estar vazio')
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID inválido')
});

export const commentParamSchema = z.object({
  id: z.coerce.number().int().positive('ID inválido'),
  commentId: z.coerce.number().int().positive('ID inválido')
});
