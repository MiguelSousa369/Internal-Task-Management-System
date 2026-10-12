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

const findInTask = async (taskId: number, commentId: number) => {
  const comment = await prisma.taskComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.taskId !== taskId) {
    const err: any = new Error('Comentário não encontrado');
    err.status = 404;
    throw err;
  }
  return comment;
};

// Só o autor pode editar o comentário.
export const update = async (taskId: number, commentId: number, userId: number, comentario: string) => {
  const comment = await findInTask(taskId, commentId);

  if (userId !== comment.userId) {
    const err: any = new Error('Só o autor pode editar este comentário');
    err.status = 403;
    throw err;
  }

  return prisma.taskComment.update({
    where: { id: commentId },
    data: { comentario, editadoEm: new Date() },
    include: { user: { select: { id: true, nome: true } } }
  });
};

// Só o autor do comentário ou um Admin o podem apagar.
export const remove = async (taskId: number, commentId: number, userId: number, userRole: string) => {
  const comment = await findInTask(taskId, commentId);

  if (userRole !== 'Admin' && userId !== comment.userId) {
    const err: any = new Error('Sem permissão para apagar este comentário');
    err.status = 403;
    throw err;
  }

  await prisma.taskComment.delete({ where: { id: commentId } });
};
