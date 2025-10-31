-- ============================================================
-- Migración: Agregar columna categoria_id a tabla documents
-- Fecha: 2025-10-31
-- Descripción: Agregar soporte para categorías personalizadas por área
-- ============================================================

USE sgd_db;

-- Agregar columna categoria_id si no existe
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS categoria_id INT NULL COMMENT 'ID de categoría personalizada del área' AFTER doc_type_id,
ADD INDEX IF NOT EXISTS idx_categoria_id (categoria_id);

-- Agregar foreign key si no existe (comentado por si las categorías aún no están creadas)
-- ALTER TABLE documents
-- ADD CONSTRAINT fk_documents_categoria
-- FOREIGN KEY (categoria_id) REFERENCES area_document_categories(id)
-- ON DELETE SET NULL
-- ON UPDATE CASCADE;

SELECT 'Migración completada: categoria_id agregada a documents' AS status;
