import { Router } from 'express';
import { listPublic, listAdmin, getOne, create, update, remove } from '../controllers/vacantes.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

export const vacantesRouter = Router();

// Public
vacantesRouter.get('/public', listPublic);
vacantesRouter.get('/:id', getOne);

// Admin (RRHH / super_admin)
vacantesRouter.get('/', requireAuth, requireRole('rrhh', 'super_admin'), listAdmin);
vacantesRouter.post('/', requireAuth, requireRole('rrhh', 'super_admin'), create);
vacantesRouter.patch('/:id', requireAuth, requireRole('rrhh', 'super_admin'), update);
vacantesRouter.delete('/:id', requireAuth, requireRole('rrhh', 'super_admin'), remove);
