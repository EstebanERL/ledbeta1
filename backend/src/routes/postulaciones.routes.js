import { Router } from 'express';
import {
  applyToVacante, myApplications, listForVacante, updateEstado, listAll,
} from '../controllers/postulaciones.controller.js';
import { listEventos, crearNotaEvento } from '../controllers/eventos.controller.js';
import { listMensajes, crearMensaje } from '../controllers/mensajes.controller.js';
import { getCompatibilidad, analizarPostulacion } from '../controllers/compatibilidad.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import upload from '../config/multer.js';
export const postulacionesRouter = Router();

postulacionesRouter.post('/', requireAuth, requireRole('candidato'), upload.single('cv'), applyToVacante);
postulacionesRouter.get('/me', requireAuth, requireRole('candidato'), myApplications);
postulacionesRouter.get('/', requireAuth, requireRole('rrhh', 'super_admin', 'evaluador'), listAll);
postulacionesRouter.get('/vacante/:vacanteId', requireAuth, requireRole('rrhh', 'super_admin', 'evaluador'), listForVacante);
postulacionesRouter.patch('/:id', requireAuth, requireRole('rrhh', 'super_admin', 'evaluador'), updateEstado);

// Timeline (eventos)
postulacionesRouter.get('/:id/eventos', requireAuth, listEventos);
postulacionesRouter.post('/:id/eventos', requireAuth, requireRole('rrhh', 'super_admin', 'evaluador'), crearNotaEvento);

// Chat por postulación
postulacionesRouter.get('/:id/mensajes', requireAuth, listMensajes);
postulacionesRouter.post('/:id/mensajes', requireAuth, crearMensaje);

// Compatibilidad IA (solo RRHH / super_admin)
postulacionesRouter.get('/:id/compatibilidad', requireAuth, requireRole('rrhh', 'super_admin'), getCompatibilidad);
postulacionesRouter.post('/:id/compatibilidad', requireAuth, requireRole('rrhh', 'super_admin'), analizarPostulacion);
