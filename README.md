# TalentForge — Sistema de Gestión de Contratación

Monorepo con **frontend** y **backend** completamente independientes, listos para correr en tu PC.

```
.
├── backend/    Node.js + Express + MySQL (sin Prisma)
└── frontend/   React + Vite + Tailwind + React Router
```

## Requisitos previos
- Node.js 18+
- MySQL 8 (local con MySQL Workbench o remoto en Aiven)

## Arranque rápido

```bash
# 1) Base de datos
#    Abre MySQL Workbench y ejecuta backend/sql/schema.sql
#    (o alternativamente: cd backend && npm run db:init)

# 2) Backend
cd backend
cp .env.example .env       # edita DB_PASSWORD y JWT_SECRET
npm install
npm run db:seed            # crea admin@talentforge.io / Admin123!
npm run dev                # http://localhost:4000

# 3) Frontend (en otra terminal)
cd frontend
cp .env.example .env       # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                # http://localhost:5173
```

## Despliegue

| Capa | Recomendado |
|------|-------------|
| Frontend | Vercel — `cd frontend && vercel` |
| Backend  | Render — Web Service, root `backend/` |
| MySQL    | Aiven — copiar credenciales a `backend/.env` y `DB_SSL=true` |

Ver `backend/README.md` para el detalle de endpoints y deployment.
