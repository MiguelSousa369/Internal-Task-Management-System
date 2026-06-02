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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

app.use(cors({
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiados pedidos a partir deste IP. Tente novamente mais tarde.' }
});
app.use(limiter);

app.use(express.json());
app.use(requestLogger);

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

app.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`));
