import { Router } from 'express';
import {
  getAll,
  getById,
  create,
  update,
  start,
  release,
  updatePriority,
  complete,
  reopen,
  remove
} from '../controllers/taskController';
import { authGuard } from '../middlewares/authGuard';
import { requireRole } from '../middlewares/roleGuard';

const router = Router();

const allRoles = [authGuard, requireRole(['Admin', 'Tecnico', 'Rececionista'])];
const tecnicoOrAdmin = [authGuard, requireRole(['Admin', 'Tecnico'])];
const anyAuthenticated = [authGuard, requireRole(['Admin', 'Tecnico', 'Rececionista'])];
const adminOnly = [authGuard, requireRole(['Admin'])];

router.get('/', ...allRoles, getAll);
router.get('/:id', ...allRoles, getById);
router.post('/', ...allRoles, create);
router.put('/:id', ...tecnicoOrAdmin, update);
router.put('/:id/start', ...tecnicoOrAdmin, start);
router.put('/:id/release', ...tecnicoOrAdmin, release);
router.put('/:id/priority', ...anyAuthenticated, updatePriority);
router.put('/:id/complete', ...tecnicoOrAdmin, complete);
router.put('/:id/reopen', ...tecnicoOrAdmin, reopen);
router.delete('/:id', ...adminOnly, remove);

export default router;
