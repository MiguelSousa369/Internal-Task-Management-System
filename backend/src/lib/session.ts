import jwt from 'jsonwebtoken';

// Sessões com renovação automática: o token dura SESSION_HOURS (24 por omissão) e, enquanto a app
// faz pedidos, o authGuard devolve um token novo no header X-Session-Token - quem está a usar a
// app nunca fica sem sessão; só expira ao fim de SESSION_HOURS sem nenhum pedido.

export const JWT_SECRET = process.env.JWT_SECRET || 'mudar_em_producao';
export const SESSION_HOURS = Number(process.env.SESSION_HOURS) || 24;
export const SESSION_HEADER = 'X-Session-Token';
// Só renova tokens com mais de 15 minutos, para não assinar um token novo a cada pedido.
const RENEW_AFTER_SECONDS = 15 * 60;

export interface SessionPayload {
  id: number;
  role: string;
  iat?: number;
}

export const signSession = (user: { id: number; role: string }) =>
  jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: `${SESSION_HOURS}h` });

export const needsRenewal = (payload: SessionPayload) =>
  !payload.iat || Date.now() / 1000 - payload.iat > RENEW_AFTER_SECONDS;
