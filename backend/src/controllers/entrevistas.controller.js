import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { query, queryOne } from '../config/db.js';
import { registrarEvento } from './eventos.controller.js';
import { crearMensajeSistema } from './mensajes.controller.js';

const schema = z.object({
  postulacionId: z.string().uuid(),
  programadaPara: z.string().min(5),
  modalidad: z.enum(['presencial', 'virtual', 'telefonica']).default('virtual'),
  link: z.string().max(400).nullish(),
  ubicacion: z.string().max(200).nullish(),
  notas: z.string().max(2000).nullish(),
});

export async function listByPostulacion(req, res, next) {
  try {
    const rows = await query(
      `SELECT id, postulacion_id AS postulacionId, programada_para AS programadaPara,
              modalidad, link, ubicacion, notas, estado, creada_por AS creadaPor, created_at AS createdAt
         FROM entrevistas WHERE postulacion_id = ? ORDER BY programada_para DESC`,
      [req.params.id],
    );
    res.json({ items: rows });
  } catch (e) { next(e); }
}

export async function crearEntrevista(req, res, next) {
  try {
    const d = schema.parse(req.body);
    const id = uuid();
    await query(
      `INSERT INTO entrevistas (id, postulacion_id, programada_para, modalidad, link, ubicacion, notas, creada_por)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, d.postulacionId, new Date(d.programadaPara), d.modalidad, d.link ?? null, d.ubicacion ?? null, d.notas ?? null, req.user.id],
    );
    await query(`UPDATE postulaciones SET estado = 'entrevista_pendiente' WHERE id = ?`, [d.postulacionId]);
    await registrarEvento({
      postulacionId: d.postulacionId, estado: 'entrevista_pendiente', tipo: 'estado',
      nota: `Entrevista ${d.modalidad} programada${d.notas ? `: ${d.notas}` : ''}`,
      autorId: req.user.id, autorRol: req.user.role,
    });
    const when = new Date(d.programadaPara).toLocaleString();
    const loc = d.modalidad === 'virtual'
      ? (d.link ? `\nLink: ${d.link}` : '')
      : (d.ubicacion ? `\nLugar: ${d.ubicacion}` : '');
    await crearMensajeSistema(
      d.postulacionId,
      `Se programó una entrevista ${d.modalidad} para el ${when}.${loc}${d.notas ? `\n\nNotas: ${d.notas}` : ''}`,
      req.user.id, req.user.role,
    );
    res.status(201).json({ id });
  } catch (e) { next(e); }
}

export async function actualizarEntrevista(req, res, next) {
  try {
    const { estado, notas, programadaPara } = req.body;
    const sets = []; const params = [];
    if (estado) { sets.push('estado = ?'); params.push(estado); }
    if (notas !== undefined) { sets.push('notas = ?'); params.push(notas); }
    if (programadaPara) { sets.push('programada_para = ?'); params.push(new Date(programadaPara)); }
    if (!sets.length) return res.status(400).json({ error: 'Sin cambios' });
    params.push(req.params.id);
    const result = await query(`UPDATE entrevistas SET ${sets.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'No encontrada' });
    const ent = await queryOne('SELECT postulacion_id, estado FROM entrevistas WHERE id = ?', [req.params.id]);
    if (estado === 'realizada') {
      await query(`UPDATE postulaciones SET estado = 'entrevista_realizada' WHERE id = ?`, [ent.postulacion_id]);
      await registrarEvento({
        postulacionId: ent.postulacion_id, estado: 'entrevista_realizada', tipo: 'estado',
        nota: notas || 'Entrevista realizada',
        autorId: req.user.id, autorRol: req.user.role,
      });
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
}
