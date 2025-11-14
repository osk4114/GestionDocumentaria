-- ============================================
-- Migración: Sistema de Cargos por Área (MariaDB)
-- Fecha: 2025-01-13
-- Descripción: Permite conservar versiones de documentos como "cargos"
--              compartidos a nivel de área para referencia futura
-- ============================================

-- 1. Crear tabla de cargos
CREATE TABLE IF NOT EXISTS document_cargos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  area_id INT NOT NULL,
  version_id INT NOT NULL,
  custom_name VARCHAR(255) DEFAULT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
  FOREIGN KEY (version_id) REFERENCES document_versions(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Índices para rendimiento
CREATE INDEX idx_cargos_area ON document_cargos(area_id);
CREATE INDEX idx_cargos_version ON document_cargos(version_id);
CREATE INDEX idx_cargos_created_by ON document_cargos(created_by);

-- 3. Insertar nuevos permisos para cargos
INSERT INTO permissions (codigo, nombre, descripcion, categoria, isActive) VALUES
('area_mgmt.cargos.create', 'Crear Cargos', 'Puede conservar versiones como cargos en la bandeja del área', 'area_management', TRUE),
('area_mgmt.cargos.view', 'Ver Cargos del Área', 'Puede ver cargos almacenados en la bandeja del área', 'area_management', TRUE),
('area_mgmt.cargos.edit', 'Editar Nombre de Cargos', 'Puede renombrar cargos del área', 'area_management', TRUE),
('area_mgmt.cargos.delete', 'Eliminar Cargos del Área', 'Puede eliminar cargos del área', 'area_management', TRUE)
ON DUPLICATE KEY UPDATE codigo=codigo;

-- 4. Asignar permisos a roles existentes

-- Encargado de Área: Todos los permisos de cargos
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.nombre = 'ENCARGADO DE ÁREA'
  AND p.codigo IN (
    'area_mgmt.cargos.create',
    'area_mgmt.cargos.view',
    'area_mgmt.cargos.edit',
    'area_mgmt.cargos.delete'
  )
ON DUPLICATE KEY UPDATE rol_id=rol_id;

-- Secretaria: Crear, ver y editar cargos
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.nombre = 'SECRETARIA'
  AND p.codigo IN (
    'area_mgmt.cargos.create',
    'area_mgmt.cargos.view',
    'area_mgmt.cargos.edit'
  )
ON DUPLICATE KEY UPDATE rol_id=rol_id;

-- Practicante: Crear, ver, editar y eliminar cargos
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.nombre = 'Practicante'
  AND p.codigo IN (
    'area_mgmt.cargos.create',
    'area_mgmt.cargos.view',
    'area_mgmt.cargos.edit',
    'area_mgmt.cargos.delete'
  )
ON DUPLICATE KEY UPDATE rol_id=rol_id;

-- Administrador: Todos los permisos de cargos
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.nombre = 'Administrador'
  AND p.codigo IN (
    'area_mgmt.cargos.create',
    'area_mgmt.cargos.view',
    'area_mgmt.cargos.edit',
    'area_mgmt.cargos.delete'
  )
ON DUPLICATE KEY UPDATE rol_id=rol_id;

-- 5. Verificar resultados
SELECT 
  COUNT(*) as total_permisos_cargos
FROM permissions 
WHERE codigo LIKE 'area_mgmt.cargos%';

SELECT 
  r.nombre as rol,
  COUNT(rp.permission_id) as permisos_cargos
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.rol_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.codigo LIKE 'area_mgmt.cargos%'
WHERE r.nombre IN ('Administrador', 'ENCARGADO DE ÁREA', 'SECRETARIA', 'Practicante')
GROUP BY r.nombre
ORDER BY r.nombre;

-- ============================================
-- RESULTADO ESPERADO:
-- - Tabla document_cargos creada con índices
-- - 4 nuevos permisos creados (area_mgmt.cargos.*)
-- - Permisos asignados a roles correspondientes
-- ============================================
