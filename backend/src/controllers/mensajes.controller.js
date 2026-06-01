import { v4 as uuid } from 'uuid';
import { query, queryOne } from '../config/db.js';

/** Crea un mensaje de sistema en el chat de una postulación. */
export async function crearMensajeSistema(postulacionId, mensaje, autorId = null, autorRol = 'sistema') {
  await query(
    `INSERT INTO postulacion_mensajes (id, postulacion_id, autor_id, autor_rol, mensaje)
     VALUES (?,?,?,?,?)`,
    [uuid(), postulacionId, autorId, autorRol, String(mensaje).slice(0, 2000)],
  );
}

async function puedeAccederPostulacion(user, postulacionId) {
  const p = await queryOne('SELECT candidato_id FROM postulaciones WHERE id = ?', [postulacionId]);
  if (!p) return false;
  if (['super_admin', 'rrhh', 'evaluador'].includes(user.role)) return true;
  if (user.role === 'candidato' && p.candidato_id === user.id) return true;
  return false;
}

export async function listMensajes(req, res, next) {
  try {
    if (!(await puedeAccederPostulacion(req.user, req.params.id))) {
      return res.status(403).json({ error: 'Sin acceso a esta conversación' });
    }
    const rows = await query(
      `SELECT m.id, m.mensaje, m.created_at AS createdAt,
              m.autor_id AS autorId, m.autor_rol AS autorRol,
              u.full_name AS autorNombre, u.avatar_url AS autorAvatar
         FROM postulacion_mensajes m
         JOIN users u ON u.id = m.autor_id
        WHERE m.postulacion_id = ?
        ORDER BY m.created_at ASC`,
      [req.params.id],
    );
    res.json({ items: rows });
  } catch (e) { next(e); }
}

export async function crearMensaje(req, res, next) {
  try {
    const { mensaje } = req.body;
    if (!mensaje || !String(mensaje).trim()) return res.status(400).json({ error: 'Mensaje vacío' });
    if (!(await puedeAccederPostulacion(req.user, req.params.id))) {
      return res.status(403).json({ error: 'Sin acceso a esta conversación' });
    }
    const id = uuid();
    await query(
      `INSERT INTO postulacion_mensajes (id, postulacion_id, autor_id, autor_rol, mensaje)
       VALUES (?,?,?,?,?)`,
      [id, req.params.id, req.user.id, req.user.role, String(mensaje).slice(0, 2000)],
    );
    const row = await queryOne(
      `SELECT m.id, m.mensaje, m.created_at AS createdAt,
              m.autor_id AS autorId, m.autor_rol AS autorRol,
              u.full_name AS autorNombre
         FROM postulacion_mensajes m JOIN users u ON u.id = m.autor_id
        WHERE m.id = ?`, [id],
    );
    res.status(201).json({ mensaje: row });
  } catch (e) { next(e); }
}
