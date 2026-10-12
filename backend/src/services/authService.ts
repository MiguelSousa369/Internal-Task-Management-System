import bcrypt from 'bcryptjs';
import * as userService from './userService';
import { signSession } from '../lib/session';

export const login = async (username: string, password: string) => {
  const user = await userService.findByUsername(username);

  if (!user) {
    const err: any = new Error('Credenciais inválidas');
    err.status = 401;
    throw err;
  }

  if (!user.ativo) {
    const err: any = new Error('Conta desativada');
    err.status = 403;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err: any = new Error('Credenciais inválidas');
    err.status = 401;
    throw err;
  }

  const token = signSession(user);

  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};
