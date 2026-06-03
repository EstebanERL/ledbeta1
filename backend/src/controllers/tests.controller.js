import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { query, queryOne } from '../config/db.js';
import { registrarEvento } from './eventos.controller.js';
import { crearMensajeSistema } from './mensajes.controller.js';

const preguntaSchema = z.object({
  id: z.string().min(1),
  enunciado: z.string().min(1).max(800),
  tipo: z.enum(['single', 'multi', 'texto']),
  opciones: z.array(z.object({
    id: z.string(),
    texto: z.string(),
    correcta: z.boolean().optional(),
  })).optional(),
  puntaje: z.number().nonnegative().default(1),
  explicacion: z.string().max(800).optional().nullable(),
});

const testSchema = z.object({
  titulo: z.string().min(2).max(180),
  descripcion: z.string().max(2000).optional().nullable(),
  tipo: z.enum(['tecnico', 'psicologico']).default('tecnico'),
  categoria: z.string().max(80).optional().nullable(),
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
      `SELECT id, titulo, descripcion, tipo, categoria, preguntas, is_active AS isActive,
              creado_por AS creadoPor, created_at AS createdAt
         FROM tests
        WHERE is_active = 1
        ORDER BY created_at DESC`,
    );
    res.json({ items: rows.map(parsePreguntas) });
  } catch (e) { next(e); }
}

export async function listTestsBiblioteca(_req, res, next) {
  try {
    const rows = await query(
      `SELECT id, titulo, descripcion, tipo, categoria, preguntas, is_active AS isActive,
              creado_por AS creadoPor, created_at AS createdAt
         FROM tests ORDER BY is_active DESC, created_at DESC`,
    );
    res.json({ items: rows.map(parsePreguntas) });
  } catch (e) { next(e); }
}

export async function createTest(req, res, next) {
  try {
    const d = testSchema.parse(req.body);
    const id = uuid();
    await query(
      `INSERT INTO tests (id, titulo, descripcion, tipo, categoria, preguntas, creado_por)
       VALUES (?,?,?,?,?,?,?)`,
      [id, d.titulo, d.descripcion ?? null, d.tipo, d.categoria ?? null, JSON.stringify(d.preguntas), req.user.id],
    );
    res.status(201).json({ id });
  } catch (e) { next(e); }
}

export async function updateTest(req, res, next) {
  try {
    const d = testSchema.partial().parse(req.body);
    const sets = []; const params = [];
    if (d.titulo !== undefined)      { sets.push('titulo = ?');      params.push(d.titulo); }
    if (d.descripcion !== undefined) { sets.push('descripcion = ?'); params.push(d.descripcion); }
    if (d.tipo !== undefined)        { sets.push('tipo = ?');        params.push(d.tipo); }
    if (d.categoria !== undefined)   { sets.push('categoria = ?');   params.push(d.categoria); }
    if (d.preguntas !== undefined)   { sets.push('preguntas = ?');   params.push(JSON.stringify(d.preguntas)); }
    if (sets.length === 0) return res.status(400).json({ error: 'Sin cambios' });
    params.push(req.params.id);
    await query(`UPDATE tests SET ${sets.join(', ')} WHERE id = ?`, params);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export async function toggleTestActive(req, res, next) {
  try {
    const { isActive } = req.body;
    await query(`UPDATE tests SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export async function duplicateTest(req, res, next) {
  try {
    const src = await queryOne(`SELECT * FROM tests WHERE id = ?`, [req.params.id]);
    if (!src) return res.status(404).json({ error: 'Test no encontrado' });
    const id = uuid();
    await query(
      `INSERT INTO tests (id, titulo, descripcion, tipo, categoria, preguntas, creado_por, is_active)
       VALUES (?,?,?,?,?,?,?,1)`,
      [id, `${src.titulo} (copia)`, src.descripcion, src.tipo, src.categoria,
       typeof src.preguntas === 'string' ? src.preguntas : JSON.stringify(src.preguntas), req.user.id],
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
      nota: observaciones ? `Test asignado: ${observaciones}` : 'Test asignado por evaluador',
      autorId: req.user.id, autorRol: req.user.role,
    });
    const t = await queryOne('SELECT titulo, tipo FROM tests WHERE id = ?', [testId]);
    await crearMensajeSistema(
      postulacionId,
      `Se te asignó un nuevo test ${t?.tipo || ''}: "${t?.titulo || ''}". Revísalo en "Mis tests".${observaciones ? `\n\nInstrucciones: ${observaciones}` : ''}`,
      req.user.id, req.user.role,
    );
    res.status(201).json({ id });
  } catch (e) { next(e); }
}

export async function listAsignacionesPostulacion(req, res, next) {
  try {
    const rows = await query(
      `SELECT a.id, a.test_id AS testId, a.estado, a.score, a.max_score AS maxScore,
              a.observaciones, a.respuestas, a.completado_at AS completadoAt, a.created_at AS createdAt,
              t.titulo, t.tipo, t.categoria, t.preguntas
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
  let tieneClave = false; // si al menos una pregunta tiene opciones correctas marcadas
  for (const q of preguntas) {
    const punt = Number(q.puntaje || 1);
    max += punt;
    if (q.tipo === 'texto') continue;
    const correctasArr = (q.opciones || []).filter((o) => o.correcta).map((o) => String(o.id));
    if (correctasArr.length > 0) tieneClave = true;
    const r = respuestas?.[q.id];
    if (r === undefined || r === null || r === '') continue;
    const correctas = [...correctasArr].sort();
    const sel = (Array.isArray(r) ? r : [r]).map((x) => String(x)).sort();
    if (correctas.length > 0 && JSON.stringify(correctas) === JSON.stringify(sel)) {
      score += punt;
    }
  }
  return { score, max, tieneClave };
}

export async function responderAsignacion(req, res, next) {
  try {
    const a = await queryOne(
      `SELECT a.*, p.candidato_id, p.estado AS postulacionEstado, t.preguntas, t.titulo AS testTitulo
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
    // Avanza la postulación a 'test_completado' (si está en test_asignado)
    if (a.postulacionEstado === 'test_asignado') {
      await query(`UPDATE postulaciones SET estado = 'test_completado' WHERE id = ?`, [a.postulacion_id]);
      await registrarEvento({
        postulacionId: a.postulacion_id, estado: 'test_completado', tipo: 'estado',
        nota: `Candidato completó test "${a.testTitulo}" (${score}/${max})`,
        autorId: req.user.id, autorRol: req.user.role,
      });
    } else {
      await registrarEvento({
        postulacionId: a.postulacion_id, tipo: 'test_completado',
        nota: `Candidato completó test "${a.testTitulo}" (${score}/${max})`,
        autorId: req.user.id, autorRol: req.user.role,
      });
    }
    await crearMensajeSistema(
      a.postulacion_id,
      `El candidato completó el test "${a.testTitulo}". Puntaje: ${score}/${max}.`,
      req.user.id, req.user.role,
    );
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

// ---------- Generación de tests con IA (Lovable AI Gateway) ----------
// Requiere LOVABLE_API_KEY en process.env. Si no está, devuelve 503.
export async function generarTestIA(req, res, next) {
  try {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'LOVABLE_API_KEY no configurada en el backend. Agrega la variable en backend/.env para usar la generación con IA.',
      });
    }
    const { tipo = 'tecnico', categoria = '', nivel = 'intermedio', cantidad = 10, instrucciones = '' } = req.body || {};
    const total = Math.min(Math.max(parseInt(cantidad, 10) || 10, 3), 30);

    const sys = `Eres un experto en diseño de evaluaciones para procesos de selección. Devuelves SIEMPRE un único JSON válido sin texto adicional.`;
    const userPrompt = [
      `Genera un test ${tipo} de nivel ${nivel}${categoria ? ` sobre ${categoria}` : ''} con exactamente ${total} preguntas.`,
      `Cada pregunta debe ser de opción única ("single") con 4 alternativas y exactamente una correcta.`,
      `Marca la opción correcta con "correcta": true.`,
      instrucciones ? `Instrucciones adicionales: ${instrucciones}` : '',
      `Devuelve un JSON con esta forma exacta (sin envolturas):`,
      `{"titulo":"...","descripcion":"...","categoria":"...","preguntas":[{"id":"q1","enunciado":"...","tipo":"single","puntaje":1,"opciones":[{"id":"a","texto":"...","correcta":false},{"id":"b","texto":"...","correcta":true},{"id":"c","texto":"...","correcta":false},{"id":"d","texto":"...","correcta":false}]}]}`,
    ].filter(Boolean).join('\n');

    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: sys }, { role: 'user', content: userPrompt }],
        response_format: { type: 'json_object' },
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      if (r.status === 429) return res.status(429).json({ error: 'Límite de uso alcanzado, intenta más tarde.' });
      if (r.status === 402) return res.status(402).json({ error: 'Sin créditos en Lovable AI. Agrega créditos para continuar.' });
      return res.status(502).json({ error: `Error de IA: ${t.slice(0, 200)}` });
    }
    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content || '{}';
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return res.status(502).json({ error: 'La IA devolvió contenido no parseable.' }); }
    // Normaliza ids únicos
    const preguntas = Array.isArray(parsed.preguntas) ? parsed.preguntas : [];
    parsed.preguntas = preguntas.slice(0, total).map((q, i) => ({
      id: q.id || `q${i + 1}`,
      enunciado: String(q.enunciado || '').slice(0, 500),
      tipo: q.tipo === 'multi' || q.tipo === 'texto' ? q.tipo : 'single',
      puntaje: Number(q.puntaje) || 1,
      opciones: Array.isArray(q.opciones)
        ? q.opciones.slice(0, 6).map((o, j) => ({
            id: o.id || String.fromCharCode(97 + j),
            texto: String(o.texto || '').slice(0, 240),
            correcta: !!o.correcta,
          }))
        : [],
    }));
    res.json({
      titulo: parsed.titulo || `Test ${tipo} ${categoria || ''}`.trim(),
      descripcion: parsed.descripcion || null,
      tipo,
      categoria: parsed.categoria || categoria || null,
      preguntas: parsed.preguntas,
    });
  } catch (e) { next(e); }
}
