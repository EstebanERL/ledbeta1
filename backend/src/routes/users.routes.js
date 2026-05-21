import { Router } from 'express';
import { listUsers, updateRole, createUser, deleteUser } from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

export const usersRouter = Router();

usersRouter.get('/', requireAuth, requireRole('super_admin'), listUsers);
usersRouter.post('/', requireAuth, requireRole('super_admin'), createUser);
usersRouter.patch('/:id/role', requireAuth, requireRole('super_admin'), updateRole);
usersRouter.delete('/:id', requireAuth, requireRole('super_admin'), deleteUser);
