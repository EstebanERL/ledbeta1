import { Router } from 'express';
import {
  listTests, createTest, asignarTest, listAsignacionesPostulacion,
  misAsignaciones, responderAsignacion, calificarAsignacion,
} from '../controllers/tests.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

export const testsRouter = Router();

testsRouter.get('/', requireAuth, listTests);
testsRouter.post('/', requireAuth, requireRole('evaluador', 'rrhh', 'super_admin'), createTest);

export const asignacionesRouter = Router();

asignacionesRouter.post('/', requireAuth, requireRole('evaluador', 'rrhh', 'super_admin'), asignarTest);
asignacionesRouter.get('/me', requireAuth, requireRole('candidato'), misAsignaciones);
asignacionesRouter.get('/postulacion/:id', requireAuth, requireRole('evaluador', 'rrhh', 'super_admin'), listAsignacionesPostulacion);
asignacionesRouter.post('/:id/responder', requireAuth, requireRole('candidato'), responderAsignacion);
asignacionesRouter.patch('/:id/calificar', requireAuth, requireRole('evaluador', 'rrhh', 'super_admin'), calificarAsignacion);
