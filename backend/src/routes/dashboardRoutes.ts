import { Router } from 'express';
import { getDashboard, getStats } from '../controllers/dashboardController';
import { authGuard } from '../middlewares/authGuard';
import { requireRole } from '../middlewares/roleGuard';

const router = Router();

const allRoles  = [authGuard, requireRole(['Admin', 'Tecnico', 'Rececionista'])];
const adminOnly = [authGuard, requireRole(['Admin'])];

router.get('/dashboard', ...allRoles, getDashboard);
router.get('/stats',     ...allRoles, getStats);

export default router;
