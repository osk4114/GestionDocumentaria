-- ================================================================
-- MIGRACIÓN: Agregar areaId a document_types
-- Fecha: 2025-11-13
-- Descripción: Permite que tipos de documento sean globales (areaId NULL) 
--              o específicos de un área (areaId NOT NULL)
-- ================================================================

-- 1. Agregar columna area_id a document_types
ALTER TABLE document_types
ADD COLUMN area_id INT NULL AFTER codigo,
ADD CONSTRAINT fk_document_types_area 
  FOREIGN KEY (area_id) REFERENCES areas(id) 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;

-- 2. Crear índice para mejorar performance en búsquedas por área
CREATE INDEX idx_document_types_area_id ON document_types(area_id);

-- 3. Comentar la columna
ALTER TABLE document_types 
MODIFY COLUMN area_id INT NULL 
COMMENT 'ID del área a la que pertenece el tipo (NULL = global, NOT NULL = específico de área)';

-- ================================================================
-- VALIDACIÓN
-- ================================================================
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_KEY,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'sgd_db'
  AND TABLE_NAME = 'document_types'
  AND COLUMN_NAME = 'area_id';

-- Verificar tipos de documento actuales (todos deberían tener area_id = NULL)
SELECT id, nombre, codigo, area_id, is_active
FROM document_types
ORDER BY nombre;

-- ================================================================
-- NOTAS:
-- - Los 5 tipos existentes (Solicitud, Reclamo, Consulta, Oficio, Recurso) 
--   quedan como GLOBALES (area_id = NULL)
-- - Cuando un Encargado de Área crea un tipo, se asigna automáticamente su área
-- - Solo Administradores pueden crear tipos globales (area_id = NULL)
-- ================================================================
