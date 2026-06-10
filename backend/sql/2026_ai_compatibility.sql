-- Compatibilidad IA candidato ↔ vacante (cache por postulación)
CREATE TABLE IF NOT EXISTS postulacion_compatibilidad (
  postulacion_id  CHAR(36)     NOT NULL,
  score           INT          NOT NULL DEFAULT 0,
  fortalezas      JSON         NULL,
  debilidades     JSON         NULL,
  opinion         TEXT         NULL,
  recomendacion   TEXT         NULL,
  resumen         TEXT         NULL,
  generated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (postulacion_id),
  CONSTRAINT fk_compat_post FOREIGN KEY (postulacion_id)
    REFERENCES postulaciones(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
