import 'dotenv/config';

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { specs } from './lib/swagger';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import commentRoutes from './routes/commentRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/logger';
import { logger } from './utils/logger';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  logger.error('JWT_SECRET não definido — obrigatório em produção.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Em produção o Caddy está à frente: o IP do cliente vem do X-Forwarded-For (rate limit).
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

app.use(helmet());

// Em produção o frontend é servido pelo mesmo endereço (Caddy) e em desenvolvimento o Vite faz
// proxy de /api, por isso o CORS só é preciso se alguém aceder à API a partir de outra origem.
app.use(cors({
  origin: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 2000,
  message: { error: 'Demasiados pedidos a partir deste IP. Tente novamente mais tarde.' }
});
app.use(limiter);

// Tentativas de login falhadas por IP (as bem-sucedidas não contam).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 20,
  skipSuccessfulRequests: true,
  message: { error: 'Demasiadas tentativas de login. Tente novamente daqui a 15 minutos.' }
});

app.use(express.json());
app.use(requestLogger);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tasks/:id/comments', commentRoutes);
app.use('/api', dashboardRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use((_req, _res, next) => {
  const err: any = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(errorHandler);

export default app;

app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`Server running on http://0.0.0.0:${PORT}`);
});
