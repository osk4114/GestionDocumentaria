-- Script para limpiar datos de prueba
-- Ejecutar con: source cleanup-test-data.sql; en MySQL

USE sgd_db;

-- Deshabilitar verificación de FK temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar usuario TEST (id: 3)
DELETE FROM users WHERE id = 3;

-- Eliminar rol TEST (id: 3)
DELETE FROM roles WHERE id = 3;

-- Eliminar permisos del rol TEST
DELETE FROM role_permissions WHERE rol_id = 3;

-- Rehabilitar verificación de FK
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar que se eliminaron
SELECT 'Usuarios después de limpieza:' as mensaje;
SELECT id, nombre, email, rol_id, area_id, is_active FROM users;

SELECT 'Roles después de limpieza:' as mensaje;
SELECT id, nombre, area_id FROM roles;
