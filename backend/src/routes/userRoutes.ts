import { Router } from 'express';
import { getAll, getById, create, update, remove, getTecnicos } from '../controllers/userController';
import { authGuard } from '../middlewares/authGuard';
import { requireRole } from '../middlewares/roleGuard';

const router = Router();

const adminOnly = [authGuard, requireRole(['Admin'])];

router.get('/tecnicos', authGuard, getTecnicos);
router.get('/', ...adminOnly, getAll);
router.get('/:id', ...adminOnly, getById);
router.post('/', ...adminOnly, create);
router.put('/:id', ...adminOnly, update);
router.delete('/:id', ...adminOnly, remove);

export default router;
