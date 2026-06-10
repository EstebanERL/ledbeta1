import { Router } from 'express';
import { listPublic, listAdmin, getOne, create, update, remove, recomendadas } from '../controllers/vacantes.controller.js';
import { recomendadasIA } from '../controllers/compatibilidad.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

export const vacantesRouter = Router();

// Público
vacantesRouter.get('/public', listPublic);

// Recomendaciones para el candidato autenticado (DEBE ir antes de /:id)
vacantesRouter.get('/recomendadas', requireAuth, requireRole('candidato'), recomendadas);
vacantesRouter.get('/recomendadas-ia', requireAuth, requireRole('candidato'), recomendadasIA);

// Admin (RRHH / super_admin)
vacantesRouter.get('/', requireAuth, requireRole('rrhh', 'super_admin'), listAdmin);
vacantesRouter.post('/', requireAuth, requireRole('rrhh', 'super_admin'), create);
vacantesRouter.patch('/:id', requireAuth, requireRole('rrhh', 'super_admin'), update);
vacantesRouter.delete('/:id', requireAuth, requireRole('rrhh', 'super_admin'), remove);

// Detalle público (al final, captura cualquier UUID restante)
vacantesRouter.get('/:id', getOne);
