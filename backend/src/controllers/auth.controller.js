import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { query, queryOne } from '../config/db.js';
import { signToken } from '../utils/jwt.js';
import { sendMail, tplWelcome, tplPasswordReset } from '../services/email.service.js';

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  fullName: z.string().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotSchema = z.object({ email: z.string().email().max(255) });
const resetSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(72),
});

function mapUser(r) {
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    role: r.role,
    avatarUrl: r.avatar_url,
  };
}

export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await queryOne('SELECT id FROM users WHERE email = ?', [data.email]);
    if (exists) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(data.password, 10);
    const id = uuid();
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, role)
       VALUES (?, ?, ?, ?, 'candidato')`,
      [id, data.email, passwordHash, data.fullName],
    );
    const user = mapUser(await queryOne('SELECT * FROM users WHERE id = ?', [id]));
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    // Correo de bienvenida (no bloquea respuesta)
    const w = tplWelcome({ fullName: user.fullName });
    sendMail({ to: user.email, ...w }).catch(() => {});
    res.status(201).json({ token, user });
  } catch (e) { next(e); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const row = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const user = mapUser(row);
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user });
  } catch (e) { next(e); }
}

export async function me(req, res, next) {
  try {
    const row = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ user: mapUser(row) });
  } catch (e) { next(e); }
}

// ===== Recuperación de contraseña =====

function hashToken(t) { return crypto.createHash('sha256').update(t).digest('hex'); }

export async function forgotPassword(req, res, next) {
  try {
    const { email } = forgotSchema.parse(req.body);
    const user = await queryOne('SELECT id, email, full_name FROM users WHERE email = ?', [email]);
    // Respuesta neutra siempre, para no filtrar existencia de cuentas
    if (user) {
      const raw = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(raw);
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await query(
        `INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES (?,?,?,?)`,
        [uuid(), user.id, tokenHash, expires],
      );
      const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
      const resetUrl = `${appUrl}/reset-password?token=${raw}`;
      const t = tplPasswordReset({ fullName: user.full_name, resetUrl });
      sendMail({ to: user.email, ...t }).catch(() => {});
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = resetSchema.parse(req.body);
    const tokenHash = hashToken(token);
    const row = await queryOne(
      `SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?`,
      [tokenHash],
    );
    if (!row) return res.status(400).json({ error: 'Token inválido' });
    if (row.used_at) return res.status(400).json({ error: 'Este enlace ya fue utilizado' });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'El enlace ha expirado' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, row.user_id]);
    await query('UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);
    // Invalida otros tokens del mismo usuario
    await query(
      'UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL',
      [row.user_id],
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export async function verifyResetToken(req, res, next) {
  try {
    const token = String(req.query.token || '');
    if (!token) return res.status(400).json({ valid: false });
    const tokenHash = hashToken(token);
    const row = await queryOne(
      `SELECT expires_at, used_at FROM password_resets WHERE token_hash = ?`,
      [tokenHash],
    );
    const valid = !!row && !row.used_at && new Date(row.expires_at).getTime() > Date.now();
    res.json({ valid });
  } catch (e) { next(e); }
}
