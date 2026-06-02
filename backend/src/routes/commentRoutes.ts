import { Router } from 'express';
import { getByTask, create } from '../controllers/commentController';
import { authGuard } from '../middlewares/authGuard';
import { requireRole } from '../middlewares/roleGuard';

const router = Router({ mergeParams: true });

const allRoles = [authGuard, requireRole(['Admin', 'Tecnico', 'Rececionista'])];

router.get('/', ...allRoles, getByTask);
router.post('/', ...allRoles, create);

export default router;
