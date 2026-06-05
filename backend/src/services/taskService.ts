import { prisma } from '../lib/prisma';
import { Estado, Prioridade, Prisma } from '@prisma/client';

const taskWithRelations = {
  id: true,
  descricao: true,
  cliente: true,
  contacto: true,
  prioridade: true,
  estado: true,
  dataCriacao: true,
  dataConclusao: true,
  updatedAt: true,
  criadoPor: { select: { id: true, nome: true } },
  tecnicoSolicitado: { select: { id: true, nome: true } },
  emTratamentoPor: { select: { id: true, nome: true } }
};

interface TaskFilters {
  estado?: Estado;
  prioridade?: Prioridade;
  emTratamentoPorId?: number;
  search?: string;
}

export const findAll = async (filters: TaskFilters) => {
  const where: Prisma.TaskWhereInput = {};

  if (filters.estado) where.estado = filters.estado;
  if (filters.prioridade) where.prioridade = filters.prioridade;
  if (filters.emTratamentoPorId) where.emTratamentoPorId = filters.emTratamentoPorId;
  if (filters.search) {
    where.OR = [
      { descricao: { contains: filters.search, mode: 'insensitive' } },
      { cliente: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  return prisma.task.findMany({
    where,
    select: taskWithRelations,
    orderBy: [{ prioridade: 'desc' }, { dataCriacao: 'asc' }]
  });
};

export const findById = async (id: number) => {
  return prisma.task.findUnique({
    where: { id },
    include: {
      criadoPor: { select: { id: true, nome: true } },
      tecnicoSolicitado: { select: { id: true, nome: true } },
      emTratamentoPor: { select: { id: true, nome: true } },
      comentarios: {
        include: { user: { select: { id: true, nome: true } } },
        orderBy: { dataCriacao: 'asc' }
      }
    }
  });
};

export const create = async (data: {
  descricao?: string;
  cliente: string;
  contacto?: string;
  prioridade: Prioridade;
  tecnicoSolicitadoId?: number;
  criadoPorId: number;
}) => {
  return prisma.task.create({
    data: {
      descricao: data.descricao,
      cliente: data.cliente,
      contacto: data.contacto,
      prioridade: data.prioridade,
      tecnicoSolicitadoId: data.tecnicoSolicitadoId,
      criadoPorId: data.criadoPorId
    },
    select: taskWithRelations
  });
};

export const update = async (id: number, data: {
  descricao?: string;
  cliente?: string;
  contacto?: string;
  prioridade?: Prioridade;
  tecnicoSolicitadoId?: number | null;
}) => {
  await requireTask(id);
  return prisma.task.update({ where: { id }, data, select: taskWithRelations });
};

export const start = async (id: number, userId: number) => {
  const task = await requireTask(id);
  if (task.estado === 'Concluido') {
    const err: any = new Error('Não é possível assumir uma tarefa concluída');
    err.status = 400;
    throw err;
  }
  return prisma.task.update({
    where: { id },
    data: { emTratamentoPorId: userId, estado: 'EmTratamento' },
    select: taskWithRelations
  });
};

export const release = async (id: number) => {
  const task = await requireTask(id);
  if (task.estado === 'Concluido') {
    const err: any = new Error('Não é possível libertar uma tarefa concluída');
    err.status = 400;
    throw err;
  }
  return prisma.task.update({
    where: { id },
    data: { emTratamentoPorId: null, estado: 'Novo' },
    select: taskWithRelations
  });
};

export const updatePriority = async (id: number, prioridade: Prioridade) => {
  await requireTask(id);
  return prisma.task.update({ where: { id }, data: { prioridade }, select: taskWithRelations });
};

export const complete = async (id: number) => {
  const task = await requireTask(id);
  if (task.estado === 'Concluido') {
    const err: any = new Error('Tarefa já está concluída');
    err.status = 400;
    throw err;
  }
  return prisma.task.update({
    where: { id },
    data: { estado: 'Concluido', dataConclusao: new Date() },
    select: taskWithRelations
  });
};

export const reopen = async (id: number) => {
  const task = await requireTask(id);
  if (task.estado !== 'Concluido') {
    const err: any = new Error('Só é possível reabrir tarefas concluídas');
    err.status = 400;
    throw err;
  }
  return prisma.task.update({
    where: { id },
    data: { estado: 'Novo', dataConclusao: null, emTratamentoPorId: null },
    select: taskWithRelations
  });
};

export const remove = async (id: number) => {
  await requireTask(id);
  return prisma.task.delete({ where: { id } });
};

async function requireTask(id: number) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    const err: any = new Error('Tarefa não encontrada');
    err.status = 404;
    throw err;
  }
  return task;
}
