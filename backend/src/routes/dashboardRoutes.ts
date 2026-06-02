import { Router } from 'express';
import { getDashboard, getStats } from '../controllers/dashboardController';
import { authGuard } from '../middlewares/authGuard';
import { requireRole } from '../middlewares/roleGuard';

const router = Router();

const adminOnly = [authGuard, requireRole(['Admin'])];

router.get('/dashboard', ...adminOnly, getDashboard);
router.get('/stats', ...adminOnly, getStats);

export default router;
