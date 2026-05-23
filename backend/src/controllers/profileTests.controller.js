import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { query, queryOne } from '../config/db.js';

// Dimensiones del test de perfil profesional
const DIMENSIONES = [
  'personalidad', 'preferencias', 'softSkills',
  'equipo', 'liderazgo', 'comunicacion', 'tecnico',
];

const respuestasSchema = z.array(z.object({
  id: z.string().min(1),
  dimension: z.enum(DIMENSIONES),
  valor: z.number().int().min(1).max(5),
})).min(5).max(60);

function calcularResultados(respuestas) {
  const sumas = Object.fromEntries(DIMENSIONES.map((d) => [d, { suma: 0, n: 0 }]));
  for (const r of respuestas) {
    if (!sumas[r.dimension]) continue;
    sumas[r.dimension].suma += r.valor;
    sumas[r.dimension].n += 1;
  }
  const scores = {};
  for (const d of DIMENSIONES) {
    scores[d] = sumas[d].n ? Math.round((sumas[d].suma / (sumas[d].n * 5)) * 100) : 0;
  }
  const ordenadas = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = ordenadas[0]?.[0];
  const perfilMap = {
    personalidad: 'Perfil equilibrado y reflexivo',
    preferencias: 'Orientado a la autonomía',
    softSkills: 'Alta inteligencia interpersonal',
    equipo: 'Colaborativo de equipo',
    liderazgo: 'Perfil con vocación de liderazgo',
    comunicacion: 'Excelente comunicador',
    tecnico: 'Alta afinidad técnica / analítica',
  };
  const perfil = perfilMap[top] || 'Perfil profesional';
  const resumen = `Tu fortaleza principal es ${top} (${scores[top]}%). ` +
    `Sigue trabajando dimensiones con menor puntaje para complementar tu perfil.`;
  return { scores, perfil, resumen };
}

export async function submitProfileTest(req, res, next) {
  try {
    const respuestas = respuestasSchema.parse(req.body?.respuestas);
    const { scores, perfil, resumen } = calcularResultados(respuestas);
    const existing = await queryOne('SELECT id FROM profile_tests WHERE user_id = ?', [req.user.id]);
    if (existing) {
      await query(
        `UPDATE profile_tests SET respuestas = ?, scores = ?, resumen = ?, perfil = ?, completed_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [JSON.stringify(respuestas), JSON.stringify(scores), resumen, perfil, req.user.id],
      );
    } else {
      await query(
        `INSERT INTO profile_tests (id, user_id, respuestas, scores, resumen, perfil)
         VALUES (?,?,?,?,?,?)`,
        [uuid(), req.user.id, JSON.stringify(respuestas), JSON.stringify(scores), resumen, perfil],
      );
    }
    res.json({ scores, perfil, resumen });
  } catch (e) { next(e); }
}

function parseRow(r) {
  if (!r) return null;
  for (const k of ['respuestas', 'scores']) {
    if (typeof r[k] === 'string') { try { r[k] = JSON.parse(r[k]); } catch { /* ignore */ } }
  }
  return r;
}

export async function getMyProfileTest(req, res, next) {
  try {
    const row = await queryOne(
      `SELECT id, user_id AS userId, respuestas, scores, resumen, perfil, completed_at AS completedAt
         FROM profile_tests WHERE user_id = ?`,
      [req.user.id],
    );
    res.json({ test: parseRow(row) });
  } catch (e) { next(e); }
}

export async function getUserProfileTest(req, res, next) {
  try {
    const row = await queryOne(
      `SELECT id, user_id AS userId, respuestas, scores, resumen, perfil, completed_at AS completedAt
         FROM profile_tests WHERE user_id = ?`,
      [req.params.userId],
    );
    res.json({ test: parseRow(row) });
  } catch (e) { next(e); }
}
