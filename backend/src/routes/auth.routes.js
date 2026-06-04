import { Router } from 'express';
import {
  register, login, me,
  forgotPassword, resetPassword, verifyResetToken,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', requireAuth, me);

// Recuperación de contraseña
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
authRouter.get('/verify-reset-token', verifyResetToken);
