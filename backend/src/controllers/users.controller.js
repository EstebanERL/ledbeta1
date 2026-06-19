import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { query, queryOne } from '../config/db.js';
import { registrarEvento } from './eventos.controller.js';
import { crearMensajeSistema } from './mensajes.controller.js';

const PROFILE_COLS = `
  id, email, full_name AS fullName, role, avatar_url AS avatarUrl,
  phone, location, headline, bio,
  linkedin_url AS linkedinUrl, github_url AS githubUrl, website_url AS websiteUrl,
  cv_url AS cvUrl, skills, experience, education, is_active AS isActive,
  created_at AS createdAt
`;

function parseJson(row, keys) {
  for (const k of keys) {
    const v = row?.[k];
    if (typeof v === 'string') {
      try { row[k] = JSON.parse(v); } catch { /* leave as string */ }
    }
  }
  return row;
}

export async function listUsers(_req, res, next) {
  try {
    const rows = await query(
      `SELECT id, email, full_name AS fullName, role, avatar_url AS avatarUrl,
              is_active AS isActive, created_at AS createdAt
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

export async function toggleActive(req, res, next) {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive boolean required' });
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }
    const result = await query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
}

// ----- Perfil propio -----
const profileSchema = z.object({
  fullName:     z.string().min(2).max(150).optional(),
  phone:        z.string().max(40).nullish(),
  location:     z.string().max(150).nullish(),
  headline:     z.string().max(180).nullish(),
  bio:          z.string().max(2000).nullish(),
  linkedinUrl:  z.string().max(300).nullish(),
  githubUrl:    z.string().max(300).nullish(),
  websiteUrl:   z.string().max(300).nullish(),
  skills:       z.array(z.string().max(60)).max(40).optional(),
  experience:   z.array(z.object({
    company: z.string().max(150),
    role:    z.string().max(150),
    from:    z.string().max(20).optional(),
    to:      z.string().max(20).optional(),
    description: z.string().max(800).optional(),
  })).max(20).optional(),
  education:    z.array(z.object({
    institution: z.string().max(180),
    degree:      z.string().max(150),
    from:        z.string().max(20).optional(),
    to:          z.string().max(20).optional(),
  })).max(20).optional(),
});

export async function getMe(req, res, next) {
  try {
    const row = await queryOne(`SELECT ${PROFILE_COLS} FROM users WHERE id = ?`, [req.user.id]);
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ user: parseJson(row, ['skills', 'experience', 'education']) });
  } catch (e) { next(e); }
}

export async function updateMe(req, res, next) {
  try {
    const data = profileSchema.parse(req.body);
    const map = {
      fullName: 'full_name', phone: 'phone', location: 'location', headline: 'headline',
      bio: 'bio', linkedinUrl: 'linkedin_url', githubUrl: 'github_url', websiteUrl: 'website_url',
    };
    const sets = []; const params = [];
    for (const [k, col] of Object.entries(map)) {
      if (data[k] !== undefined) { sets.push(`${col} = ?`); params.push(data[k] || null); }
    }
    for (const k of ['skills', 'experience', 'education']) {
      if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(JSON.stringify(data[k])); }
    }
    if (sets.length) {
      params.push(req.user.id);
      await query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
    }
    const row = await queryOne(`SELECT ${PROFILE_COLS} FROM users WHERE id = ?`, [req.user.id]);
    res.json({ user: parseJson(row, ['skills', 'experience', 'education']) });
  } catch (e) { next(e); }
}

export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
    const url = req.file.path;
    await query('UPDATE users SET avatar_url = ? WHERE id = ?', [url, req.user.id]);
    res.json({ avatarUrl: url });
  } catch (e) { next(e); }
  console.log("Cloudinary file:", req.file);
  console.log("URL guardada:", req.file.path);
}

export async function uploadCv(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
    const url = req.file.path;
    await query('UPDATE users SET cv_url = ? WHERE id = ?', [url, req.user.id]);
    res.json({ cvUrl: url });
  } catch (e) { next(e); }
}

// Detalle público (RRHH / Evaluador / Admin): ver perfil de un candidato.
// Al abrirlo, avanza automáticamente cualquier postulación 'enviada' a 'en_revision'.
export async function getById(req, res, next) {
  try {
    const row = await queryOne(`SELECT ${PROFILE_COLS} FROM users WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'User not found' });
    if (row.role === 'candidato' && ['rrhh', 'evaluador', 'super_admin'].includes(req.user.role)) {
      const pendientes = await query(
        `SELECT id FROM postulaciones WHERE candidato_id = ? AND estado = 'enviada'`,
        [req.params.id],
      );
      for (const p of pendientes) {
        await query(`UPDATE postulaciones SET estado = 'en_revision' WHERE id = ?`, [p.id]);
        await registrarEvento({
          postulacionId: p.id, estado: 'en_revision', tipo: 'estado',
          nota: `Postulación abierta por ${req.user.role}`,
          autorId: req.user.id, autorRol: req.user.role,
        });
        await crearMensajeSistema(
          p.id,
          'Tu postulación está siendo revisada por el equipo de selección.',
          req.user.id, req.user.role,
        );
      }
    }
    res.json({ user: parseJson(row, ['skills', 'experience', 'education']) });
  } catch (e) { next(e); }
}
