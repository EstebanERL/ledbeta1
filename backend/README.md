# TalentForge — Backend (Express + MySQL)

REST API para el sistema de gestión de contratación y selección.
**Sin Prisma.** Solo `mysql2` puro → compatible con MySQL Workbench y Aiven.

## Stack
- Node.js 18+ · Express 4
- **MySQL 8** vía `mysql2/promise` (pool)
- JWT + bcryptjs + RBAC (`super_admin`, `rrhh`, `evaluador`, `candidato`)
- Multer (uploads), Helmet, CORS, rate-limit, Zod

## Setup local (con MySQL Workbench)

1. **Crear la base de datos** desde MySQL Workbench:
   ```sql
   CREATE DATABASE talentforge;
   USE talentforge;
   ```
   Luego abre `backend/sql/schema.sql` en Workbench y ejecútalo completo (botón ⚡).

2. **Configurar entorno y arrancar**:
   ```bash
   cd backend
   cp .env.example .env       # edita DB_PASSWORD, JWT_SECRET
   npm install
   npm run db:seed            # crea admin@talentforge.io / Admin123!
   npm run dev                # http://localhost:4000
   ```

> Alternativa sin Workbench: `npm run db:init` crea la BD y carga `schema.sql` automáticamente.

## Estructura

```
backend/
├── sql/
│   └── schema.sql              # ← ejecutar en MySQL Workbench
├── src/
│   ├── server.js
│   ├── app.js
│   ├── config/db.js            # pool mysql2 + helpers query/queryOne
│   ├── scripts/
│   │   ├── init-db.js          # npm run db:init
│   │   └── seed.js             # npm run db:seed
│   ├── controllers/            # auth, users, vacantes, postulaciones
│   ├── routes/
│   ├── middleware/             # auth (JWT), role (RBAC), upload, error
│   └── utils/jwt.js
└── uploads/                    # servido en /uploads
```

## Endpoints

| Método | Ruta | Auth | Roles |
| --- | --- | --- | --- |
| GET  | `/api/health` | — | — |
| POST | `/api/auth/register` | — | — |
| POST | `/api/auth/login` | — | — |
| GET  | `/api/auth/me` | JWT | any |
| GET  | `/api/vacantes/public` | — | — |
| GET  | `/api/vacantes/:id` | — | — |
| GET  | `/api/vacantes` | JWT | rrhh, super_admin |
| POST | `/api/vacantes` | JWT | rrhh, super_admin |
| PATCH| `/api/vacantes/:id` | JWT | rrhh, super_admin |
| DELETE | `/api/vacantes/:id` | JWT | rrhh, super_admin |
| POST | `/api/postulaciones` (multipart `cv`) | JWT | candidato |
| GET  | `/api/postulaciones/me` | JWT | candidato |
| GET  | `/api/postulaciones/vacante/:vacanteId` | JWT | rrhh, evaluador, super_admin |
| PATCH| `/api/postulaciones/:id` | JWT | rrhh, evaluador, super_admin |
| GET  | `/api/users` | JWT | super_admin |
| PATCH| `/api/users/:id/role` | JWT | super_admin |

## Despliegue (Render + Aiven)

- **Aiven MySQL**: crea el servicio, copia host/puerto/usuario/password a `.env`, pon `DB_SSL=true`. Luego ejecuta `npm run db:init` desde tu máquina apuntando a Aiven, o pega `sql/schema.sql` en su consola SQL.
- **Render Web Service**: root `backend/`, build `npm install`, start `npm start`, configura las mismas variables de entorno y `CORS_ORIGIN=https://tu-frontend.vercel.app`.
- **Uploads** en Render: monta un Persistent Disk en `/opt/render/project/src/backend/uploads` (o cambia a S3).

## Credenciales por defecto (seed)
- `admin@talentforge.io` / `Admin123!`
