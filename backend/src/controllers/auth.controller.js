import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { query, queryOne } from '../config/db.js';
import { signToken } from '../utils/jwt.js';

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  fullName: z.string().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
    // Registro público: SIEMPRE rol candidato.
    // Roles administrativos sólo se crean desde el panel del Super Administrador.
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, role)
       VALUES (?, ?, ?, ?, 'candidato')`,
      [id, data.email, passwordHash, data.fullName],
    );
    const user = mapUser(await queryOne('SELECT * FROM users WHERE id = ?', [id]));
    const token = signToken({ id: user.id, email: user.email, role: user.role });
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
