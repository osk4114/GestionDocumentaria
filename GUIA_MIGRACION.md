# 🚀 GUÍA DE INSTALACIÓN - Sistema RBAC v3.0

## ⚠️ ESTADO ACTUAL DEL PROYECTO

**IMPORTANTE:** El sistema RBAC v3.0 **YA ESTÁ IMPLEMENTADO** en el proyecto.

### **✅ Lo que YA existe:**
- Base de datos con 16 tablas (incluyendo `permissions` y `role_permissions`)
- 77 permisos activos en 12 categorías
- Sistema RBAC completamente funcional
- Backend con middleware de permisos
- Frontend con gestión de roles y permisos
- Modelos Sequelize sincronizados

### **📝 Esta guía es para:**
1. **Nueva instalación desde cero** (desarrollo/testing)
2. **Reinstalación completa** del sistema
3. **NO es necesaria** si ya tienes el proyecto funcionando

---

## 📋 PRE-REQUISITOS

Antes de comenzar, asegúrate de tener:
- ✅ Acceso a phpMyAdmin o MySQL CLI
- ✅ Permisos de administrador de base de datos
- ✅ Node.js v18+ instalado
- ✅ MySQL 8.0+ instalado y corriendo

---

## 🔄 OPCIÓN 1: INSTALACIÓN LIMPIA (Recomendada para Desarrollo)

### Paso 1: Preparación
```bash
# Detener el backend
# En la terminal node:
# Ctrl+C

# Detener el frontend
# En la terminal esbuild:
# Ctrl+C
```

### Paso 2: Ejecutar Script de Base de Datos
1. Abrir **phpMyAdmin** en el navegador (http://localhost/phpmyadmin)
2. Ir a la pestaña **SQL**
3. Abrir el archivo `config/init-database.sql`
4. **Copiar TODO el contenido** del archivo (727 líneas)
5. **Pegar** en el editor SQL de phpMyAdmin
6. Click en **Ejecutar** (botón "Go" o "Continuar")
7. Esperar 5-10 segundos (crea tablas + inserta datos)

### Paso 3: Verificación con Script Automático
En phpMyAdmin, ejecutar el script de verificación:
1. Ir a la pestaña **SQL**
2. Abrir el archivo `config/verificar-migracion.sql`
3. Copiar y pegar el contenido completo
4. Ejecutar

**Resultado esperado:** 
```
✅ 16 tablas creadas
✅ 77 permisos creados
✅ 2 roles creados
✅ 117+ asignaciones de permisos
✅ Usuario admin existe
```

**Tablas creadas:**
```
1.  roles                        ← Sistema RBAC
2.  permissions                  ← Sistema RBAC
3.  areas
4.  users
5.  role_permissions             ← Sistema RBAC
6.  user_sessions
7.  login_attempts
8.  senders
9.  document_types
10. document_statuses
11. area_document_categories
12. documents
13. document_movements
14. attachments
15. document_versions
16. notifications
```

### Paso 4: Verificación Completa
1. En phpMyAdmin, ir a pestaña **SQL**
2. Abrir el archivo `config/verificar-migracion.sql`
3. Copiar y pegar el contenido completo
4. Ejecutar

**Revisar resultados:**
- ✅ Permisos: 85+
- ✅ Roles: 2
- ✅ Admin con 85+ permisos
- ✅ Jefe con ~45 permisos

### Paso 5: Iniciar Sistema
```bash
# Terminal 1 - Backend
cd GestionDocumentaria
npm start

# Terminal 2 - Frontend
cd sgd-frontend
npm start
```

### Paso 6: Probar Login
- URL: http://localhost:4200
- Email: `admin@sgd.com`
- Password: `admin123`

**Si login funciona:** ✅ Migración exitosa

---

## 🔄 OPCIÓN 2: YA TIENES EL PROYECTO FUNCIONANDO

### ⚠️ NO NECESITAS MIGRAR SI:
- ✅ El backend arranca sin errores
- ✅ Puedes hacer login con `admin@sgd.com`
- ✅ El endpoint `GET /api/permissions` devuelve 77 permisos
- ✅ El endpoint `GET /api/roles/1/permissions` devuelve permisos del admin
- ✅ Ves tablas `permissions` y `role_permissions` en tu BD

### 🔍 Verificar Estado Actual de tu BD

Ejecuta esto en phpMyAdmin:
```sql
USE sgd_db;

-- Verificar si existen las tablas de permisos
SHOW TABLES LIKE 'permissions';
SHOW TABLES LIKE 'role_permissions';

-- Contar permisos (debe ser 77+)
SELECT COUNT(*) FROM permissions;

-- Ver roles del sistema
SELECT id, nombre, es_sistema, puede_asignar_permisos FROM roles;
```

### ✅ Si TODO lo anterior funciona:
**¡Tu base de datos YA tiene RBAC v3.0 implementado!**

No necesitas ejecutar ninguna migración. El sistema está listo para usar.

### ❌ Si FALTA algo (tablas no existen):
Entonces SÍ necesitas ejecutar **OPCIÓN 1: INSTALACIÓN LIMPIA**

---

## 🔄 OPCIÓN 3: ACTUALIZAR PROYECTO VIEJO (Sin RBAC)

**Solo si tienes una versión ANTIGUA del proyecto (antes de noviembre 2025) y quieres actualizar:**

### Paso 1: BACKUP OBLIGATORIO
```bash
# Desde phpMyAdmin
# 1. Seleccionar base de datos sgd_db
# 2. Click en "Exportar"
# 3. Formato: SQL
# 4. Guardar archivo: sgd_db_backup_2025-11-06.sql

# O desde terminal (MySQL CLI)
mysqldump -u root -p sgd_db > sgd_db_backup_2025-11-06.sql
```

### Paso 2: Ejecutar Script de Migración
1. Abrir **phpMyAdmin**
2. Seleccionar base de datos **sgd_db**
3. Ir a pestaña **SQL**
4. Abrir archivo `config/migrations/add-permissions-system.sql`
5. Copiar TODO el contenido (407 líneas)
6. Pegar y ejecutar

### Paso 3: Verificar con Script Automático
Ejecutar `config/verificar-migracion.sql` para confirmar que todo se creó correctamente.

### Paso 4: Verificar Datos (Migración)
Ejecutar en SQL:
```sql
-- Verificar que la migración se aplicó correctamente
USE sgd_db;

-- 1. Verificar nuevas tablas
SHOW TABLES LIKE 'permissions';
SHOW TABLES LIKE 'role_permissions';

-- 2. Verificar permisos creados
SELECT COUNT(*) FROM permissions;
-- Debe retornar 77+

-- 3. Verificar roles actualizados
SELECT id, nombre, es_sistema, puede_asignar_permisos, is_active 
FROM roles;
-- Admin debe tener es_sistema=1, puede_asignar_permisos=1
-- Jefe debe tener es_sistema=1, puede_asignar_permisos=0

-- 4. Verificar asignaciones de permisos
SELECT r.nombre, COUNT(*) AS permisos
FROM role_permissions rp
INNER JOIN roles r ON rp.rol_id = r.id
GROUP BY r.nombre;
-- Admin: 77+, Jefe: ~40

-- 5. Verificar que usuarios mantienen sus roles
SELECT u.nombre, u.email, r.nombre AS rol, u.is_active
FROM users u 
INNER JOIN roles r ON u.rol_id = r.id;
```

### Paso 5: Actualizar Backend (Solo si migraste)
```bash
# Verificar que los modelos existen
dir models\Permission.js
dir models\RolePermission.js

# Si existen, reiniciar backend
npm start
```

### Paso 6: Verificar Endpoints
Probar en Postman o navegador:
```bash
# 1. Login
POST http://localhost:3000/api/auth/login
{
  "email": "admin@sgd.com",
  "password": "admin123"
}

# Guardar el accessToken de la respuesta

# 2. Listar permisos
GET http://localhost:3000/api/permissions
Authorization: Bearer {accessToken}

# Debe retornar 85+ permisos

# 3. Permisos del admin
GET http://localhost:3000/api/roles/1/permissions
Authorization: Bearer {accessToken}

# Debe retornar 85+ permisos
```

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### ❌ Error: "Table 'permissions' already exists"
**Causa:** Las tablas RBAC ya existen en tu BD
**Solución:** 
```sql
-- Verificar si ya tienes el sistema RBAC
SELECT COUNT(*) FROM permissions;
SELECT COUNT(*) FROM role_permissions;
```
Si retorna 77+ permisos, **NO necesitas migrar nada**. Tu sistema ya está actualizado.

### ❌ Error: "Cannot add foreign key constraint"
**Causa:** Orden incorrecto al crear tablas manualmente
**Solución:** Usa el archivo `init-database.sql` completo (v3.0), que tiene el orden correcto:
1. roles
2. permissions
3. areas
4. users
5. role_permissions (después de users)

### ❌ Backend no arranca - Error en modelos
**Error:**
```
SequelizeDatabaseError: Table 'sgd_db.role_permissions' doesn't exist
```
**Solución:**
1. Verificar que la BD tiene la tabla:
```sql
SHOW TABLES LIKE 'role_permissions';
```
2. Si no existe, ejecutar `init-database.sql` completo
3. Reiniciar backend con `npm start`

### ❌ Login funciona pero no devuelve permisos
**Problema:** Backend responde pero sin campo `permissions`
**Solución:**
Verificar que `authController.js` tiene el código actualizado (líneas 150-180):
```javascript
// Debe incluir permissions en el include
include: [{
  model: Permission,
  as: 'permissions',
  attributes: ['id', 'codigo', 'nombre', 'descripcion', 'categoria'],
  through: { attributes: [] }
}]
```

### ⚠️ Frontend no muestra opciones de permisos
**Problema:** Modal de roles no tiene selector de permisos
**Causa:** Frontend desactualizado
**Solución:**
```bash
cd sgd-frontend
git pull origin main
npm install
```
Verificar que existe: `src/app/shared/components/permission-selector/`

---

## 🧪 PLAN DE PRUEBAS POST-MIGRACIÓN

### 1. Pruebas de Base de Datos ✅
```sql
-- Ejecutar config/verificar-migracion.sql
-- Revisar que todos los conteos coincidan
```

### 2. Pruebas de Backend ✅
```bash
# Arrancar backend
npm start

# Verificar logs:
✓ Modelos de Sequelize sincronizados con la base de datos
✓ Servidor corriendo en puerto 3000
```

### 3. Pruebas de API ✅
```bash
# En Postman o navegador:

# GET /api/health
# Debe retornar: { status: "OK" }

# POST /api/auth/login
# Debe retornar accessToken

# GET /api/permissions
# Debe retornar array de 85+ permisos

# GET /api/roles
# Debe retornar 2 roles (Admin, Jefe)

# GET /api/roles/1/permissions
# Debe retornar 85+ permisos del Admin
```

### 4. Pruebas de Frontend ✅
```bash
# Arrancar frontend
cd sgd-frontend
npm start

# Probar:
1. Login con admin@sgd.com
2. Verificar que carga el dashboard
3. Verificar que puede acceder a todas las opciones
4. Probar crear un documento
5. Probar derivar un documento
```

---

## 🔙 ROLLBACK (Solo si algo sale mal en Opción 3)

### Restaurar Backup de Base de Datos:
```bash
# Opción 1: Desde phpMyAdmin
# 1. Seleccionar sgd_db
# 2. Ir a "Operaciones" → "Eliminar base de datos"
# 3. Ir a "Importar"
# 4. Seleccionar archivo: sgd_db_backup_2025-11-06.sql
# 5. Click en "Continuar"

# Opción 2: Desde terminal (PowerShell)
mysql -u root -p sgd_db < sgd_db_backup_2025-11-06.sql
```

### Restaurar Código Anterior (Git):
```bash
# Ver commits recientes
git log --oneline -10

# Volver a commit anterior
git reset --hard <commit-hash>

# O deshacer cambios locales
git restore .
```

---

## ✅ CHECKLIST DE INSTALACIÓN

### Antes de Instalar:
- [ ] Node.js v18+ instalado
- [ ] MySQL 8.0+ instalado y corriendo
- [ ] phpMyAdmin accesible (http://localhost/phpmyadmin)
- [ ] Archivo `init-database.sql` v3.0 descargado
- [ ] Archivo `verificar-migracion.sql` descargado

### Durante la Instalación:
- [ ] Base de datos `sgd_db` creada
- [ ] Script `init-database.sql` ejecutado sin errores
- [ ] 16 tablas creadas correctamente
- [ ] 77 permisos insertados
- [ ] 2 roles creados (Admin, Jefe)
- [ ] 117+ asignaciones de permisos
- [ ] 5 áreas predefinidas
- [ ] 5 tipos de documento
- [ ] 6 estados de documento
- [ ] 10 categorías de ejemplo

### Después de la Instalación:
- [ ] Script `verificar-migracion.sql` ejecutado
- [ ] Todos los conteos son correctos
- [ ] Usuario admin creado (`node setup-test-user.js`)
- [ ] Backend instalado (`npm install`)
- [ ] Backend arranca sin errores (`npm start`)
- [ ] Login funcional (admin@sgd.com / admin123)
- [ ] Endpoint `/api/permissions` responde (77 permisos)
- [ ] Endpoint `/api/roles/1/permissions` responde
- [ ] Frontend instalado (`cd sgd-frontend && npm install`)
- [ ] Frontend arranca (`npm start`)
- [ ] Frontend carga correctamente (http://localhost:4200)

---

## 📊 RESULTADOS ESPERADOS DESPUÉS DE LA INSTALACIÓN

### Base de Datos (16 tablas):
```
✅ 16 tablas creadas correctamente
✅ 77 permisos activos en 12 categorías
✅ 2 roles del sistema (Admin, Jefe de Área)
✅ 117+ asignaciones de permisos
✅ 5 áreas predefinidas
✅ 5 tipos de documento
✅ 6 estados de documento
✅ 10 categorías de ejemplo
✅ Todas las FK configuradas correctamente
```

### Distribución de Permisos:
```
auth: 6            documents: 16
users: 9           attachments: 4
roles: 5           versions: 5
areas: 9           movements: 5
categories: 6      reports: 4
document_types: 5  system: 3
```

### Backend:
```
✅ Servidor arranca sin errores
✅ Modelos Sequelize sincronizados
✅ Endpoints de permisos funcionando:
   - GET /api/permissions
   - GET /api/permissions/grouped
   - GET /api/roles/:id/permissions
   - POST /api/roles/:id/permissions
   - DELETE /api/roles/:id/permissions/:permId
```

### Frontend:
```
✅ Login funcional
✅ Dashboard carga
✅ Todas las vistas accesibles
✅ Sin errores en consola
```

---

## 📝 NOTAS IMPORTANTES

1. **Tiempo estimado**: 10-15 minutos (completo)
2. **Downtime**: ~5 minutos (solo ejecución SQL)
3. **Riesgo**: Bajo (con backup)
4. **Reversible**: Sí (con backup)

5. **Nueva Base de Datos:**
   - Más rápido y limpio
   - Recomendado para testing
   - Se pierden datos actuales

6. **Migración de Existente:**
   - Mantiene datos actuales
   - Requiere más cuidado
   - Recomendado para producción

---

## 🆘 SOPORTE

Si encuentras problemas durante la migración:

1. **NO** entrar en pánico
2. **NO** ejecutar comandos adicionales sin verificar
3. **SÍ** guardar mensajes de error
4. **SÍ** verificar logs del backend
5. **SÍ** tener a mano el backup

---

## 🎯 RESUMEN EJECUTIVO

### ¿Qué archivo debo usar?

| Situación | Archivo a usar | Cuándo |
|-----------|---------------|---------|
| **Primera vez instalando el proyecto** | `init-database.sql` | Instalación limpia |
| **Ya tienes el proyecto funcionando** | ❌ Ninguno | Ya está actualizado |
| **Proyecto viejo (pre-noviembre 2025)** | `add-permissions-system.sql` | Migración |
| **Verificar si todo está bien** | `verificar-migracion.sql` | Siempre |

### Estado del Proyecto Actual (Noviembre 2025)
```
✅ Backend: RBAC v3.0 implementado al 85%
✅ Base de datos: 16 tablas con permisos
✅ Frontend: Sistema de permisos funcional
✅ 77 permisos activos en 12 categorías
✅ Gestión de roles con UI completa
```

---

**Última actualización:** 6 de Noviembre 2025  
**Versión:** 3.0  
**Estado:** Sistema RBAC YA IMPLEMENTADO

**Archivos de referencia:**
- `config/init-database.sql` (instalación completa - 727 líneas)
- `config/migrations/add-permissions-system.sql` (migración de BD vieja - 407 líneas)
- `config/verificar-migracion.sql` (script de verificación - 344 líneas)
- `models/Permission.js` (modelo de permisos)
- `models/RolePermission.js` (modelo de asignaciones)
- `middleware/permissionMiddleware.js` (verificación de permisos)
