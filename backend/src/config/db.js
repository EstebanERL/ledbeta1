import mysql from 'mysql2/promise';

const useSSL = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'talentforge',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: false,
  ...(useSSL ? { ssl: { rejectUnauthorized: true } } : {}),
});

/** Helper: ejecuta una query y devuelve filas tipadas */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/** Helper: primera fila o null */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}
