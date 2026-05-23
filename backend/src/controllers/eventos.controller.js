import { v4 as uuid } from 'uuid';
import { query } from '../config/db.js';

/** Registra un evento en el timeline de una postulación. Llamable desde otros controladores. */
export async function registrarEvento({ postulacionId, estado = null, tipo = 'estado', nota = null, autorId = null, autorRol = null }) {
  await query(
    `INSERT INTO postulacion_eventos (id, postulacion_id, estado, tipo, nota, autor_id, autor_rol)
     VALUES (?,?,?,?,?,?,?)`,
    [uuid(), postulacionId, estado, tipo, nota, autorId, autorRol],
  );
}

export async function listEventos(req, res, next) {
  try {
    const rows = await query(
      `SELECT e.id, e.estado, e.tipo, e.nota, e.created_at AS createdAt,
              e.autor_id AS autorId, e.autor_rol AS autorRol,
              u.full_name AS autorNombre
         FROM postulacion_eventos e
         LEFT JOIN users u ON u.id = e.autor_id
        WHERE e.postulacion_id = ?
        ORDER BY e.created_at ASC`,
      [req.params.id],
    );
    res.json({ items: rows });
  } catch (e) { next(e); }
}

export async function crearNotaEvento(req, res, next) {
  try {
    const { nota } = req.body;
    if (!nota || !String(nota).trim()) return res.status(400).json({ error: 'Nota requerida' });
    await registrarEvento({
      postulacionId: req.params.id,
      tipo: 'nota',
      nota: String(nota).slice(0, 1000),
      autorId: req.user.id,
      autorRol: req.user.role,
    });
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
}
