import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { JWT_SECRET, SESSION_HEADER, SessionPayload, needsRenewal, signSession } from '../lib/session';

export interface AuthenticatedRequest extends Request {
  user?: { id: number; role: string };
}

export const authGuard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  const token = authHeader.split(' ')[1];
  let decoded: SessionPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    res.status(401).json({ error: 'Sessão expirada' });
    return;
  }

  try {
    // O utilizador tem de continuar a existir e ativo: desativar alguém corta-lhe a sessão logo.
    // O perfil vem da base de dados, por isso mudar o perfil também tem efeito imediato.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, ativo: true }
    });
    if (!user || !user.ativo) {
      res.status(401).json({ error: 'Sessão expirada' });
      return;
    }

    req.user = { id: user.id, role: user.role };
    if (needsRenewal(decoded)) res.setHeader(SESSION_HEADER, signSession(user));
    next();
  } catch (error) {
    next(error);
  }
};
