# 🚀 Sistema RBAC - Progreso de Implementación
**Sistema de Gestión Documental - v3.0**
*Fecha: Enero 2025*

---

## ✅ COMPLETADO - Base de Datos y Modelos

### 1. Base de Datos (init-database.sql v3.0) ✅
**Archivo**: `config/init-database.sql`
**Estado**: Actualizado completamente

#### Tablas Nuevas:
- ✅ **permissions** - 85+ permisos del sistema organizados en 11 categorías
- ✅ **role_permissions** - Tabla de unión roles-permisos

#### Tablas Modificadas:
- ✅ **roles** - Agregados campos:
  - `es_sistema` (BOOLEAN) - Identifica roles del sistema
  - `puede_asignar_permisos` (BOOLEAN) - Solo Admin puede gestionar permisos
  - `is_active` (BOOLEAN) - Estado del rol

#### Datos Semilla:
- ✅ Solo 2 roles predefinidos:
  - **Administrador** (es_sistema=TRUE, puede_asignar_permisos=TRUE)
  - **Jefe de Área** (es_sistema=TRUE, puede_asignar_permisos=FALSE)
- ✅ 85+ permisos insertados en 11 categorías:
  - AUTH (6 permisos)
  - USERS (9 permisos)
  - ROLES (5 permisos)
  - AREAS (9 permisos)
  - CATEGORIES (6 permisos)
  - DOCUMENT_TYPES (5 permisos)
  - DOCUMENTS (16 permisos)
  - ATTACHMENTS (4 permisos)
  - VERSIONS (5 permisos)
  - MOVEMENTS (5 permisos)
  - REPORTS (4 permisos)
  - SYSTEM (3 permisos)
- ✅ Asignaciones:
  - Admin: TODOS los permisos (85+)
  - Jefe de Área: 45 permisos específicos

---

### 2. Archivo de Migración ✅
**Archivo**: `config/migrations/add-permissions-system.sql`
**Estado**: Listo para bases de datos existentes

#### Contenido:
- ✅ CREATE TABLE permissions
- ✅ CREATE TABLE role_permissions
- ✅ ALTER TABLE roles (agregar nuevos campos)
- ✅ INSERT de 85+ permisos
- ✅ INSERT de role_permissions
- ✅ Comentarios y documentación

---

### 3. Modelos Sequelize ✅

#### Permission.js ✅
**Archivo**: `models/Permission.js`
**Estado**: Creado y documentado

**Características**:
- Validaciones de código único (formato: categoria.accion)
- Enum de 11 categorías
- Flag es_sistema para permisos predefinidos
- Hooks: prevenir eliminación/edición de permisos del sistema
- Métodos útiles:
  - `getByCategory(categoria)`
  - `getAllGroupedByCategory()`
  - `findByCodigo(codigo)`
  - `exists(codigo)`
  - `canBeDeleted()` / `canBeEdited()`

#### RolePermission.js ✅
**Archivo**: `models/RolePermission.js`
**Estado**: Creado y documentado

**Características**:
- Relación muchos a muchos Role ↔ Permission
- Campo asignado_por (tracking de quién asignó)
- Campo fecha_asignacion
- Índice único (rol_id, permission_id)
- Métodos útiles:
  - `assignPermission(rolId, permissionId, userId)`
  - `removePermission(rolId, permissionId)`
  - `assignMultiplePermissions(rolId, permissionIds, userId)`
  - `syncPermissions(rolId, permissionIds, userId)`
  - `getPermissionsByRole(rolId)`
  - `roleHasPermission(rolId, permissionCodigo)`

#### Role.js ✅
**Archivo**: `models/Role.js`
**Estado**: Actualizado con nuevos campos

**Características**:
- Campos nuevos: es_sistema, puede_asignar_permisos, is_active
- Validaciones: no permitir modificar/eliminar roles del sistema
- Hooks: protección contra cambios en roles del sistema
- Métodos útiles:
  - `getCustomRoles()` - Roles personalizables
  - `getSystemRoles()` - Admin y Jefe de Área
  - `getActiveRoles()` - Roles activos
  - `canBeDeleted()` / `canBeEdited()`
  - `isAdmin()` / `isJefe()`
  - `getPermissions()` - Obtener permisos del rol
  - `hasPermission(codigo)` - Verificar permiso específico
  - `assignPermission()` / `removePermission()`
  - `syncPermissions()` - Reemplazar todos los permisos

#### models/index.js ✅
**Archivo**: `models/index.js`
**Estado**: Actualizado con nuevos modelos y asociaciones

**Asociaciones Agregadas**:
- Role ↔ Permission (belongsToMany a través de RolePermission)
- RolePermission → Role (belongsTo)
- RolePermission → Permission (belongsTo)
- RolePermission → User (asignado_por)

---

### 4. Middleware de Permisos ✅
**Archivo**: `middleware/permissionMiddleware.js`
**Estado**: Creado y documentado

**Funciones**:

#### `checkPermission(codigo)` ✅
Verifica si el usuario tiene UN permiso específico.

**Uso**:
```javascript
router.post('/documents', 
  authMiddleware, 
  checkPermission('documents.create'), 
  documentController.create
);
```

**Características**:
- Verifica autenticación
- Valida rol asignado
- Verifica rol activo
- Consulta permiso en BD
- Devuelve 403 con mensaje descriptivo si falla
- Agrega req.permission y req.userRole

#### `checkAnyPermission([codigos])` ✅
Verifica si el usuario tiene AL MENOS UNO de varios permisos.

**Uso**:
```javascript
router.get('/documents', 
  authMiddleware,
  checkAnyPermission(['documents.view.all', 'documents.view.area']),
  documentController.list
);
```

#### `checkAllPermissions([codigos])` ✅
Verifica si el usuario tiene TODOS los permisos especificados.

**Uso**:
```javascript
router.post('/special', 
  authMiddleware,
  checkAllPermissions(['documents.create', 'documents.edit.all']),
  controller.special
);
```

#### `canManagePermissions` ✅
Verifica si el usuario puede gestionar roles y permisos (solo Admin).

**Uso**:
```javascript
router.post('/roles/:id/permissions', 
  authMiddleware,
  canManagePermissions,
  roleController.assignPermissions
);
```

#### `getUserPermissions` ✅
Helper para obtener todos los permisos del usuario y agregarlos a req.

**Uso**:
```javascript
router.get('/profile', 
  authMiddleware,
  getUserPermissions,
  userController.getProfile
);
```

---

## 📋 ANÁLISIS Y DOCUMENTACIÓN

### Documento de Análisis ✅
**Archivo**: `ANALISIS_PERMISOS_COMPLETO.md`
**Estado**: Completo

**Contenido**:
1. Estructura actual de la BD (14 tablas)
2. Mapeo de 93 endpoints activos
3. Identificación de 85+ permisos únicos
4. Categorización en 11 grupos
5. Asignación de permisos por rol
6. Plan de implementación

---

## ⏳ PENDIENTE - Controllers y Routes

### 5. Controllers de Permisos 🔜
**Archivos a crear**:
- `controllers/permissionController.js` - CRUD de permisos
- `controllers/rolePermissionController.js` - Asignar/remover permisos a roles

**Endpoints necesarios**:

#### Permission Controller:
```javascript
GET    /api/permissions                 - Listar todos los permisos
GET    /api/permissions/grouped         - Permisos agrupados por categoría
GET    /api/permissions/:id             - Detalle de un permiso
POST   /api/permissions                 - Crear permiso personalizado (Admin)
PUT    /api/permissions/:id             - Editar permiso (solo no-sistema)
DELETE /api/permissions/:id             - Eliminar permiso (solo no-sistema)
GET    /api/permissions/category/:cat   - Permisos de una categoría
```

#### Role Permission Controller:
```javascript
GET    /api/roles/:id/permissions       - Obtener permisos de un rol
POST   /api/roles/:id/permissions       - Asignar permisos a un rol
DELETE /api/roles/:id/permissions/:pid  - Remover permiso de un rol
PUT    /api/roles/:id/permissions/sync  - Sincronizar permisos (reemplazar todos)
```

---

### 6. Actualizar Role Controller 🔜
**Archivo**: `controllers/roleController.js`

**Cambios necesarios**:
- ✅ Actualizar métodos existentes para incluir nuevos campos
- 🔜 Agregar validación: no permitir editar/eliminar roles del sistema
- 🔜 Incluir permisos en respuestas (cuando se solicite un rol)
- 🔜 Método para activar/desactivar roles

**Endpoints a actualizar**:
```javascript
GET    /api/roles              - Incluir permisos si requested
GET    /api/roles/:id          - Incluir permisos del rol
POST   /api/roles              - Validar es_sistema, asignar permisos iniciales
PUT    /api/roles/:id          - Validar no modificar roles del sistema
DELETE /api/roles/:id          - Validar no eliminar roles del sistema
PATCH  /api/roles/:id/activate - Activar/desactivar rol
```

---

### 7. Actualizar TODOS los Routes (93 endpoints) 🔜

**Estrategia de actualización**:
1. Reemplazar `isAdmin` → `checkPermission('xxx')`
2. Reemplazar `checkRole(['Admin', 'Jefe'])` → `checkAnyPermission([...])`
3. Mantener authMiddleware en todos

**Ejemplo de conversión**:

**ANTES**:
```javascript
router.post('/documents', 
  authMiddleware, 
  isAdmin, 
  documentController.create
);
```

**DESPUÉS**:
```javascript
router.post('/documents', 
  authMiddleware, 
  checkPermission('documents.create'), 
  documentController.create
);
```

#### Archivos de rutas a actualizar:
- 🔜 `routes/authRoutes.js` (6 endpoints) - auth.*
- 🔜 `routes/userRoutes.js` (9 endpoints) - users.*
- 🔜 `routes/roleRoutes.js` (5+ endpoints) - roles.*
- 🔜 `routes/areaRoutes.js` (9 endpoints) - areas.*
- 🔜 `routes/areaCategoryRoutes.js` (6 endpoints) - categories.*
- 🔜 `routes/documentTypeRoutes.js` (5 endpoints) - document_types.*
- 🔜 `routes/documentRoutes.js` (16+ endpoints) - documents.*
- 🔜 `routes/attachmentRoutes.js` (4 endpoints) - attachments.*
- 🔜 `routes/documentVersionRoutes.js` (5 endpoints) - versions.*
- 🔜 `routes/movementRoutes.js` (5 endpoints) - movements.*
- 🔜 `routes/reportRoutes.js` (4+ endpoints) - reports.*

---

### 8. Actualizar Auth Service 🔜

**Archivo**: `controllers/authController.js`

**Cambios necesarios**:
- 🔜 Incluir permisos del usuario en respuesta de login
- 🔜 Incluir permisos en respuesta de refresh token
- 🔜 Incluir permisos en endpoint de perfil

**Respuesta de login actualizada**:
```javascript
{
  success: true,
  user: {
    id: 1,
    nombre: "Admin",
    email: "admin@example.com",
    rol: {
      id: 1,
      nombre: "Administrador",
      es_sistema: true,
      puede_asignar_permisos: true,
      permissions: [
        { codigo: "documents.create", nombre: "Crear Documentos", categoria: "documents" },
        { codigo: "users.view.all", nombre: "Ver Todos los Usuarios", categoria: "users" },
        // ... todos los demás
      ]
    },
    area: { ... }
  },
  accessToken: "...",
  refreshToken: "..."
}
```

---

## 🎨 PENDIENTE - Frontend (Angular)

### 9. Servicios de Permisos 🔜

#### `services/permission.service.ts`
```typescript
export class PermissionService {
  // Obtener todos los permisos
  getAll(): Observable<Permission[]>
  
  // Obtener permisos agrupados
  getGrouped(): Observable<GroupedPermissions>
  
  // Verificar si usuario actual tiene permiso
  hasPermission(code: string): boolean
  
  // Obtener permisos de un rol
  getRolePermissions(roleId: number): Observable<Permission[]>
}
```

#### Actualizar `services/auth.service.ts`
```typescript
// Agregar permisos al usuario actual
export interface CurrentUser {
  id: number;
  nombre: string;
  email: string;
  rol: {
    id: number;
    nombre: string;
    permissions: Permission[]; // ← NUEVO
  };
  area: Area;
}
```

---

### 10. Guards de Permisos 🔜

#### `guards/permission.guard.ts`
```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermission = route.data['permission'];
    return this.authService.hasPermission(requiredPermission);
  }
}
```

**Uso en rutas**:
```typescript
{
  path: 'documents/create',
  component: CreateDocumentComponent,
  canActivate: [AuthGuard, PermissionGuard],
  data: { permission: 'documents.create' }
}
```

---

### 11. Componente de Gestión de Roles 🔜

#### `features/admin/roles/role-form`

**Interfaz necesaria**:
- Formulario de rol (nombre, descripción)
- Lista de permisos organizados por categoría
- Checkboxes para seleccionar permisos
- Indicador de roles del sistema (no editables)
- Botón de guardar/actualizar

**Wireframe**:
```
┌─────────────────────────────────────────┐
│ Crear / Editar Rol                      │
├─────────────────────────────────────────┤
│ Nombre: [_______________]               │
│ Descripción: [_______________]          │
│                                          │
│ Permisos:                               │
│ ┌────────────────────────────────────┐ │
│ │ ☑ AUTH                            │ │
│ │   ☐ Registrar Usuarios            │ │
│ │   ☐ Ver Perfil Propio             │ │
│ │   ☐ Editar Perfil Propio          │ │
│ │                                     │ │
│ │ ☑ DOCUMENTOS                      │ │
│ │   ☑ Ver Documentos de su Área    │ │
│ │   ☑ Crear Documentos              │ │
│ │   ☐ Ver Todos los Documentos     │ │
│ │   ☑ Derivar Documentos            │ │
│ │   ...                              │ │
│ └────────────────────────────────────┘ │
│                                          │
│ [Cancelar]            [Guardar Rol]     │
└─────────────────────────────────────────┘
```

---

### 12. Directivas de Permisos 🔜

#### `directives/has-permission.directive.ts`
```typescript
@Directive({ selector: '[hasPermission]' })
export class HasPermissionDirective {
  @Input() hasPermission!: string;
  
  // Ocultar elemento si no tiene permiso
}
```

**Uso**:
```html
<button *hasPermission="'documents.create'">
  Crear Documento
</button>

<app-edit-button *hasPermission="'documents.edit.all'">
</app-edit-button>
```

---

## 📊 TESTING

### 13. Plan de Pruebas 🔜

#### Pruebas de Base de Datos:
- ✅ Migración sin pérdida de datos
- ✅ Integridad referencial
- ✅ Permisos correctamente asignados
- ✅ Roles del sistema protegidos

#### Pruebas de Backend:
- 🔜 Middleware checkPermission funcional
- 🔜 Controllers de permisos CRUD
- 🔜 Asignación/remoción de permisos a roles
- 🔜 Validación de roles del sistema
- 🔜 Login incluye permisos

#### Pruebas de Frontend:
- 🔜 Guard de permisos funcional
- 🔜 Directivas ocultan elementos correctamente
- 🔜 UI de gestión de roles operativa
- 🔜 Selección de permisos por categoría

#### Pruebas de Integración:
- 🔜 Crear rol personalizado
- 🔜 Asignar permisos a rol
- 🔜 Asignar rol a usuario
- 🔜 Usuario puede acceder según permisos
- 🔜 Usuario no puede acceder sin permisos

---

## 🚀 DEPLOYMENT

### 14. Plan de Despliegue 🔜

#### Fase 1: Backup
- 🔜 Backup completo de base de datos actual
- 🔜 Backup de código actual

#### Fase 2: Migración de Base de Datos
- 🔜 Ejecutar `config/migrations/add-permissions-system.sql`
- 🔜 Verificar que roles Admin y Jefe tienen permisos
- 🔜 Verificar que usuarios existentes mantienen sus roles

#### Fase 3: Deploy Backend
- 🔜 Actualizar modelos
- 🔜 Actualizar middleware
- 🔜 Actualizar controllers
- 🔜 Actualizar routes
- 🔜 Reiniciar servidor

#### Fase 4: Deploy Frontend
- 🔜 Actualizar servicios
- 🔜 Actualizar guards
- 🔜 Agregar componentes de gestión
- 🔜 Agregar directivas
- 🔜 Build y deploy

#### Fase 5: Verificación
- 🔜 Admin puede acceder a todo
- 🔜 Jefe puede acceder a su área
- 🔜 Roles personalizados funcionan
- 🔜 No hay regresiones

---

## 📝 RESUMEN DE PROGRESO

### ✅ Completado (40%)
1. ✅ Análisis completo del sistema (93 endpoints)
2. ✅ Identificación de 85+ permisos únicos
3. ✅ Diseño de arquitectura RBAC
4. ✅ Base de datos actualizada (v3.0)
5. ✅ Archivo de migración creado
6. ✅ Modelos Sequelize (Permission, RolePermission, Role)
7. ✅ Middleware de permisos completo
8. ✅ Documentación de análisis

### ⏳ En Progreso (0%)
Ninguno actualmente

### 🔜 Pendiente (60%)
1. 🔜 Controllers de permisos y role-permissions
2. 🔜 Actualizar Role Controller
3. 🔜 Actualizar 93 endpoints con checkPermission
4. 🔜 Actualizar Auth Service (incluir permisos en respuesta)
5. 🔜 Servicios de permisos (Angular)
6. 🔜 Permission Guard (Angular)
7. 🔜 Componente de gestión de roles (UI)
8. 🔜 Directivas de permisos (Angular)
9. 🔜 Testing completo
10. 🔜 Deployment y verificación

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

### Paso 1: Crear Controllers 🎯
**Archivos**:
- `controllers/permissionController.js`
- `controllers/rolePermissionController.js`

**Tiempo estimado**: 2-3 horas

### Paso 2: Crear Routes 🎯
**Archivos**:
- `routes/permissionRoutes.js`
- `routes/rolePermissionRoutes.js`

**Tiempo estimado**: 1 hora

### Paso 3: Actualizar roleController.js 🎯
**Archivo**: `controllers/roleController.js`

**Tiempo estimado**: 1-2 horas

### Paso 4: Actualizar authController.js 🎯
**Archivo**: `controllers/authController.js`

**Tiempo estimado**: 1 hora

### Paso 5: Comenzar actualización de routes 🎯
**Prioridad**: documentRoutes.js (más usado)

**Tiempo estimado**: 3-4 horas

---

## 💡 NOTAS IMPORTANTES

### Compatibilidad hacia atrás:
- ✅ Usuarios existentes mantienen sus roles
- ✅ Admin y Jefe de Área conservan acceso completo
- ⚠️ Funcionario y Mesa de Partes desaparecen (migrar usuarios a roles personalizados)

### Seguridad:
- ✅ Roles del sistema no pueden eliminarse
- ✅ Solo Admin puede gestionar permisos
- ✅ Validaciones en BD (hooks de Sequelize)
- ✅ Middleware verifica permisos en cada request

### Performance:
- ✅ Índices en tablas de permisos
- ✅ Cache de permisos en req.user posible
- 🔜 Considerar cache en Redis para permisos de roles

### UX:
- 🔜 Mensajes claros cuando falta permiso
- 🔜 UI intuitiva para seleccionar permisos
- 🔜 Organización por categorías
- 🔜 Indicadores visuales de roles del sistema

---

**Última actualización**: Enero 2025
**Versión del sistema**: 3.0
**Estado**: Base de datos y modelos completos - Listo para controllers
