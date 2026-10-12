import { prisma } from '../lib/prisma';

export const findByTask = async (taskId: number) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    const err: any = new Error('Tarefa não encontrada');
    err.status = 404;
    throw err;
  }
  return prisma.taskComment.findMany({
    where: { taskId },
    include: { user: { select: { id: true, nome: true } } },
    orderBy: { dataCriacao: 'asc' }
  });
};

export const create = async (taskId: number, userId: number, comentario: string) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    const err: any = new Error('Tarefa não encontrada');
    err.status = 404;
    throw err;
  }
  return prisma.taskComment.create({
    data: { taskId, userId, comentario },
    include: { user: { select: { id: true, nome: true } } }
  });
};

// Só o autor do comentário ou um Admin o podem apagar.
export const remove = async (taskId: number, commentId: number, userId: number, userRole: string) => {
  const comment = await prisma.taskComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.taskId !== taskId) {
    const err: any = new Error('Comentário não encontrado');
    err.status = 404;
    throw err;
  }

  if (userRole !== 'Admin' && userId !== comment.userId) {
    const err: any = new Error('Sem permissão para apagar este comentário');
    err.status = 403;
    throw err;
  }

  await prisma.taskComment.delete({ where: { id: commentId } });
};
