import { query } from '../config/db.js';

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
