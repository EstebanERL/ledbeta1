// Ejecuta sql/2025_add_profile_fields.sql contra la DB existente.
// Uso: npm run db:migrate
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

const dbName = process.env.DB_NAME || 'talentforge';
const useSSL = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

const file = path.resolve('sql/2025_add_profile_fields.sql');
const sql = fs.readFileSync(file, 'utf8');

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  multipleStatements: true,
  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

await conn.query(sql);
console.log('✅ Migración aplicada: columnas de perfil profesional');
await conn.end();
