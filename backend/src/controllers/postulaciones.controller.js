import { v4 as uuid } from 'uuid';
import { query, queryOne } from '../config/db.js';

export async function listAll(req, res, next) {
  try {
    const { estado } = req.query;
    const where = [];
    const params = [];
    if (estado) { where.push('p.estado = ?'); params.push(String(estado)); }
    const sql = `
      SELECT p.id, p.estado, p.cv_url AS cvUrl, p.notas, p.created_at AS createdAt,
             v.id AS vacanteId, v.titulo AS vacanteTitulo, v.departamento, v.modalidad,
             u.id AS candidatoId, u.full_name AS candidatoNombre, u.email AS candidatoEmail
        FROM postulaciones p
        JOIN vacantes v ON v.id = p.vacante_id
        JOIN users u    ON u.id = p.candidato_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY p.created_at DESC
       LIMIT 500`;
    const rows = await query(sql, params);
    res.json({ items: rows });
  } catch (e) { next(e); }
}

export async function applyToVacante(req, res, next) {
  try {
    const { vacanteId } = req.body;
    if (!vacanteId) return res.status(400).json({ error: 'vacanteId requerido' });

    const vac = await queryOne(
      `SELECT id, estado, publicada FROM vacantes WHERE id = ?`,
      [vacanteId],
    );
    if (!vac) return res.status(404).json({ error: 'Vacante no encontrada' });
    if (vac.estado !== 'abierta' || !vac.publicada) {
      return res.status(400).json({ error: 'La vacante no está abierta para postulaciones' });
    }

    const existing = await queryOne(
      'SELECT id FROM postulaciones WHERE vacante_id = ? AND candidato_id = ?',
      [vacanteId, req.user.id],
    );
    if (existing) {
      return res.status(409).json({ error: 'Ya te postulaste a esta vacante' });
    }

    // CV: el subido en esta petición, o el del perfil si no se adjuntó nada.
    let cvUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!cvUrl) {
      const u = await queryOne('SELECT cv_url FROM users WHERE id = ?', [req.user.id]);
      cvUrl = u?.cv_url || null;
    }

    const id = uuid();
    await query(
      `INSERT INTO postulaciones (id, vacante_id, candidato_id, cv_url)
       VALUES (?, ?, ?, ?)`,
      [id, vacanteId, req.user.id, cvUrl],
    );
    const post = await queryOne('SELECT * FROM postulaciones WHERE id = ?', [id]);
    res.status(201).json({ postulacion: post });
  } catch (e) { next(e); }
}

export async function myApplications(req, res, next) {
  try {
    const rows = await query(
      `SELECT p.id, p.estado, p.cv_url AS cvUrl, p.notas, p.created_at AS createdAt,
              v.id AS vacanteId, v.titulo, v.departamento, v.modalidad, v.estado AS vacanteEstado
         FROM postulaciones p
         JOIN vacantes v ON v.id = p.vacante_id
        WHERE p.candidato_id = ?
        ORDER BY p.created_at DESC`,
      [req.user.id],
    );
    res.json({ items: rows });
  } catch (e) { next(e); }
}

export async function listForVacante(req, res, next) {
  try {
    const rows = await query(
      `SELECT p.id, p.estado, p.cv_url AS cvUrl, p.notas, p.created_at AS createdAt,
              u.id AS candidatoId, u.full_name AS fullName, u.email, u.avatar_url AS avatarUrl
         FROM postulaciones p
         JOIN users u ON u.id = p.candidato_id
        WHERE p.vacante_id = ?
        ORDER BY p.created_at DESC`,
      [req.params.vacanteId],
    );
    res.json({ items: rows });
  } catch (e) { next(e); }
}

export async function updateEstado(req, res, next) {
  try {
    const { estado, notas } = req.body;
    const allowed = ['enviada','en_revision','evaluacion','entrevista','rechazada','contratada'];
    if (estado && !allowed.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const sets = [];
    const params = [];
    if (estado !== undefined) { sets.push('estado = ?'); params.push(estado); }
    if (notas !== undefined)  { sets.push('notas = ?');  params.push(notas); }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    const result = await query(`UPDATE postulaciones SET ${sets.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Postulación no encontrada' });
    const post = await queryOne('SELECT * FROM postulaciones WHERE id = ?', [req.params.id]);
    res.json({ postulacion: post });
  } catch (e) { next(e); }
}
