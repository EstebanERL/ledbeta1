-- ============================================================
-- TalentForge — Migración: flujo de reclutamiento extendido
-- (eventos, mensajes, tests de perfil, tests asignados, entrevistas)
-- Idempotente: el runner ignora errores 1050/1060/1061/1091 etc.
-- ============================================================

-- 1) Ampliar estados de postulación (preserva los actuales)
ALTER TABLE postulaciones
  MODIFY estado ENUM(
    'enviada','en_revision','evaluacion','test_asignado',
    'entrevista','entrevista_pendiente','entrevista_realizada',
    'aprobado','rechazada','contratada'
  ) NOT NULL DEFAULT 'enviada';

-- 2) Timeline / eventos de proceso por postulación
CREATE TABLE IF NOT EXISTS postulacion_eventos (
  id              CHAR(36)     NOT NULL,
  postulacion_id  CHAR(36)     NOT NULL,
  estado          VARCHAR(40)  NULL,
  tipo            VARCHAR(40)  NOT NULL DEFAULT 'estado',
  nota            TEXT         NULL,
  autor_id        CHAR(36)     NULL,
  autor_rol       VARCHAR(40)  NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_evt_post (postulacion_id, created_at),
  CONSTRAINT fk_evt_post FOREIGN KEY (postulacion_id)
    REFERENCES postulaciones(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Chat interno por postulación
CREATE TABLE IF NOT EXISTS postulacion_mensajes (
  id              CHAR(36)     NOT NULL,
  postulacion_id  CHAR(36)     NOT NULL,
  autor_id        CHAR(36)     NOT NULL,
  autor_rol       VARCHAR(40)  NOT NULL,
  mensaje         TEXT         NOT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_msg_post (postulacion_id, created_at),
  CONSTRAINT fk_msg_post FOREIGN KEY (postulacion_id)
    REFERENCES postulaciones(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_msg_autor FOREIGN KEY (autor_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) Test de perfil profesional (1 por usuario, resultados JSON)
CREATE TABLE IF NOT EXISTS profile_tests (
  id              CHAR(36)     NOT NULL,
  user_id         CHAR(36)     NOT NULL,
  respuestas      JSON         NOT NULL,
  scores          JSON         NOT NULL,
  resumen         TEXT         NULL,
  perfil          VARCHAR(80)  NULL,
  completed_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_profile_test_user (user_id),
  CONSTRAINT fk_pt_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) Tests asignables (técnico / psicológico)
CREATE TABLE IF NOT EXISTS tests (
  id            CHAR(36)     NOT NULL,
  titulo        VARCHAR(180) NOT NULL,
  descripcion   TEXT         NULL,
  tipo          ENUM('tecnico','psicologico') NOT NULL DEFAULT 'tecnico',
  preguntas     JSON         NOT NULL,
  creado_por    CHAR(36)     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_test_user FOREIGN KEY (creado_por)
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS test_asignaciones (
  id              CHAR(36)     NOT NULL,
  test_id         CHAR(36)     NOT NULL,
  postulacion_id  CHAR(36)     NOT NULL,
  asignado_por    CHAR(36)     NULL,
  estado          ENUM('pendiente','en_curso','completado','calificado') NOT NULL DEFAULT 'pendiente',
  respuestas      JSON         NULL,
  score           DECIMAL(6,2) NULL,
  max_score       DECIMAL(6,2) NULL,
  observaciones   TEXT         NULL,
  completado_at   DATETIME     NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ta_post (postulacion_id),
  KEY idx_ta_test (test_id),
  CONSTRAINT fk_ta_test FOREIGN KEY (test_id)
    REFERENCES tests(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ta_post FOREIGN KEY (postulacion_id)
    REFERENCES postulaciones(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) Entrevistas programadas por RRHH
CREATE TABLE IF NOT EXISTS entrevistas (
  id               CHAR(36)     NOT NULL,
  postulacion_id   CHAR(36)     NOT NULL,
  programada_para  DATETIME     NOT NULL,
  modalidad        ENUM('presencial','virtual','telefonica') NOT NULL DEFAULT 'virtual',
  link             VARCHAR(400) NULL,
  ubicacion        VARCHAR(200) NULL,
  notas            TEXT         NULL,
  estado           ENUM('programada','realizada','cancelada') NOT NULL DEFAULT 'programada',
  creada_por       CHAR(36)     NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ent_post (postulacion_id, programada_para),
  CONSTRAINT fk_ent_post FOREIGN KEY (postulacion_id)
    REFERENCES postulaciones(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7) Seed de tests por defecto (idempotente con INSERT IGNORE no aplica por PK uuid;
--    se usa SELECT-then-INSERT desde el seed script si se desea).
