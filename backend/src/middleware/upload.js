import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const uploadDir = process.env.UPLOAD_DIR || path.resolve('uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const id = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${id}${path.extname(file.originalname)}`);
  },
});

const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

export const upload = multer({
  storage,
  limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB) || 10) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});
