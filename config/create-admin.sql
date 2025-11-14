-- ============================================================
-- Script para crear Usuario Administrador
-- Ejecutar DESPUÉS de init-database.sql
-- 
-- IMPORTANTE:
-- - Cambiar la contraseña después del primer login
-- - El hash es para: Admin123!
-- - Ejecutar solo UNA VEZ
-- ============================================================

-- Conectar con: mysql -u summer4114 -p sgd_db
USE sgd_db;

-- Insertar usuario administrador
-- Password: Admin123! (hash bcrypt)
INSERT INTO users (nombre, email, password, rol_id, area_id, is_active)
SELECT 
    'Administrador del Sistema',
    'admin@sgd.gob.pe',
    '$2a$10$rZLUvz8qP6Y0UqTxXQGCOeXEfP5JYKfGYN4Yr4vxKJbKJ3KnXZ8Ei',  -- Admin123!
    (SELECT id FROM roles WHERE nombre = 'Administrador'),
    NULL,  -- Sin área específica (acceso global)
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@sgd.gob.pe'
);

-- Verificar creación
SELECT 
    'Usuario Administrador creado exitosamente' AS mensaje,
    id,
    nombre,
    email,
    'Admin123!' AS password_temporal,
    '⚠️ CAMBIAR INMEDIATAMENTE' AS nota
FROM users 
WHERE email = 'admin@sgd.gob.pe';

-- ============================================================
-- Credenciales de acceso:
-- Email:    admin@sgd.gob.pe
-- Password: Admin123!
--
-- ⚠️ IMPORTANTE: Cambiar contraseña después del primer login
-- ============================================================
