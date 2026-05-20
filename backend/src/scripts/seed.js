import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { pool, query, queryOne } from '../config/db.js';

async function main() {
  const email = 'admin@talentforge.io';
  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    console.log('ℹ️  Admin ya existe:', email);
    return;
  }
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const id = uuid();
  await query(
    `INSERT INTO users (id, email, password_hash, full_name, role)
     VALUES (?, ?, ?, ?, 'super_admin')`,
    [id, email, passwordHash, 'Super Admin'],
  );
  console.log('✅ Admin creado:', email, '/ password: Admin123!');
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => pool.end());
