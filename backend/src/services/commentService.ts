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
