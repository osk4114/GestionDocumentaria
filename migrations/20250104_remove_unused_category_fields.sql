-- Migración: Eliminar campos innecesarios de area_document_categories
-- Fecha: 2025-01-04
-- Descripción: Elimina campos 'icono' y 'requiere_adjunto' que no se usan en el sistema

-- Eliminar columna 'icono' (no profesional para sistema gubernamental)
ALTER TABLE area_document_categories DROP COLUMN IF EXISTS icono;

-- Eliminar columna 'requiere_adjunto' (todos los documentos ya requieren adjuntos obligatorios)
ALTER TABLE area_document_categories DROP COLUMN IF EXISTS requiere_adjunto;

-- Verificar estructura final
DESCRIBE area_document_categories;
