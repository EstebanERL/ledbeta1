import { Router } from 'express';
import {
  listUsers, updateRole, createUser, deleteUser, toggleActive,
  getMe, updateMe, uploadAvatar, uploadCv, getById,
} from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { upload } from '../middleware/upload.js';

export const usersRouter = Router();

// Perfil propio (cualquier usuario autenticado)
usersRouter.get('/me',          requireAuth, getMe);
usersRouter.patch('/me',        requireAuth, updateMe);
usersRouter.post('/me/avatar',  requireAuth, upload.single('avatar'), uploadAvatar);
usersRouter.post('/me/cv',      requireAuth, upload.single('cv'), uploadCv);

// Lectura de perfil por RRHH / Evaluador / Admin
usersRouter.get('/:id', requireAuth, requireRole('super_admin', 'rrhh', 'evaluador'), getById);

// Administración (super_admin)
usersRouter.get('/',                requireAuth, requireRole('super_admin'), listUsers);
usersRouter.post('/',               requireAuth, requireRole('super_admin'), createUser);
usersRouter.patch('/:id/role',      requireAuth, requireRole('super_admin'), updateRole);
usersRouter.patch('/:id/active',    requireAuth, requireRole('super_admin'), toggleActive);
usersRouter.delete('/:id',          requireAuth, requireRole('super_admin'), deleteUser);
