# 📋 CRUDs Administrativos - Backend

## ✅ Implementación Completada

**Fecha:** 23 de Octubre, 2025  
**Estado:** ✅ COMPLETADO

---

## 🎯 Resumen

Se han implementado **CRUDs completos** para la gestión administrativa del sistema:
- ✅ **Áreas** (Areas)
- ✅ **Roles** (Roles)
- ✅ **Usuarios** (Users)
- ✅ **Tipos de Documento** (Document Types)

---

## 📂 Archivos Creados

### **Controllers**
```
controllers/
  ├── areaController.js           ← NUEVO (422 líneas)
  ├── roleController.js           ← NUEVO (233 líneas)
  ├── userController.js           ← NUEVO (414 líneas)
  └── documentTypeController.js   ← NUEVO (336 líneas)
```

### **Routes**
```
routes/
  ├── areaRoutes.js               ← NUEVO
  ├── roleRoutes.js               ← NUEVO
  ├── userRoutes.js               ← NUEVO
  └── documentTypeRoutes.js       ← ACTUALIZADO (refactorizado)
```

### **Server**
```
server.js                         ← ACTUALIZADO (registradas nuevas rutas)
```

---

## 🔌 Endpoints Implementados

### 🏢 **ÁREAS** (`/api/areas`)

#### **Públicos** (para selects en formularios)
```http
GET    /api/areas                    # Listar áreas
       ?active=true                  # Filtrar solo activas

GET    /api/areas/:id                # Obtener área por ID
```

#### **Protegidos** (Solo Admin)
```http
POST   /api/areas                    # Crear área
PUT    /api/areas/:id                # Actualizar área
DELETE /api/areas/:id                # Desactivar área (soft delete)
PATCH  /api/areas/:id/activate       # Activar área
GET    /api/areas/:id/stats          # Estadísticas del área
```

**Ejemplo de Creación:**
```json
POST /api/areas
Authorization: Bearer <admin-token>

{
  "nombre": "Dirección Regional",
  "sigla": "DR",
  "descripcion": "Dirección Regional de Transportes y Comunicaciones",
  "isActive": true
}
```

**Validaciones:**
- ✅ Sigla única (automáticamente en MAYÚSCULAS)
- ✅ Nombre único
- ✅ No se puede desactivar si tiene usuarios activos
- ✅ No se puede desactivar si tiene documentos en proceso

---

### 👥 **ROLES** (`/api/roles`)

#### **Públicos**
```http
GET    /api/roles                    # Listar roles
GET    /api/roles/:id                # Obtener rol por ID
```

#### **Protegidos** (Solo Admin)
```http
POST   /api/roles                    # Crear rol
PUT    /api/roles/:id                # Actualizar rol
DELETE /api/roles/:id                # Eliminar rol
```

**Ejemplo de Creación:**
```json
POST /api/roles
Authorization: Bearer <admin-token>

{
  "nombre": "Jefe de Área",
  "descripcion": "Jefe responsable de un área específica"
}
```

**Validaciones:**
- ✅ Nombre único
- ✅ No se puede eliminar roles del sistema (Administrador, Mesa de Partes, Funcionario)
- ✅ No se puede eliminar si tiene usuarios asignados
- ✅ No se puede cambiar nombre de roles del sistema

---

### 👤 **USUARIOS** (`/api/users`)

#### **Protegidos** (Todos requieren autenticación)
```http
GET    /api/users                    # Listar usuarios (solo admin)
       ?active=true                  # Filtrar por estado
       ?roleId=2                     # Filtrar por rol
       ?areaId=3                     # Filtrar por área

GET    /api/users/:id                # Obtener usuario por ID
POST   /api/users                    # Crear usuario (solo admin)
PUT    /api/users/:id                # Actualizar usuario (solo admin)
DELETE /api/users/:id                # Desactivar usuario (solo admin)
PATCH  /api/users/:id/activate       # Activar usuario (solo admin)
```

**Ejemplo de Creación:**
```json
POST /api/users
Authorization: Bearer <admin-token>

{
  "nombre": "Juan Pérez",
  "email": "juan.perez@drtc.gob.pe",
  "password": "Password123!",
  "rolId": 3,
  "areaId": 2,
  "isActive": true
}
```

**Validaciones:**
- ✅ Email único (automáticamente en minúsculas)
- ✅ Email con formato válido
- ✅ Contraseña mínimo 6 caracteres
- ✅ Rol debe existir
- ✅ Área debe existir y estar activa
- ✅ No se puede desactivar a sí mismo
- ✅ Al desactivar usuario, se cierran todas sus sesiones

---

### 📄 **TIPOS DE DOCUMENTO** (`/api/document-types`)

#### **Públicos**
```http
GET    /api/document-types           # Listar tipos
       ?active=true                  # Filtrar solo activos

GET    /api/document-types/:id       # Obtener tipo por ID
```

#### **Protegidos** (Solo Admin)
```http
POST   /api/document-types           # Crear tipo
PUT    /api/document-types/:id       # Actualizar tipo
DELETE /api/document-types/:id       # Desactivar tipo
PATCH  /api/document-types/:id/activate  # Activar tipo
```

**Ejemplo de Creación:**
```json
POST /api/document-types
Authorization: Bearer <admin-token>

{
  "nombre": "Oficio Múltiple",
  "codigo": "OFM",
  "descripcion": "Oficio dirigido a múltiples destinatarios",
  "requiereAdjunto": true,
  "diasMaxAtencion": 10,
  "isActive": true
}
```

**Validaciones:**
- ✅ Código único (automáticamente en MAYÚSCULAS)
- ✅ Nombre único
- ✅ No se puede desactivar si hay documentos de ese tipo

---

## 🔐 Seguridad Implementada

### **Middleware de Autenticación**
Todos los endpoints de escritura (POST, PUT, DELETE, PATCH) requieren:
1. ✅ Token JWT válido (`authMiddleware`)
2. ✅ Rol de Administrador (`isAdmin`)

### **Middleware de Rol**
```javascript
const { isAdmin } = require('../middleware/roleMiddleware');
```

Valida que el usuario tenga rol "Administrador" antes de ejecutar la operación.

---

## 📊 Características Implementadas

### **Soft Delete**
- ✅ Áreas, usuarios y tipos de documento usan desactivación (`isActive: false`)
- ✅ No se eliminan físicamente de la base de datos
- ✅ Se pueden reactivar posteriormente

### **Hard Delete**
- ✅ Solo para roles (pero protegidos los del sistema)

### **Validaciones**
- ✅ Unicidad de campos (email, sigla, código)
- ✅ Referencias a otras entidades
- ✅ Estado de entidades relacionadas
- ✅ Protección de datos del sistema

### **Relaciones Verificadas**
- ✅ No se puede desactivar área con usuarios activos
- ✅ No se puede desactivar área con documentos en proceso
- ✅ No se puede eliminar rol con usuarios asignados
- ✅ No se puede desactivar tipo de documento si hay documentos de ese tipo
- ✅ No se puede asignar área desactivada a usuario

---

## 🧪 Testing de Endpoints

### **Con Postman o Thunder Client:**

#### 1. **Obtener Token de Admin**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@sgd.gob.pe",
  "password": "Admin123!"
}
```

Copiar el `accessToken` de la respuesta.

#### 2. **Probar CRUD de Áreas**

**Crear Área:**
```http
POST http://localhost:3000/api/areas
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Oficina de Imagen Institucional",
  "sigla": "OII",
  "descripcion": "Responsable de la imagen institucional"
}
```

**Listar Áreas:**
```http
GET http://localhost:3000/api/areas?active=true
```

**Actualizar Área:**
```http
PUT http://localhost:3000/api/areas/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "descripcion": "Nueva descripción actualizada"
}
```

**Desactivar Área:**
```http
DELETE http://localhost:3000/api/areas/1
Authorization: Bearer <token>
```

#### 3. **Probar CRUD de Roles**
```http
# Crear Rol
POST http://localhost:3000/api/roles
Authorization: Bearer <token>

{
  "nombre": "Supervisor",
  "descripcion": "Supervisor de operaciones"
}

# Listar Roles
GET http://localhost:3000/api/roles
```

#### 4. **Probar CRUD de Usuarios**
```http
# Crear Usuario
POST http://localhost:3000/api/users
Authorization: Bearer <token>

{
  "nombre": "María García",
  "email": "maria.garcia@drtc.gob.pe",
  "password": "Password123!",
  "rolId": 2,
  "areaId": 1
}

# Listar Usuarios
GET http://localhost:3000/api/users?active=true
Authorization: Bearer <token>
```

#### 5. **Probar CRUD de Tipos de Documento**
```http
# Crear Tipo
POST http://localhost:3000/api/document-types
Authorization: Bearer <token>

{
  "nombre": "Memorándum",
  "codigo": "MEM",
  "descripcion": "Memorándum interno",
  "diasMaxAtencion": 5
}

# Listar Tipos
GET http://localhost:3000/api/document-types?active=true
```

---

## 🔄 Flujo de Uso Administrativo

### **1. Configuración Inicial del Sistema**

El administrador debe configurar el sistema en este orden:

```
1️⃣ Crear ÁREAS
   └─> Dirección Regional
   └─> Mesa de Partes
   └─> Administración
   └─> Oficina de Personal
   └─> Oficina de Imagen Institucional

2️⃣ Crear ROLES (si se necesitan adicionales)
   └─> Jefe de Área
   └─> Asistente
   └─> Supervisor

3️⃣ Crear TIPOS DE DOCUMENTO
   └─> Oficio
   └─> Oficio Múltiple
   └─> Solicitud
   └─> Memorándum
   └─> Carta

4️⃣ Crear USUARIOS
   └─> Asignar a áreas y roles correspondientes
```

### **2. Gestión Operativa**

Una vez configurado, el administrador puede:
- ✅ Agregar nuevas áreas según sea necesario
- ✅ Crear usuarios para cada área
- ✅ Desactivar áreas que ya no funcionan
- ✅ Reasignar usuarios entre áreas
- ✅ Agregar nuevos tipos de documento

---

## 📝 Respuestas de la API

### **Éxito (200/201)**
```json
{
  "success": true,
  "message": "Área creada exitosamente",
  "data": {
    "id": 1,
    "nombre": "Dirección Regional",
    "sigla": "DR",
    "isActive": true,
    "createdAt": "2025-10-23T08:30:00.000Z"
  }
}
```

### **Error de Validación (400)**
```json
{
  "success": false,
  "message": "La sigla 'DR' ya está registrada"
}
```

### **No Autorizado (401)**
```json
{
  "success": false,
  "message": "Token no proporcionado"
}
```

### **Prohibido (403)**
```json
{
  "success": false,
  "message": "Acceso denegado. Se requiere rol de administrador"
}
```

### **No Encontrado (404)**
```json
{
  "success": false,
  "message": "Área no encontrada"
}
```

---

## ✅ Checklist de Implementación

| Entidad | Controller | Routes | Server | Testing |
|---------|-----------|--------|--------|---------|
| **Áreas** | ✅ | ✅ | ✅ | ⏳ |
| **Roles** | ✅ | ✅ | ✅ | ⏳ |
| **Usuarios** | ✅ | ✅ | ✅ | ⏳ |
| **Tipos Documento** | ✅ | ✅ | ✅ | ⏳ |

---

## 🚀 Próximos Pasos

1. **Testing Manual** - Probar todos los endpoints con Postman
2. **Frontend** - Crear componentes Angular para los CRUDs
3. **Documentación API** - Agregar Swagger/OpenAPI (opcional)
4. **Tests Automatizados** - Crear tests con Jest (opcional)

---

## 📞 Soporte

Si encuentras errores, revisar:
1. ✅ Token JWT válido y no expirado
2. ✅ Usuario tiene rol "Administrador"
3. ✅ Base de datos tiene las tablas actualizadas
4. ✅ Variables de entorno configuradas

---

**✅ CRUDs Administrativos - Backend COMPLETADO**

*Documentación generada: 23 de Octubre, 2025*  
*Sistema de Gestión Documentaria - DRTC Puno*
