import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { query, queryOne } from '../config/db.js';
import { registrarEvento } from './eventos.controller.js';
import { crearMensajeSistema } from './mensajes.controller.js';

const preguntaSchema = z.object({
  id: z.string().min(1),
  enunciado: z.string().min(1).max(500),
  tipo: z.enum(['single', 'multi', 'texto']),
  opciones: z.array(z.object({
    id: z.string(),
    texto: z.string(),
    correcta: z.boolean().optional(),
  })).optional(),
  puntaje: z.number().nonnegative().default(1),
});

const testSchema = z.object({
  titulo: z.string().min(2).max(180),
  descripcion: z.string().max(2000).optional().nullable(),
  tipo: z.enum(['tecnico', 'psicologico']).default('tecnico'),
  preguntas: z.array(preguntaSchema).min(1).max(50),
});

function parsePreguntas(row) {
  if (!row) return null;
  if (typeof row.preguntas === 'string') { try { row.preguntas = JSON.parse(row.preguntas); } catch {} }
  return row;
}

export async function listTests(_req, res, next) {
  try {
    const rows = await query(
      `SELECT id, titulo, descripcion, tipo, preguntas, creado_por AS creadoPor, created_at AS createdAt
         FROM tests ORDER BY created_at DESC`,
    );
    res.json({ items: rows.map(parsePreguntas) });
  } catch (e) { next(e); }
}

export async function createTest(req, res, next) {
  try {
    const d = testSchema.parse(req.body);
    const id = uuid();
    await query(
      `INSERT INTO tests (id, titulo, descripcion, tipo, preguntas, creado_por) VALUES (?,?,?,?,?,?)`,
      [id, d.titulo, d.descripcion ?? null, d.tipo, JSON.stringify(d.preguntas), req.user.id],
    );
    res.status(201).json({ id });
  } catch (e) { next(e); }
}

// ----- Asignaciones -----

export async function asignarTest(req, res, next) {
  try {
    const { testId, postulacionId, observaciones } = req.body;
    if (!testId || !postulacionId) return res.status(400).json({ error: 'testId y postulacionId requeridos' });
    const test = await queryOne('SELECT id FROM tests WHERE id = ?', [testId]);
    if (!test) return res.status(404).json({ error: 'Test no encontrado' });
    const post = await queryOne('SELECT id, candidato_id FROM postulaciones WHERE id = ?', [postulacionId]);
    if (!post) return res.status(404).json({ error: 'Postulación no encontrada' });

    const id = uuid();
    await query(
      `INSERT INTO test_asignaciones (id, test_id, postulacion_id, asignado_por, observaciones)
       VALUES (?,?,?,?,?)`,
      [id, testId, postulacionId, req.user.id, observaciones ?? null],
    );
    await query(`UPDATE postulaciones SET estado = 'test_asignado' WHERE id = ?`, [postulacionId]);
    await registrarEvento({
      postulacionId, estado: 'test_asignado', tipo: 'estado',
      nota: 'Test asignado por evaluador',
      autorId: req.user.id, autorRol: req.user.role,
    });
    res.status(201).json({ id });
  } catch (e) { next(e); }
}

export async function listAsignacionesPostulacion(req, res, next) {
  try {
    const rows = await query(
      `SELECT a.id, a.test_id AS testId, a.estado, a.score, a.max_score AS maxScore,
              a.observaciones, a.respuestas, a.completado_at AS completadoAt, a.created_at AS createdAt,
              t.titulo, t.tipo, t.preguntas
         FROM test_asignaciones a
         JOIN tests t ON t.id = a.test_id
        WHERE a.postulacion_id = ?
        ORDER BY a.created_at DESC`,
      [req.params.id],
    );
    for (const r of rows) {
      if (typeof r.preguntas === 'string') { try { r.preguntas = JSON.parse(r.preguntas); } catch {} }
      if (typeof r.respuestas === 'string') { try { r.respuestas = JSON.parse(r.respuestas); } catch {} }
    }
    res.json({ items: rows });
  } catch (e) { next(e); }
}

export async function misAsignaciones(req, res, next) {
  try {
    const rows = await query(
      `SELECT a.id, a.test_id AS testId, a.postulacion_id AS postulacionId, a.estado,
              a.score, a.max_score AS maxScore, a.observaciones, a.respuestas,
              a.completado_at AS completadoAt, a.created_at AS createdAt,
              t.titulo, t.tipo, t.descripcion, t.preguntas,
              v.titulo AS vacanteTitulo
         FROM test_asignaciones a
         JOIN tests t ON t.id = a.test_id
         JOIN postulaciones p ON p.id = a.postulacion_id
         JOIN vacantes v ON v.id = p.vacante_id
        WHERE p.candidato_id = ?
        ORDER BY a.created_at DESC`,
      [req.user.id],
    );
    for (const r of rows) {
      if (typeof r.preguntas === 'string') { try { r.preguntas = JSON.parse(r.preguntas); } catch {} }
      if (typeof r.respuestas === 'string') { try { r.respuestas = JSON.parse(r.respuestas); } catch {} }
    }
    res.json({ items: rows });
  } catch (e) { next(e); }
}

function calcularScore(preguntas, respuestas) {
  let score = 0;
  let max = 0;
  for (const q of preguntas) {
    max += Number(q.puntaje || 1);
    if (q.tipo === 'texto') continue;
    const r = respuestas[q.id];
    if (!r) continue;
    const correctas = (q.opciones || []).filter((o) => o.correcta).map((o) => o.id).sort();
    const sel = Array.isArray(r) ? [...r].sort() : [r];
    if (JSON.stringify(correctas) === JSON.stringify(sel)) score += Number(q.puntaje || 1);
  }
  return { score, max };
}

export async function responderAsignacion(req, res, next) {
  try {
    const a = await queryOne(
      `SELECT a.*, p.candidato_id, t.preguntas
         FROM test_asignaciones a
         JOIN postulaciones p ON p.id = a.postulacion_id
         JOIN tests t ON t.id = a.test_id
        WHERE a.id = ?`,
      [req.params.id],
    );
    if (!a) return res.status(404).json({ error: 'Asignación no encontrada' });
    if (a.candidato_id !== req.user.id) return res.status(403).json({ error: 'Sin acceso' });
    if (a.estado === 'calificado') return res.status(400).json({ error: 'Test ya calificado' });

    const preguntas = typeof a.preguntas === 'string' ? JSON.parse(a.preguntas) : a.preguntas;
    const respuestas = req.body?.respuestas || {};
    const { score, max } = calcularScore(preguntas, respuestas);

    await query(
      `UPDATE test_asignaciones
          SET respuestas = ?, estado = 'completado', score = ?, max_score = ?, completado_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [JSON.stringify(respuestas), score, max, req.params.id],
    );
    await registrarEvento({
      postulacionId: a.postulacion_id, tipo: 'test_completado',
      nota: `Candidato completó test (${score}/${max})`,
      autorId: req.user.id, autorRol: req.user.role,
    });
    res.json({ score, maxScore: max });
  } catch (e) { next(e); }
}

export async function calificarAsignacion(req, res, next) {
  try {
    const { observaciones, score } = req.body;
    const result = await query(
      `UPDATE test_asignaciones SET estado = 'calificado', observaciones = ?,
        score = COALESCE(?, score)
       WHERE id = ?`,
      [observaciones ?? null, score ?? null, req.params.id],
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'No encontrada' });
    const a = await queryOne('SELECT postulacion_id FROM test_asignaciones WHERE id = ?', [req.params.id]);
    await registrarEvento({
      postulacionId: a.postulacion_id, tipo: 'test_calificado',
      nota: observaciones || 'Test calificado por evaluador',
      autorId: req.user.id, autorRol: req.user.role,
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
}
