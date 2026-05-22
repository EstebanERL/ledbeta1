-- ============================================================
-- Migración aditiva (idempotente): perfil profesional del candidato
-- Ejecutar UNA vez en bases ya creadas (no borra datos).
-- En MySQL/Aiven puedes correrla con: npm run db:migrate
-- ============================================================

-- Helper procedure para ADD COLUMN idempotente
DROP PROCEDURE IF EXISTS add_col_if_missing;
DELIMITER $$
CREATE PROCEDURE add_col_if_missing(
  IN p_table  VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_def    VARCHAR(255)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = p_table
       AND COLUMN_NAME  = p_column
  ) THEN
    SET @s = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_def);
    PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

CALL add_col_if_missing('users', 'phone',         'VARCHAR(40) NULL');
CALL add_col_if_missing('users', 'location',      'VARCHAR(150) NULL');
CALL add_col_if_missing('users', 'headline',      'VARCHAR(180) NULL');
CALL add_col_if_missing('users', 'bio',           'TEXT NULL');
CALL add_col_if_missing('users', 'linkedin_url',  'VARCHAR(300) NULL');
CALL add_col_if_missing('users', 'github_url',    'VARCHAR(300) NULL');
CALL add_col_if_missing('users', 'website_url',   'VARCHAR(300) NULL');
CALL add_col_if_missing('users', 'cv_url',        'VARCHAR(500) NULL');
CALL add_col_if_missing('users', 'skills',        'JSON NULL');
CALL add_col_if_missing('users', 'experience',    'JSON NULL');
CALL add_col_if_missing('users', 'education',     'JSON NULL');
CALL add_col_if_missing('users', 'is_active',     'TINYINT(1) NOT NULL DEFAULT 1');

DROP PROCEDURE IF EXISTS add_col_if_missing;
