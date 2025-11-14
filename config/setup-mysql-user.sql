-- ============================================================
-- Script para configurar usuario de MySQL en producción
-- Ejecutar como root ANTES de init-database.sql
-- 
-- USO:
--   sudo mysql -u root -p < config/setup-mysql-user.sql
-- 
-- IMPORTANTE:
-- - Este script crea el usuario summer4114 con la contraseña configurada
-- - Otorga todos los permisos sobre la base de datos sgd_db
-- - Es idempotente (puede ejecutarse múltiples veces)
-- ============================================================

-- Eliminar usuario si existe (para poder recrearlo con nueva contraseña)
DROP USER IF EXISTS 'summer4114'@'localhost';

-- Crear usuario con contraseña
CREATE USER 'summer4114'@'localhost' IDENTIFIED BY 'screamer-1';

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS sgd_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Otorgar todos los privilegios sobre sgd_db
GRANT ALL PRIVILEGES ON sgd_db.* TO 'summer4114'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar usuario creado
SELECT 
    User as 'Usuario',
    Host as 'Host',
    '✅ Usuario creado exitosamente' as 'Estado'
FROM mysql.user 
WHERE User = 'summer4114';

-- Verificar base de datos
SELECT 
    SCHEMA_NAME as 'Base de Datos',
    DEFAULT_CHARACTER_SET_NAME as 'Charset',
    DEFAULT_COLLATION_NAME as 'Collation',
    '✅ Base de datos lista' as 'Estado'
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'sgd_db';

-- ============================================================
-- Credenciales configuradas:
-- Usuario: summer4114
-- Password: screamer-1
-- Base de datos: sgd_db
-- 
-- Próximo paso: Ejecutar init-database.sql
-- ============================================================
