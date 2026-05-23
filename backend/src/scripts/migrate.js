// Aplica TODAS las migraciones .sql en orden alfabético desde /sql.
// Ignora errores idempotentes (tabla/columna/índice ya existentes).
// Uso: npm run db:migrate
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

const IGNORE_CODES = new Set([
  'ER_DUP_FIELDNAME',   // 1060 columna ya existe
  'ER_TABLE_EXISTS_ERROR', // 1050 tabla ya existe
  'ER_DUP_KEYNAME',     // 1061 índice/key duplicada
  'ER_DUP_ENTRY',       // 1062 valor duplicado en seed
  'ER_CANT_DROP_FIELD_OR_KEY', // 1091
  'ER_FK_DUP_NAME',     // 1826
  'ER_DUP_CONSTRAINT_NAME', // 3822
]);

function splitStatements(sql) {
  return sql
    .split(/^\s*--.*$/gm).join('\n')        // remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')        // remove block comments
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const dbName = process.env.DB_NAME || 'talentforge';
const useSSL = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  multipleStatements: false,
  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

const dir = path.resolve('sql');
const files = fs.readdirSync(dir)
  .filter((f) => f.endsWith('.sql') && f !== 'schema.sql')
  .sort();

console.log(`→ Aplicando ${files.length} migración(es) desde ${dir}`);

for (const file of files) {
  const sql = fs.readFileSync(path.join(dir, file), 'utf8');
  const statements = splitStatements(sql);
  console.log(`\n· ${file}  (${statements.length} statements)`);
  for (const stmt of statements) {
    try {
      await conn.query(stmt);
      const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
      console.log(`  ok  ${preview}…`);
    } catch (e) {
      if (IGNORE_CODES.has(e.code)) {
        console.log(`  skip (${e.code}) ${stmt.split(/\s+/).slice(0, 4).join(' ')}…`);
      } else {
        console.error(`  FAIL ${e.code || ''} ${e.message}`);
        console.error(`        ${stmt.slice(0, 200)}`);
        process.exitCode = 1;
      }
    }
  }
}

console.log('\nMigración completa.');
await conn.end();
