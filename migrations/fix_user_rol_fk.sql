-- ============================================================
-- Migración: Permitir NULL en users.rol_id y cambiar FK a ON DELETE SET NULL
-- Fecha: 2025-11-13
-- Objetivo: Permitir eliminación de roles sin bloqueos de FK
-- ============================================================

USE sgd_db;

-- 1. Eliminar la FK constraint existente
ALTER TABLE users DROP FOREIGN KEY users_ibfk_1;

-- 2. Modificar la columna rol_id para permitir NULL
ALTER TABLE users MODIFY COLUMN rol_id INT NULL COMMENT 'Rol del usuario - NULL permite eliminar roles sin bloqueos de FK';

-- 3. Recrear la FK constraint con ON DELETE SET NULL
ALTER TABLE users 
ADD CONSTRAINT users_ibfk_1 
FOREIGN KEY (rol_id) 
REFERENCES roles(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- 4. Verificar los cambios
SHOW CREATE TABLE users;

SELECT 'Migración completada exitosamente' as mensaje;
