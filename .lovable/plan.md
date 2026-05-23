# Plan de mejoras TalentForge

Mantengo intacta la arquitectura actual (React+Tailwind / Express+mysql2 / MySQL Aiven / JWT). Solo agrego tablas nuevas, endpoints y vistas. Sin Supabase, sin Prisma, sin romper login.

## 1. Limpieza global (frontend)

- Barrido en `frontend/src/**`: reemplazar todos los emojis (👑 💼 🧠 🚀, ✨, 🎯, etc.) por iconos Lucide React (`Crown`, `Briefcase`, `Brain`, `Rocket`, `Sparkles`, `Target`, …).
- Actualizar `role-theme.ts` para que `symbol` sea un componente Lucide en vez de string emoji, y propagar en `AuthenticatedLayout`, dashboards y `Perfil`.
- Pulir tipografía, espaciados y jerarquía (cards consistentes, `Section`/`PageHeader` reutilizables).

## 2. Panel del candidato

- **Quitar** la barra fake "Completa tu perfil 65%".
- Nueva **Summary Card** con avatar real, nombre, headline, ubicación, skills, estado del CV, nº postulaciones, procesos activos (datos reales desde `/users/me` + `/postulaciones/me`).
- Nueva sección **Empleos recomendados**: matching server-side por skills/headline/departamento → endpoint `GET /vacantes/recomendadas` que cruza palabras clave del perfil con título/descripcion/departamento de vacantes abiertas. Score simple por coincidencias, top 6.

## 3. Página Empleos para candidatos

- Nueva ruta `/empleos` **dentro de `AuthenticatedLayout`** (hoy el sidebar lleva a la landing).
- Lista/grid de vacantes con:
  - Buscador (título/descripcion)
  - Filtros: ubicación, departamento, modalidad, tipo contrato, rango salarial (slider)
  - Ordenar: recientes, salario, título
  - Modal de detalle con descripción completa, requisitos, beneficios y botón Postular (reutiliza flujo actual).
- La landing pública sigue existiendo (sin auth) en su ruta actual.

## 4. Test de perfil profesional

- Nueva tabla `profile_tests` (id, user_id, results JSON, summary, completed_at).
- Nueva ruta `/test-perfil` para candidatos con cuestionario dinámico (~20 preguntas Likert + opción múltiple) cubriendo: personalidad, preferencias laborales, soft skills, equipo, liderazgo, comunicación, afinidad técnica.
- Endpoint `POST /profile-tests` guarda respuestas y calcula scores por dimensión + recomendaciones de perfil.
- `GET /profile-tests/me` y `GET /profile-tests/user/:id` (RRHH/evaluador/admin).
- Visible en `Perfil` del candidato y en el drawer de `Candidatos.tsx` (RRHH/eval).

## 5. Tracking de postulaciones

- Nueva tabla `postulacion_eventos` (id, postulacion_id, estado, nota, autor_id, created_at).
- Trigger en backend: cada cambio de estado en `/postulaciones/:id` registra evento automáticamente; permite añadir notas manuales.
- Frontend `MisPostulaciones.tsx`: timeline vertical con estados (`enviada → en_revision → evaluacion → test_asignado → entrevista_pendiente → entrevista_realizada → aprobado/rechazado/contratado`), responsable actual, fechas, próximas acciones.
- Ampliar ENUM `estado` en `postulaciones` añadiendo: `test_asignado`, `entrevista_pendiente`, `entrevista_realizada`, `aprobado`.

## 6. Chat por postulación

- Nueva tabla `postulacion_mensajes` (id, postulacion_id, autor_id, autor_rol, mensaje, created_at).
- Endpoints: `GET /postulaciones/:id/mensajes`, `POST /postulaciones/:id/mensajes`.
- Acceso: candidato dueño, RRHH, super_admin, evaluador asignado.
- UI: panel/drawer de chat con polling cada 8 s. Sin websockets.

## 7. Flujo evaluador → tests asignados

- Nuevas tablas:
  - `tests` (id, titulo, descripcion, tipo `tecnico|psicologico`, creado_por, created_at).
  - `test_preguntas` (id, test_id, enunciado, tipo `single|multi|texto`, opciones JSON, puntaje).
  - `test_asignaciones` (id, test_id, postulacion_id, asignado_por, estado, score, observaciones, completado_at).
  - `test_respuestas` (id, asignacion_id, pregunta_id, respuesta JSON, puntaje).
- Endpoints CRUD básicos: `/tests`, `/tests/:id/preguntas`, `/test-asignaciones`, `/test-asignaciones/:id/responder`, `/test-asignaciones/:id/calificar`.
- UI:
  - Evaluador (`/evaluaciones`): crear tests, asignar a postulación, revisar respuestas, calificar, aprobar/rechazar.
  - Candidato: nueva ruta `/mis-tests` para responder tests asignados.

## 8. Flujo RRHH / entrevistas

- Nueva tabla `entrevistas` (id, postulacion_id, programada_para, modalidad, link, notas, estado, creada_por).
- Endpoints `/entrevistas` (POST/GET/PATCH).
- Al aprobar evaluador, postulación pasa a `aprobado`; RRHH puede programar entrevista → estado `entrevista_pendiente`; tras realizarla → `entrevista_realizada`; luego `contratada` o `rechazada`.
- UI RRHH (`/candidatos`): acciones para programar/editar entrevista, registrar notas, mover etapas.

## 9. Automatización de vacantes (backend)

En `vacantes.controller.js`:

- Helper `enforceVisibility(vacante)`:
  - Si `estado ∈ {cerrada, borrador}` → `publicada = false`.
  - Si `estado ∈ {abierta, pausada}` → respeta input pero permitido.
- Aplicado en create/update.
- Al actualizar postulación a `contratada`:
  - Contar contratadas de la vacante.
  - Si `>= vacantes_disponibles` → set `estado='cerrada'`, `publicada=false` automáticamente.
  - Registrar evento en timeline.

## 10. Migración SQL

Nuevo archivo idempotente `backend/sql/2025_recruitment_flow.sql`:

```text
ALTER TABLE postulaciones MODIFY estado ENUM(... + nuevos);
CREATE TABLE IF NOT EXISTS postulacion_eventos (...);
CREATE TABLE IF NOT EXISTS postulacion_mensajes (...);
CREATE TABLE IF NOT EXISTS profile_tests (...);
CREATE TABLE IF NOT EXISTS tests (...);
CREATE TABLE IF NOT EXISTS test_preguntas (...);
CREATE TABLE IF NOT EXISTS test_asignaciones (...);
CREATE TABLE IF NOT EXISTS test_respuestas (...);
CREATE TABLE IF NOT EXISTS entrevistas (...);
```

El runner `scripts/migrate.js` ya recorre `sql/*.sql`, así que basta con:

```
cd backend
npm run db:migrate
```

## 11. Resumen final de cambios para el usuario

Al terminar entregaré una lista con:

- Nuevas rutas frontend: `/empleos` (auth), `/test-perfil`, `/mis-tests`.
- Endpoints nuevos: `GET /vacantes/recomendadas`, `*/profile-tests*`, `*/postulaciones/:id/mensajes`, `*/postulaciones/:id/eventos`, `/tests*`, `/test-asignaciones*`, `/entrevistas*`.
- Tablas nuevas + ENUM ampliado.
- Comandos a ejecutar: `cd backend && npm run db:migrate && npm run dev` y `cd frontend && npm run dev`.

¿Apruebas este plan o quieres recortar algún bloque (p. ej. dejar tests/chat para una segunda iteración)?
