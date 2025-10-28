-- Migration: Remove prioridad column from documents table
-- Date: 2025-10-28
-- Reason: Mesa de Partes Virtual form no longer captures priority field
-- Impact: Priority system completely removed from system

-- Drop prioridad column from documents table
ALTER TABLE documents DROP COLUMN prioridad;

-- Verification query (run after migration)
-- DESCRIBE documents;