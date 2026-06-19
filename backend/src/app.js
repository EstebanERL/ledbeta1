import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// routes
import uploadRoutes from "./routes/upload.routes.js";
import { authRouter } from './routes/auth.routes.js';
import { vacantesRouter } from './routes/vacantes.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { postulacionesRouter } from './routes/postulaciones.routes.js';
import { testsRouter, asignacionesRouter } from './routes/tests.routes.js';
import { profileTestsRouter } from './routes/profileTests.routes.js';
import { entrevistasRouter } from './routes/entrevistas.routes.js';

// middleware
import { errorHandler, notFound } from './middleware/error.js';

const app = express();

// __dirname (ESM fix)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.set('trust proxy', 1);

// security
app.use(helmet());

app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim()),
    credentials: true,
  }),
);

// body
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// logs
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// upload routes (CLOUDINARY)
app.use("/api/upload", uploadRoutes);

// static uploads (local fallback si usas archivos locales)
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  }
}));

// rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

// routes
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/users', usersRouter);
app.use('/api/vacantes', vacantesRouter);
app.use('/api/postulaciones', postulacionesRouter);
app.use('/api/tests', testsRouter);
app.use('/api/test-asignaciones', asignacionesRouter);
app.use('/api/profile-tests', profileTestsRouter);
app.use('/api/entrevistas', entrevistasRouter);

// errors
app.use(notFound);
app.use(errorHandler);

export { app };