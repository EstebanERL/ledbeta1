import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { query, queryOne } from '../config/db.js';

const vacanteSchema = z.object({
  titulo: z.string().min(2).max(200),
  descripcion: z.string().min(10),
  departamento: z.string().min(1).max(100),
  ubicacion: z.string().min(1).max(150),
  modalidad: z.enum(['presencial', 'remoto', 'hibrido']).default('presencial'),
  tipoContrato: z.enum(['indefinido', 'temporal', 'practicas', 'freelance', 'prestacion_servicios']).default('indefinido'),
  salarioMin: z.number().nonnegative().optional().nullable(),
  salarioMax: z.number().nonnegative().optional().nullable(),
  moneda: z.string().max(8).default('COP'),
  requisitos: z.string().optional().nullable(),
  beneficios: z.string().optional().nullable(),
  vacantesDisponibles: z.number().int().positive().default(1),
  estado: z.enum(['borrador', 'abierta', 'pausada', 'cerrada']).default('borrador'),
  publicada: z.boolean().default(false),
  fechaCierre: z.string().datetime().optional().nullable(),
});

const SELECT_COLS = `
  id, titulo, descripcion, departamento, ubicacion, modalidad,
  tipo_contrato      AS tipoContrato,
  salario_min        AS salarioMin,
  salario_max        AS salarioMax,
  moneda, requisitos, beneficios,
  vacantes_disponibles AS vacantesDisponibles,
  estado, publicada,
  fecha_publicacion  AS fechaPublicacion,
  fecha_cierre       AS fechaCierre,
  created_by_id      AS createdById,
  created_at         AS createdAt,
  updated_at         AS updatedAt
`;

function mapVacante(r) {
  if (!r) return null;
  return { ...r, publicada: !!r.publicada };
}

/** Si estado ∈ {cerrada,borrador} fuerza publicada=false. */
function enforceVisibility(estado, publicada) {
  if (estado === 'cerrada' || estado === 'borrador') return false;
  return publicada;
}

/** Auto-cierra una vacante si ya cubrió todos los cupos contratados. */
export async function autoCierreVacante(vacanteId) {
  const v = await queryOne(
    'SELECT id, vacantes_disponibles AS cupos, estado FROM vacantes WHERE id = ?',
    [vacanteId],
  );
  if (!v) return;
  const row = await queryOne(
    `SELECT COUNT(*) AS n FROM postulaciones WHERE vacante_id = ? AND estado = 'contratada'`,
    [vacanteId],
  );
  if (Number(row.n) >= Number(v.cupos) && v.estado !== 'cerrada') {
    await query(
      `UPDATE vacantes SET estado = 'cerrada', publicada = 0 WHERE id = ?`,
      [vacanteId],
    );
  }
}

export async function listPublic(req, res, next) {
  try {
    const { departamento, modalidad, contrato, q } = req.query;
    const where = ['publicada = 1', "estado = 'abierta'"];
    const params = [];
    if (departamento) { where.push('departamento = ?'); params.push(String(departamento)); }
    if (modalidad)    { where.push('modalidad = ?');    params.push(String(modalidad)); }
    if (contrato)     { where.push('tipo_contrato = ?'); params.push(String(contrato)); }
    if (q)            { where.push('(titulo LIKE ? OR descripcion LIKE ?)'); params.push(`%${String(q)}%`, `%${String(q)}%`); }

    const rows = await query(
      `SELECT ${SELECT_COLS} FROM vacantes
       WHERE ${where.join(' AND ')}
       ORDER BY fecha_publicacion DESC
       LIMIT 200`,
      params,
    );
    res.json({ items: rows.map(mapVacante) });
  } catch (e) { next(e); }
}

/** Recomendaciones dinámicas para el candidato autenticado. */
export async function recomendadas(req, res, next) {
  try {
    const me = await queryOne(
      'SELECT skills, headline, bio FROM users WHERE id = ?',
      [req.user.id],
    );
    let skills = [];
    try { skills = typeof me?.skills === 'string' ? JSON.parse(me.skills) : (me?.skills || []); } catch {}
    const keywords = [
      ...skills,
      ...String(me?.headline || '').split(/[,\s]+/),
    ].map((s) => String(s).trim().toLowerCase()).filter((s) => s.length > 2);

    const rows = await query(
      `SELECT ${SELECT_COLS} FROM vacantes
       WHERE publicada = 1 AND estado = 'abierta'
       ORDER BY fecha_publicacion DESC
       LIMIT 80`,
    );
    // Excluir vacantes a las que ya se postuló
    const postuladas = await query(
      'SELECT vacante_id FROM postulaciones WHERE candidato_id = ?',
      [req.user.id],
    );
    const ids = new Set(postuladas.map((p) => p.vacante_id));

    const scored = rows
      .filter((v) => !ids.has(v.id))
      .map((v) => {
        const hay = `${v.titulo} ${v.descripcion} ${v.departamento} ${v.requisitos || ''}`.toLowerCase();
        const score = keywords.reduce((acc, k) => acc + (hay.includes(k) ? 1 : 0), 0);
        return { ...mapVacante(v), score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    res.json({ items: scored });
  } catch (e) { next(e); }
}

export async function listAdmin(_req, res, next) {
  try {
    const rows = await query(`SELECT ${SELECT_COLS} FROM vacantes ORDER BY created_at DESC`);
    res.json({ items: rows.map(mapVacante) });
  } catch (e) { next(e); }
}

export async function getOne(req, res, next) {
  try {
    const row = await queryOne(`SELECT ${SELECT_COLS} FROM vacantes WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Vacante not found' });
    res.json({ vacante: mapVacante(row) });
  } catch (e) { next(e); }
}

export async function create(req, res, next) {
  try {
    const d = vacanteSchema.parse(req.body);
    const publicada = enforceVisibility(d.estado, d.publicada);
    const id = uuid();
    await query(
      `INSERT INTO vacantes
        (id, titulo, descripcion, departamento, ubicacion, modalidad, tipo_contrato,
         salario_min, salario_max, moneda, requisitos, beneficios,
         vacantes_disponibles, estado, publicada, fecha_publicacion, fecha_cierre, created_by_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, d.titulo, d.descripcion, d.departamento, d.ubicacion, d.modalidad, d.tipoContrato,
        d.salarioMin ?? null, d.salarioMax ?? null, d.moneda, d.requisitos ?? null, d.beneficios ?? null,
        d.vacantesDisponibles, d.estado, publicada ? 1 : 0,
        publicada ? new Date() : null,
        d.fechaCierre ? new Date(d.fechaCierre) : null,
        req.user.id,
      ],
    );
    const vacante = mapVacante(await queryOne(`SELECT ${SELECT_COLS} FROM vacantes WHERE id = ?`, [id]));
    res.status(201).json({ vacante });
  } catch (e) { next(e); }
}

export async function update(req, res, next) {
  try {
    const d = vacanteSchema.partial().parse(req.body);
    // Carga el estado/publicada actuales para aplicar la regla de visibilidad
    const current = await queryOne('SELECT estado, publicada FROM vacantes WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Vacante not found' });

    const nextEstado = d.estado ?? current.estado;
    const nextPublicada = enforceVisibility(
      nextEstado,
      d.publicada !== undefined ? d.publicada : !!current.publicada,
    );

    const map = {
      titulo: 'titulo', descripcion: 'descripcion', departamento: 'departamento',
      ubicacion: 'ubicacion', modalidad: 'modalidad', tipoContrato: 'tipo_contrato',
      salarioMin: 'salario_min', salarioMax: 'salario_max', moneda: 'moneda',
      requisitos: 'requisitos', beneficios: 'beneficios',
      vacantesDisponibles: 'vacantes_disponibles', estado: 'estado',
    };
    const sets = [];
    const params = [];
    for (const [k, col] of Object.entries(map)) {
      if (d[k] !== undefined) { sets.push(`${col} = ?`); params.push(d[k]); }
    }
    // Siempre aplica la regla de visibilidad cuando cambia estado o publicada
    if (d.estado !== undefined || d.publicada !== undefined) {
      sets.push('publicada = ?'); params.push(nextPublicada ? 1 : 0);
      if (nextPublicada && !current.publicada) {
        sets.push('fecha_publicacion = ?'); params.push(new Date());
      }
    }
    if (d.fechaCierre !== undefined) {
      sets.push('fecha_cierre = ?'); params.push(d.fechaCierre ? new Date(d.fechaCierre) : null);
    }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    await query(`UPDATE vacantes SET ${sets.join(', ')} WHERE id = ?`, params);
    const vacante = mapVacante(await queryOne(`SELECT ${SELECT_COLS} FROM vacantes WHERE id = ?`, [req.params.id]));
    res.json({ vacante });
  } catch (e) { next(e); }
}

export async function remove(req, res, next) {
  try {
    const result = await query('DELETE FROM vacantes WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vacante not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
}
