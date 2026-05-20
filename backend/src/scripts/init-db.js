// Inicializa la base de datos ejecutando sql/schema.sql.
// Útil si no quieres abrir MySQL Workbench: npm run db:init
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

const dbName = process.env.DB_NAME || 'talentforge';
const useSSL = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

const schemaPath = path.resolve('sql/schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
  ...(useSSL ? { ssl: { rejectUnauthorized: true } } : {}),
});

await conn.query(
  `CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
);
await conn.query(`USE \`${dbName}\`;`);
await conn.query(sql);

console.log(`✅ Base de datos "${dbName}" inicializada con sql/schema.sql`);
await conn.end();
