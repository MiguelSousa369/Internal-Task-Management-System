import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

const userSelect = {
  id: true,
  nome: true,
  username: true,
  role: true,
  ativo: true,
  criadoEm: true
};

export const findAll = async () => {
  return prisma.user.findMany({ select: userSelect, orderBy: { nome: 'asc' } });
};

export const findTecnicos = async () => {
  return prisma.user.findMany({
    where: { role: 'Tecnico', ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  });
};

export const findById = async (id: number) => {
  return prisma.user.findUnique({ where: { id }, select: userSelect });
};

export const findByUsername = async (username: string) => {
  return prisma.user.findUnique({ where: { username } });
};

export const create = async (data: {
  nome: string;
  username: string;
  password: string;
  role: Role;
}) => {
  const exists = await prisma.user.findUnique({ where: { username: data.username } });
  if (exists) {
    const err: any = new Error('Username já está em uso');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: { nome: data.nome, username: data.username, passwordHash, role: data.role },
    select: userSelect
  });
};

export const update = async (id: number, data: {
  nome?: string;
  username?: string;
  password?: string;
  role?: Role;
  ativo?: boolean;
}) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err: any = new Error('Utilizador não encontrado');
    err.status = 404;
    throw err;
  }

  if (data.username && data.username !== user.username) {
    const exists = await prisma.user.findUnique({ where: { username: data.username } });
    if (exists) {
      const err: any = new Error('Username já está em uso');
      err.status = 409;
      throw err;
    }
  }

  const updateData: any = {};
  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.username !== undefined) updateData.username = data.username;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.ativo !== undefined) updateData.ativo = data.ativo;
  if (data.password !== undefined) updateData.passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.user.update({ where: { id }, data: updateData, select: userSelect });
};

export const remove = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err: any = new Error('Utilizador não encontrado');
    err.status = 404;
    throw err;
  }
  return prisma.user.update({ where: { id }, data: { ativo: false }, select: userSelect });
};
