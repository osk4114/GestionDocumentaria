-- ============================================================
-- Migración: Agregar campos adicionales a tabla senders
-- Fecha: 2025-10-28
-- Descripción: Agregar campos para persona natural y jurídica
-- ============================================================

USE sgd_db;

-- Agregar campos para persona natural
ALTER TABLE senders
ADD COLUMN nombres VARCHAR(100) COMMENT 'Nombres (persona natural)' AFTER nombre_completo,
ADD COLUMN apellido_paterno VARCHAR(100) COMMENT 'Apellido paterno (persona natural)' AFTER nombres,
ADD COLUMN apellido_materno VARCHAR(100) COMMENT 'Apellido materno (persona natural)' AFTER apellido_paterno;

-- Agregar campos para persona jurídica
ALTER TABLE senders
ADD COLUMN ruc VARCHAR(11) COMMENT 'RUC (persona jurídica)' AFTER apellido_materno,
ADD COLUMN nombre_empresa VARCHAR(200) COMMENT 'Nombre de empresa (persona jurídica)' AFTER ruc;

-- Agregar campos para representante legal (persona jurídica)
ALTER TABLE senders
ADD COLUMN representante_tipo_doc ENUM('DNI', 'CE', 'PASAPORTE') COMMENT 'Tipo doc representante' AFTER nombre_empresa,
ADD COLUMN representante_num_doc VARCHAR(20) COMMENT 'Número doc representante' AFTER representante_tipo_doc,
ADD COLUMN representante_nombres VARCHAR(100) COMMENT 'Nombres representante' AFTER representante_num_doc,
ADD COLUMN representante_apellido_paterno VARCHAR(100) COMMENT 'Apellido paterno representante' AFTER representante_nombres,
ADD COLUMN representante_apellido_materno VARCHAR(100) COMMENT 'Apellido materno representante' AFTER representante_apellido_paterno;

-- Agregar campos de dirección detallada
ALTER TABLE senders
ADD COLUMN departamento VARCHAR(50) COMMENT 'Departamento' AFTER representante_apellido_materno,
ADD COLUMN provincia VARCHAR(50) COMMENT 'Provincia' AFTER departamento,
ADD COLUMN distrito VARCHAR(50) COMMENT 'Distrito' AFTER provincia,
ADD COLUMN direccion_completa TEXT COMMENT 'Dirección completa' AFTER distrito;

-- Actualizar tipo_documento para incluir CE
ALTER TABLE senders
MODIFY COLUMN tipo_documento ENUM('DNI', 'RUC', 'PASAPORTE', 'CARNET_EXTRANJERIA', 'CE') COMMENT 'Tipo de documento';

SELECT 'Migración completada exitosamente' AS status;
