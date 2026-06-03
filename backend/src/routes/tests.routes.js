import { Router } from 'express';
import {
  listTests, listTestsBiblioteca, createTest, updateTest, toggleTestActive, duplicateTest,
  deleteTest, testStats,
  asignarTest, listAsignacionesPostulacion,
  misAsignaciones, responderAsignacion, calificarAsignacion, generarTestIA,
} from '../controllers/tests.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

export const testsRouter = Router();

testsRouter.get('/', requireAuth, listTests);
testsRouter.get('/biblioteca', requireAuth, requireRole('evaluador', 'rrhh', 'super_admin'), listTestsBiblioteca);
testsRouter.post('/', requireAuth, requireRole('evaluador', 'rrhh', 'super_admin'), createTest);
testsRouter.post('/generate-ai', requireAuth, requireRole('evaluador', 'rrhh', 'super_admin'), generarTestIA);
testsRouter.patch('/:id', requireAuth, requireRole('evaluador', 'rrhh', 'super_admin'), updateTest);
testsRouter.patch('/:id/active', requireAuth, requireRole('evaluador', 'rrhh', 'super_admin'), toggleTestActive);
testsRouter.post('/:id/duplicate', requireAuth, requireRole('evaluador', 'rrhh', 'super_admin'), duplicateTest);

export const asignacionesRouter = Router();

asignacionesRouter.post('/', requireAuth, requireRole('evaluador', 'rrhh', 'super_admin'), asignarTest);
asignacionesRouter.get('/me', requireAuth, requireRole('candidato'), misAsignaciones);
asignacionesRouter.get('/postulacion/:id', requireAuth, requireRole('evaluador', 'rrhh', 'super_admin'), listAsignacionesPostulacion);
asignacionesRouter.post('/:id/responder', requireAuth, requireRole('candidato'), responderAsignacion);
asignacionesRouter.patch('/:id/calificar', requireAuth, requireRole('evaluador', 'rrhh', 'super_admin'), calificarAsignacion);
