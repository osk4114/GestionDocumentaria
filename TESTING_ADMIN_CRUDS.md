# 🧪 Guía de Testing - CRUDs Administrativos

## 📋 Testing Manual con Postman/Thunder Client

### **Prerrequisitos**
1. ✅ Servidor backend corriendo: `npm run dev`
2. ✅ Base de datos MySQL activa
3. ✅ Postman o Thunder Client instalado

---

## 🔑 **PASO 1: Obtener Token de Administrador**

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@sgd.gob.pe",
  "password": "Admin123!"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": {
      "id": 1,
      "nombre": "Administrador",
      "email": "admin@sgd.gob.pe",
      "rol": "Administrador"
    }
  }
}
```

**⚠️ IMPORTANTE:** Copiar el `accessToken` para las siguientes pruebas.

---

## 🏢 **PASO 2: Testing CRUD de Áreas**

### **2.1 Crear Área**
```http
POST http://localhost:3000/api/areas
Authorization: Bearer <TU_TOKEN_AQUI>
Content-Type: application/json

{
  "nombre": "Oficina de Imagen Institucional",
  "sigla": "OII",
  "descripcion": "Responsable de la imagen institucional"
}
```

✅ **Esperado:** Status 201, área creada

### **2.2 Listar Todas las Áreas**
```http
GET http://localhost:3000/api/areas
```

✅ **Esperado:** Status 200, lista de áreas (sin token, es público)

### **2.3 Listar Solo Áreas Activas**
```http
GET http://localhost:3000/api/areas?active=true
```

### **2.4 Obtener Área por ID**
```http
GET http://localhost:3000/api/areas/1
Authorization: Bearer <TU_TOKEN_AQUI>
```

### **2.5 Actualizar Área**
```http
PUT http://localhost:3000/api/areas/1
Authorization: Bearer <TU_TOKEN_AQUI>
Content-Type: application/json

{
  "descripcion": "Descripción actualizada de la oficina"
}
```

### **2.6 Obtener Estadísticas del Área**
```http
GET http://localhost:3000/api/areas/1/stats
Authorization: Bearer <TU_TOKEN_AQUI>
```

### **2.7 Desactivar Área** (solo si no tiene usuarios activos)
```http
DELETE http://localhost:3000/api/areas/5
Authorization: Bearer <TU_TOKEN_AQUI>
```

### **2.8 Reactivar Área**
```http
PATCH http://localhost:3000/api/areas/5/activate
Authorization: Bearer <TU_TOKEN_AQUI>
```

---

## 👥 **PASO 3: Testing CRUD de Roles**

### **3.1 Listar Roles**
```http
GET http://localhost:3000/api/roles
```

✅ **Esperado:** Debe mostrar Administrador, Mesa de Partes, Funcionario

### **3.2 Crear Nuevo Rol**
```http
POST http://localhost:3000/api/roles
Authorization: Bearer <TU_TOKEN_AQUI>
Content-Type: application/json

{
  "nombre": "Jefe de Área",
  "descripcion": "Jefe responsable de un área específica"
}
```

### **3.3 Obtener Rol por ID**
```http
GET http://localhost:3000/api/roles/4
Authorization: Bearer <TU_TOKEN_AQUI>
```

### **3.4 Actualizar Rol**
```http
PUT http://localhost:3000/api/roles/4
Authorization: Bearer <TU_TOKEN_AQUI>
Content-Type: application/json

{
  "descripcion": "Supervisor de todas las operaciones del área"
}
```

### **3.5 Intentar Eliminar Rol del Sistema** ❌
```http
DELETE http://localhost:3000/api/roles/1
Authorization: Bearer <TU_TOKEN_AQUI>
```

❌ **Esperado:** Error 403 - No se puede eliminar rol del sistema

### **3.6 Eliminar Rol Personalizado** (solo si no tiene usuarios)
```http
DELETE http://localhost:3000/api/roles/4
Authorization: Bearer <TU_TOKEN_AQUI>
```

✅ **Esperado:** Status 200, rol eliminado

---

## 👤 **PASO 4: Testing CRUD de Usuarios**

### **4.1 Listar Todos los Usuarios**
```http
GET http://localhost:3000/api/users
Authorization: Bearer <TU_TOKEN_AQUI>
```

### **4.2 Filtrar Usuarios Activos**
```http
GET http://localhost:3000/api/users?active=true
Authorization: Bearer <TU_TOKEN_AQUI>
```

### **4.3 Filtrar por Área**
```http
GET http://localhost:3000/api/users?areaId=1
Authorization: Bearer <TU_TOKEN_AQUI>
```

### **4.4 Crear Nuevo Usuario**
```http
POST http://localhost:3000/api/users
Authorization: Bearer <TU_TOKEN_AQUI>
Content-Type: application/json

{
  "nombre": "María García López",
  "email": "maria.garcia@drtc.gob.pe",
  "password": "Password123!",
  "rolId": 3,
  "areaId": 1
}
```

✅ **Esperado:** Status 201, usuario creado

### **4.5 Obtener Usuario por ID**
```http
GET http://localhost:3000/api/users/4
Authorization: Bearer <TU_TOKEN_AQUI>
```

### **4.6 Actualizar Usuario**
```http
PUT http://localhost:3000/api/users/4
Authorization: Bearer <TU_TOKEN_AQUI>
Content-Type: application/json

{
  "nombre": "María García López Actualizado",
  "areaId": 2
}
```

### **4.7 Cambiar Contraseña de Usuario**
```http
PUT http://localhost:3000/api/users/4
Authorization: Bearer <TU_TOKEN_AQUI>
Content-Type: application/json

{
  "password": "NewPassword123!"
}
```

### **4.8 Desactivar Usuario**
```http
DELETE http://localhost:3000/api/users/4
Authorization: Bearer <TU_TOKEN_AQUI>
```

✅ **Esperado:** Usuario desactivado, sesiones cerradas

### **4.9 Reactivar Usuario**
```http
PATCH http://localhost:3000/api/users/4/activate
Authorization: Bearer <TU_TOKEN_AQUI>
```

---

## 📄 **PASO 5: Testing CRUD de Tipos de Documento**

### **5.1 Listar Tipos de Documento**
```http
GET http://localhost:3000/api/document-types
```

✅ **Esperado:** Lista pública de tipos

### **5.2 Crear Tipo de Documento**
```http
POST http://localhost:3000/api/document-types
Authorization: Bearer <TU_TOKEN_AQUI>
Content-Type: application/json

{
  "nombre": "Oficio Múltiple",
  "codigo": "OFM",
  "descripcion": "Oficio dirigido a múltiples destinatarios",
  "requiereAdjunto": true,
  "diasMaxAtencion": 10
}
```

### **5.3 Crear Más Tipos para DRTC**
```http
# Memorándum
POST http://localhost:3000/api/document-types
Authorization: Bearer <TU_TOKEN_AQUI>
Content-Type: application/json

{
  "nombre": "Memorándum",
  "codigo": "MEM",
  "descripcion": "Memorándum interno",
  "diasMaxAtencion": 5
}

# Carta
POST http://localhost:3000/api/document-types
Authorization: Bearer <TU_TOKEN_AQUI>
Content-Type: application/json

{
  "nombre": "Carta",
  "codigo": "CAR",
  "descripcion": "Carta institucional",
  "diasMaxAtencion": 7
}

# Informe
POST http://localhost:3000/api/document-types
Authorization: Bearer <TU_TOKEN_AQUI>
Content-Type: application/json

{
  "nombre": "Informe",
  "codigo": "INF",
  "descripcion": "Informe técnico o administrativo",
  "requiereAdjunto": true,
  "diasMaxAtencion": 15
}
```

### **5.4 Obtener Tipo por ID**
```http
GET http://localhost:3000/api/document-types/5
Authorization: Bearer <TU_TOKEN_AQUI>
```

### **5.5 Actualizar Tipo**
```http
PUT http://localhost:3000/api/document-types/5
Authorization: Bearer <TU_TOKEN_AQUI>
Content-Type: application/json

{
  "diasMaxAtencion": 12,
  "requiereAdjunto": false
}
```

### **5.6 Desactivar Tipo** (solo si no hay documentos de ese tipo)
```http
DELETE http://localhost:3000/api/document-types/5
Authorization: Bearer <TU_TOKEN_AQUI>
```

### **5.7 Reactivar Tipo**
```http
PATCH http://localhost:3000/api/document-types/5/activate
Authorization: Bearer <TU_TOKEN_AQUI>
```

---

## ⚠️ **Casos de Error a Probar**

### **Sin Token** (401)
```http
POST http://localhost:3000/api/areas
Content-Type: application/json

{
  "nombre": "Test"
}
```

❌ **Esperado:** Error 401 - Token no proporcionado

### **Con Usuario No Admin** (403)
1. Hacer login con `funcionario@sgd.gob.pe`
2. Intentar crear área con ese token

❌ **Esperado:** Error 403 - Acceso denegado

### **Datos Duplicados** (400)
```http
POST http://localhost:3000/api/areas
Authorization: Bearer <TU_TOKEN_AQUI>

{
  "nombre": "Mesa de Partes",
  "sigla": "MP"
}
```

❌ **Esperado:** Error 400 - Sigla/nombre ya existe

### **Validación de Email** (400)
```http
POST http://localhost:3000/api/users
Authorization: Bearer <TU_TOKEN_AQUI>

{
  "nombre": "Test",
  "email": "email_invalido",
  "password": "123",
  "rolId": 1
}
```

❌ **Esperado:** Error 400 - Email inválido o contraseña muy corta

---

## ✅ **Checklist de Validación**

### **Áreas**
- [ ] Crear área con éxito
- [ ] Listar todas las áreas
- [ ] Actualizar área
- [ ] No permitir sigla duplicada
- [ ] No desactivar área con usuarios activos
- [ ] Obtener estadísticas del área

### **Roles**
- [ ] Listar roles del sistema
- [ ] Crear rol personalizado
- [ ] Actualizar rol
- [ ] No permitir eliminar rol del sistema
- [ ] No permitir eliminar rol con usuarios

### **Usuarios**
- [ ] Crear usuario con éxito
- [ ] Validar formato de email
- [ ] No permitir email duplicado
- [ ] Actualizar usuario (incluida contraseña)
- [ ] Desactivar usuario cierra sus sesiones
- [ ] Filtrar por área y rol

### **Tipos de Documento**
- [ ] Crear tipo con éxito
- [ ] No permitir código duplicado
- [ ] Actualizar configuración (días, adjunto)
- [ ] No desactivar tipo con documentos

---

## 🎯 **Datos de Prueba Sugeridos para DRTC**

### **Áreas a Crear:**
```json
1. Dirección Regional (DR)
2. Mesa de Partes (MP)
3. Sub Dirección de Transportes (SDT)
4. Sub Dirección de Comunicaciones (SDC)
5. Administración (ADM)
6. Oficina de Personal (OP)
7. Oficina de Imagen Institucional (OII)
8. Oficina de Asesoría Legal (OAL)
9. Oficina de Planeamiento (OPL)
```

### **Roles Personalizados:**
```json
1. Jefe de Área
2. Asistente Administrativo
3. Técnico Especialista
4. Supervisor
```

### **Tipos de Documento:**
```json
1. Oficio (OF)
2. Oficio Múltiple (OFM)
3. Solicitud (SOL)
4. Memorándum (MEM)
5. Carta (CAR)
6. Informe (INF)
7. Resolución Directoral (RD)
8. Acta (ACT)
```

---

## 🚀 **Testing Automatizado (Opcional)**

Si quieres crear tests automatizados:

```bash
npm test -- test/integration/admin-cruds.test.js
```

---

## ✅ **Resultado Final**

Si todos los tests pasan:
- ✅ Backend de CRUDs Administrativos funcionando correctamente
- ✅ Validaciones implementadas
- ✅ Seguridad (autenticación y autorización) operativa
- ✅ Listo para crear el frontend

---

**🎉 Testing Completado - Listo para Frontend**

*Guía de testing generada: 23 de Octubre, 2025*
