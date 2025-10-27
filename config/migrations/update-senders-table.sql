-- Migración para actualizar la tabla senders con el nuevo diseño de Mesa de Partes
-- Fecha: 2025-10-27

-- 1. Agregar nueva columna tipo_persona
ALTER TABLE senders 
ADD COLUMN tipo_persona ENUM('natural', 'juridica') NOT NULL DEFAULT 'natural' AFTER id;

-- 2. Hacer opcionales las columnas que antes eran obligatorias
ALTER TABLE senders 
MODIFY COLUMN nombre_completo VARCHAR(150) NULL,
MODIFY COLUMN tipo_documento ENUM('DNI', 'RUC', 'PASAPORTE', 'CARNET_EXTRANJERIA') NULL,
MODIFY COLUMN numero_documento VARCHAR(20) NULL;

-- 3. Hacer obligatorios email y telefono (ahora son los campos principales)
ALTER TABLE senders 
MODIFY COLUMN email VARCHAR(100) NOT NULL,
MODIFY COLUMN telefono VARCHAR(20) NOT NULL;

-- 4. Eliminar el índice único de numero_documento si existe
ALTER TABLE senders DROP INDEX numero_documento;

-- 5. Crear índice compuesto para email + telefono (para evitar duplicados exactos)
ALTER TABLE senders 
ADD INDEX idx_email_telefono (email, telefono);

-- Comentarios:
-- - tipo_persona: Diferencia entre persona natural y jurídica
-- - email y telefono son ahora obligatorios (campos principales del formulario)
-- - nombre_completo, tipo_documento, numero_documento son opcionales (para retrocompatibilidad)
-- - Se eliminó la restricción UNIQUE de numero_documento ya que ahora es opcional
