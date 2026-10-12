import { Router } from 'express';
import { getDashboard, getStats } from '../controllers/dashboardController';
import { authGuard } from '../middlewares/authGuard';
import { requireRole } from '../middlewares/roleGuard';

const router = Router();

const allRoles  = [authGuard, requireRole(['Admin', 'Tecnico', 'Rececionista'])];
// O perfil TV (ecrã na parede) vê os contadores.
const viewRoles = [authGuard, requireRole(['Admin', 'Tecnico', 'Rececionista', 'TV'])];

router.get('/dashboard', ...viewRoles, getDashboard);
router.get('/stats',     ...allRoles, getStats);

export default router;
