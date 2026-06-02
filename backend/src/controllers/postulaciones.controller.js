import { v4 as uuid } from 'uuid';
import { query, queryOne } from '../config/db.js';
import { registrarEvento } from './eventos.controller.js';
import { crearMensajeSistema } from './mensajes.controller.js';
import { autoCierreVacante } from './vacantes.controller.js';
import { canTransition, allowedTransitionsFor, isFinal, ESTADOS } from '../lib/state-machine.js';

export async function listAll(req, res, next) {
  try {
    const { estado } = req.query;
    const where = [];
    const params = [];
    if (estado) { where.push('p.estado = ?'); params.push(String(estado)); }
    const sql = `
      SELECT p.id, p.estado, p.cv_url AS cvUrl, p.notas, p.created_at AS createdAt,
             v.id AS vacanteId, v.titulo AS vacanteTitulo, v.departamento, v.modalidad,
             u.id AS candidatoId, u.full_name AS candidatoNombre, u.email AS candidatoEmail,
             u.avatar_url AS candidatoAvatar
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
    if (existing) return res.status(409).json({ error: 'Ya te postulaste a esta vacante' });

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
    await registrarEvento({
      postulacionId: id, estado: 'enviada', tipo: 'estado',
      nota: 'Postulación enviada por el candidato',
      autorId: req.user.id, autorRol: req.user.role,
    });
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
    if (estado && !ESTADOS.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const post = await queryOne('SELECT vacante_id, estado FROM postulaciones WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Postulación no encontrada' });

    // Enforce flujo controlado
    if (estado && estado !== post.estado) {
      if (!canTransition(post.estado, estado)) {
        return res.status(400).json({
          error: `Transición no permitida: ${post.estado} → ${estado}`,
        });
      }
      const allowed = allowedTransitionsFor(req.user.role, post.estado);
      if (!allowed.includes(estado)) {
        return res.status(403).json({
          error: 'Tu rol no puede ejecutar esta acción sobre el candidato',
        });
      }
    }

    const sets = []; const params = [];
    if (estado !== undefined) { sets.push('estado = ?'); params.push(estado); }
    if (notas !== undefined)  { sets.push('notas = ?');  params.push(notas); }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    await query(`UPDATE postulaciones SET ${sets.join(', ')} WHERE id = ?`, params);

    if (estado && estado !== post.estado) {
      await registrarEvento({
        postulacionId: req.params.id, estado, tipo: 'estado',
        nota: notas || null,
        autorId: req.user.id, autorRol: req.user.role,
      });
      // Mensajes automáticos del sistema en hitos clave
      const mensajeMap = {
        en_revision: 'Tu postulación está siendo revisada por el equipo de selección.',
        entrevista_pendiente: 'Pasaste a la etapa de entrevista. Pronto recibirás la programación.',
        entrevista_realizada: 'La entrevista ha sido marcada como realizada. Estamos evaluando los resultados.',
        contratada: '¡Felicidades! Has sido seleccionado/a para el cargo. RRHH te contactará para los siguientes pasos.',
        rechazada: 'Lamentamos informarte que tu proceso ha concluido para esta vacante. Te invitamos a postularte a futuras oportunidades.',
      };
      if (mensajeMap[estado]) {
        await crearMensajeSistema(req.params.id, mensajeMap[estado], req.user.id, req.user.role);
      }
    }
    // Auto-cierre si se contrató: cuenta contratados y cierra vacante si cubre cupos
    if (estado === 'contratada') {
      await autoCierreVacante(post.vacante_id);
    }
    const updated = await queryOne('SELECT * FROM postulaciones WHERE id = ?', [req.params.id]);
    res.json({ postulacion: updated });
  } catch (e) { next(e); }
}
