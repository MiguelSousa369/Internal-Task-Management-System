import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userService from './userService';

const JWT_SECRET = process.env.JWT_SECRET || 'mudar_em_producao';

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

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};
