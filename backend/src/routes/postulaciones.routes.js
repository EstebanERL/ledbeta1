import { Router } from 'express';
import {
  applyToVacante, myApplications, listForVacante, updateEstado, listAll,
} from '../controllers/postulaciones.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { upload } from '../middleware/upload.js';

export const postulacionesRouter = Router();

postulacionesRouter.post('/', requireAuth, requireRole('candidato'), upload.single('cv'), applyToVacante);
postulacionesRouter.get('/me', requireAuth, requireRole('candidato'), myApplications);
postulacionesRouter.get('/', requireAuth, requireRole('rrhh', 'super_admin', 'evaluador'), listAll);
postulacionesRouter.get('/vacante/:vacanteId', requireAuth, requireRole('rrhh', 'super_admin', 'evaluador'), listForVacante);
postulacionesRouter.patch('/:id', requireAuth, requireRole('rrhh', 'super_admin', 'evaluador'), updateEstado);
