import { query, queryOne } from '../config/db.js';
import { analizarCompatibilidad, recomendarVacantes } from '../services/ai.service.js';

function parseJson(v, fallback) {
  if (v == null) return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

async function loadPostulacionContexto(postulacionId) {
  const post = await queryOne(
    `SELECT p.id, p.estado, p.candidato_id AS candidatoId, p.vacante_id AS vacanteId
       FROM postulaciones p WHERE p.id = ?`,
    [postulacionId],
  );
  if (!post) return null;
  const candidato = await queryOne(
    `SELECT id, full_name AS fullName, email, headline, bio, location, skills, experience, education
       FROM users WHERE id = ?`,
    [post.candidatoId],
  );
  if (candidato) {
    candidato.skills = parseJson(candidato.skills, []);
    candidato.experience = parseJson(candidato.experience, []);
    candidato.education = parseJson(candidato.education, []);
  }
  const vacante = await queryOne(
    `SELECT id, titulo, descripcion, departamento, ubicacion, modalidad,
            tipo_contrato AS tipoContrato, requisitos, beneficios
       FROM vacantes WHERE id = ?`,
    [post.vacanteId],
  );
  const evaluaciones = await query(
    `SELECT t.titulo, t.tipo, ta.score, ta.max_score AS maxScore, ta.estado, ta.observaciones
       FROM test_asignaciones ta JOIN tests t ON t.id = ta.test_id
      WHERE ta.postulacion_id = ?`,
    [postulacionId],
  );
  return { post, candidato, vacante, evaluaciones };
}

export async function getCompatibilidad(req, res, next) {
  try {
    const row = await queryOne(
      `SELECT postulacion_id AS postulacionId, score, fortalezas, debilidades,
              opinion, recomendacion, resumen, generated_at AS generatedAt
         FROM postulacion_compatibilidad WHERE postulacion_id = ?`,
      [req.params.id],
    );
    if (!row) return res.json({ compatibilidad: null });
    row.fortalezas = parseJson(row.fortalezas, []);
    row.debilidades = parseJson(row.debilidades, []);
    res.json({ compatibilidad: row });
  } catch (e) { next(e); }
}

export async function analizarPostulacion(req, res, next) {
  try {
    const ctx = await loadPostulacionContexto(req.params.id);
    if (!ctx) return res.status(404).json({ error: 'Postulación no encontrada' });
    const result = await analizarCompatibilidad({
      candidato: ctx.candidato,
      vacante: ctx.vacante,
      evaluaciones: ctx.evaluaciones,
    });
    await query(
      `INSERT INTO postulacion_compatibilidad
        (postulacion_id, score, fortalezas, debilidades, opinion, recomendacion, resumen, generated_at)
       VALUES (?,?,?,?,?,?,?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         score=VALUES(score), fortalezas=VALUES(fortalezas), debilidades=VALUES(debilidades),
         opinion=VALUES(opinion), recomendacion=VALUES(recomendacion), resumen=VALUES(resumen),
         generated_at=CURRENT_TIMESTAMP`,
      [
        req.params.id, result.score,
        JSON.stringify(result.fortalezas), JSON.stringify(result.debilidades),
        result.opinion, result.recomendacion, result.resumen,
      ],
    );
    res.json({
      compatibilidad: {
        postulacionId: req.params.id,
        ...result,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (e) { next(e); }
}

export async function recomendadasIA(req, res, next) {
  try {
    const me = await queryOne(
      `SELECT id, full_name AS fullName, headline, bio, location, skills, experience, education
         FROM users WHERE id = ?`,
      [req.user.id],
    );
    if (me) {
      me.skills = parseJson(me.skills, []);
      me.experience = parseJson(me.experience, []);
      me.education = parseJson(me.education, []);
    }
    const vacantes = await query(
      `SELECT id, titulo, descripcion, departamento, ubicacion, modalidad,
              tipo_contrato AS tipoContrato, requisitos, beneficios,
              salario_min AS salarioMin, salario_max AS salarioMax, moneda,
              vacantes_disponibles AS vacantesDisponibles, estado, publicada,
              fecha_publicacion AS fechaPublicacion, created_at AS createdAt
         FROM vacantes
        WHERE publicada = 1 AND estado = 'abierta'
        ORDER BY fecha_publicacion DESC LIMIT 30`,
    );
    const postuladas = await query(
      'SELECT vacante_id FROM postulaciones WHERE candidato_id = ?',
      [req.user.id],
    );
    const ids = new Set(postuladas.map((p) => p.vacante_id));
    const disponibles = vacantes.filter((v) => !ids.has(v.id));
    if (disponibles.length === 0) return res.json({ items: [] });

    let scored = [];
    try {
      scored = await recomendarVacantes({ candidato: me, vacantes: disponibles });
    } catch (e) {
      // Fallback: heurística sencilla por skills, no rompemos UX
      const skills = (me?.skills || []).map((s) => String(s).toLowerCase());
      scored = disponibles.map((v) => {
        const hay = `${v.titulo} ${v.descripcion} ${v.departamento} ${v.requisitos || ''}`.toLowerCase();
        const matches = skills.filter((k) => k.length > 2 && hay.includes(k)).length;
        const score = Math.min(100, 40 + matches * 12);
        return { id: v.id, score, motivo: matches
          ? `Coincide con tus habilidades (${matches} coincidencias).`
          : 'Vacante recientemente publicada en tu área.' };
      });
    }

    const byId = new Map(disponibles.map((v) => [v.id, v]));
    const items = scored
      .map((s) => {
        const v = byId.get(s.id);
        if (!v) return null;
        return {
          ...v,
          publicada: !!v.publicada,
          score: s.score,
          motivo: s.motivo,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    res.json({ items });
  } catch (e) { next(e); }
}
