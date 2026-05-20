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

export async function listPublic(req, res, next) {
  try {
    const { departamento, modalidad, contrato, q } = req.query;
    const where = ['publicada = 1', "estado = 'abierta'"];
    const params = [];
    if (departamento) { where.push('departamento = ?'); params.push(String(departamento)); }
    if (modalidad)    { where.push('modalidad = ?');    params.push(String(modalidad)); }
    if (contrato)     { where.push('tipo_contrato = ?'); params.push(String(contrato)); }
    if (q)            { where.push('titulo LIKE ?');    params.push(`%${String(q)}%`); }

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
        d.vacantesDisponibles, d.estado, d.publicada ? 1 : 0,
        d.publicada ? new Date() : null,
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
    if (d.publicada !== undefined) {
      sets.push('publicada = ?'); params.push(d.publicada ? 1 : 0);
      if (d.publicada === true) { sets.push('fecha_publicacion = ?'); params.push(new Date()); }
    }
    if (d.fechaCierre !== undefined) {
      sets.push('fecha_cierre = ?'); params.push(d.fechaCierre ? new Date(d.fechaCierre) : null);
    }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    const result = await query(`UPDATE vacantes SET ${sets.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Vacante not found' });
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
