-- ============================================================
-- TalentForge — Esquema MySQL 8.x
-- Compatible con MySQL Workbench y Aiven MySQL
-- Uso desde Workbench:
--   1) Crear schema:   CREATE DATABASE talentforge;
--   2) USE talentforge;
--   3) Ejecutar este archivo completo.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS postulaciones;
DROP TABLE IF EXISTS vacantes;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id             CHAR(36)       NOT NULL,
  email          VARCHAR(255)   NOT NULL,
  password_hash  VARCHAR(255)   NOT NULL,
  full_name      VARCHAR(150)   NOT NULL,
  avatar_url     VARCHAR(500)   NULL,
  role           ENUM('super_admin','rrhh','evaluador','candidato')
                                NOT NULL DEFAULT 'candidato',
  created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VACANTES
-- ============================================================
CREATE TABLE vacantes (
  id                    CHAR(36)       NOT NULL,
  titulo                VARCHAR(200)   NOT NULL,
  descripcion           TEXT           NOT NULL,
  departamento          VARCHAR(100)   NOT NULL,
  ubicacion             VARCHAR(150)   NOT NULL,
  modalidad             ENUM('presencial','remoto','hibrido')
                                       NOT NULL DEFAULT 'presencial',
  tipo_contrato         ENUM('indefinido','temporal','practicas','freelance','prestacion_servicios')
                                       NOT NULL DEFAULT 'indefinido',
  salario_min           DECIMAL(12,2)  NULL,
  salario_max           DECIMAL(12,2)  NULL,
  moneda                VARCHAR(8)     NOT NULL DEFAULT 'COP',
  requisitos            TEXT           NULL,
  beneficios            TEXT           NULL,
  vacantes_disponibles  INT            NOT NULL DEFAULT 1,
  estado                ENUM('borrador','abierta','pausada','cerrada')
                                       NOT NULL DEFAULT 'borrador',
  publicada             TINYINT(1)     NOT NULL DEFAULT 0,
  fecha_publicacion     DATETIME       NULL,
  fecha_cierre          DATETIME       NULL,
  created_by_id         CHAR(36)       NOT NULL,
  created_at            DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vacantes_estado_pub (estado, publicada),
  KEY idx_vacantes_departamento (departamento),
  KEY idx_vacantes_created_by (created_by_id),
  CONSTRAINT fk_vacantes_user
    FOREIGN KEY (created_by_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- POSTULACIONES
-- ============================================================
CREATE TABLE postulaciones (
  id            CHAR(36)       NOT NULL,
  vacante_id    CHAR(36)       NOT NULL,
  candidato_id  CHAR(36)       NOT NULL,
  estado        ENUM('enviada','en_revision','evaluacion','entrevista','rechazada','contratada')
                               NOT NULL DEFAULT 'enviada',
  cv_url        VARCHAR(500)   NULL,
  notas         TEXT           NULL,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_post_vac_cand (vacante_id, candidato_id),
  KEY idx_post_candidato (candidato_id),
  CONSTRAINT fk_post_vacante
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_post_candidato
    FOREIGN KEY (candidato_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
