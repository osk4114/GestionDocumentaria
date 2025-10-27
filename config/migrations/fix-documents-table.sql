-- ============================================================
-- Migración: Corrección de tabla documents
-- Fecha: 2025-10-27
-- Descripción: Permitir NULL en doc_type_id y agregar fecha_recepcion
-- ============================================================

USE sgd_db;

-- 1. Modificar doc_type_id para permitir NULL
ALTER TABLE documents 
MODIFY COLUMN doc_type_id INT NULL 
COMMENT 'Tipo de documento - NULL permitido para documentos sin clasificar desde mesa de partes';

-- 2. Agregar campo fecha_recepcion (si no existe)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS fecha_recepcion TIMESTAMP NULL 
COMMENT 'Fecha en que fue recepcionado el documento'
AFTER created_at;

-- Verificar cambios
SELECT 
    COLUMN_NAME as 'Campo',
    COLUMN_TYPE as 'Tipo',
    IS_NULLABLE as 'Null',
    COLUMN_DEFAULT as 'Default',
    COLUMN_COMMENT as 'Comentario'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'sgd_db'
    AND TABLE_NAME = 'documents'
    AND COLUMN_NAME IN ('doc_type_id', 'fecha_recepcion')
ORDER BY ORDINAL_POSITION;
