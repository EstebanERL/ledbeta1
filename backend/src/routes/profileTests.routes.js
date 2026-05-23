import { Router } from 'express';
import { submitProfileTest, getMyProfileTest, getUserProfileTest } from '../controllers/profileTests.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

export const profileTestsRouter = Router();

profileTestsRouter.post('/', requireAuth, requireRole('candidato'), submitProfileTest);
profileTestsRouter.get('/me', requireAuth, getMyProfileTest);
profileTestsRouter.get('/user/:userId', requireAuth, requireRole('rrhh', 'evaluador', 'super_admin'), getUserProfileTest);
