import { Router } from 'express';
import { listByPostulacion, crearEntrevista, actualizarEntrevista } from '../controllers/entrevistas.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

export const entrevistasRouter = Router();

entrevistasRouter.get('/postulacion/:id', requireAuth, listByPostulacion);
entrevistasRouter.post('/', requireAuth, requireRole('rrhh', 'super_admin'), crearEntrevista);
entrevistasRouter.patch('/:id', requireAuth, requireRole('rrhh', 'super_admin'), actualizarEntrevista);
