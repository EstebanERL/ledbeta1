import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { query, queryOne } from '../config/db.js';

export async function listUsers(_req, res, next) {
  try {
    const rows = await query(
      `SELECT id, email, full_name AS fullName, role, avatar_url AS avatarUrl, created_at AS createdAt
       FROM users ORDER BY created_at DESC`,
    );
    res.json({ users: rows });
  } catch (e) { next(e); }
}

export async function updateRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!['super_admin', 'rrhh', 'evaluador', 'candidato'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const result = await query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    const rows = await query(
      `SELECT id, email, full_name AS fullName, role FROM users WHERE id = ?`,
      [req.params.id],
    );
    res.json({ user: rows[0] });
  } catch (e) { next(e); }
}

const createSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  fullName: z.string().min(2).max(150),
  role: z.enum(['super_admin', 'rrhh', 'evaluador', 'candidato']),
});

export async function createUser(req, res, next) {
  try {
    const data = createSchema.parse(req.body);
    const exists = await queryOne('SELECT id FROM users WHERE email = ?', [data.email]);
    if (exists) return res.status(409).json({ error: 'Email already in use' });
    const passwordHash = await bcrypt.hash(data.password, 10);
    const id = uuid();
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?,?,?,?,?)`,
      [id, data.email, passwordHash, data.fullName, data.role],
    );
    const user = await queryOne(
      `SELECT id, email, full_name AS fullName, role, created_at AS createdAt FROM users WHERE id = ?`,
      [id],
    );
    res.status(201).json({ user });
  } catch (e) { next(e); }
}

export async function deleteUser(req, res, next) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }
    const result = await query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
}
