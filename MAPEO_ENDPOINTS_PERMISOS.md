# 🔐 MAPEO DE ENDPOINTS A PERMISOS
## Guía de Aplicación de Middleware RBAC v3.0

---

## 📋 **ESTRATEGIA DE APLICACIÓN**

### **Prioridad de Implementación:**
1. ✅ **Auth** - YA ACTUALIZADO (devuelve permisos)
2. ✅ **Roles** - YA ACTUALIZADO (nuevos campos)
3. 🔄 **Documents** - ALTA PRIORIDAD (16 permisos)
4. 🔄 **Users** - ALTA PRIORIDAD (9 permisos)
5. 🔄 **Movements** - ALTA PRIORIDAD (5 permisos)
6. 🔄 **Areas** - MEDIA PRIORIDAD (9 permisos)
7. 🔄 **Document Types** - MEDIA PRIORIDAD (5 permisos)
8. 🔄 **Categories** - MEDIA PRIORIDAD (6 permisos)
9. 🔄 **Attachments** - BAJA PRIORIDAD (4 permisos)
10. 🔄 **Versions** - BAJA PRIORIDAD (5 permisos)
11. 🔄 **Reports** - BAJA PRIORIDAD (4 permisos)

---

## 🎯 **PATRÓN DE MIGRACIÓN**

### **Antes (con isAdmin):**
```javascript
router.get('/users', authMiddleware, isAdmin, userController.getAllUsers);
```

### **Después (con checkPermission):**
```javascript
const { checkPermission } = require('../middleware/permissionMiddleware');
router.get('/users', authMiddleware, checkPermission('users.view.all'), userController.getAllUsers);
```

### **Para Múltiples Permisos (OR):**
```javascript
const { checkAnyPermission } = require('../middleware/permissionMiddleware');
// Usuario puede ver si tiene CUALQUIERA de estos permisos
router.get('/documents', 
  authMiddleware, 
  checkAnyPermission(['documents.view.all', 'documents.view.area', 'documents.view.own']),
  documentController.getAllDocuments
);
```

### **Para Múltiples Permisos (AND):**
```javascript
const { checkAllPermissions } = require('../middleware/permissionMiddleware');
// Usuario DEBE tener TODOS estos permisos
router.post('/documents/:id/finalize', 
  authMiddleware, 
  checkAllPermissions(['documents.finalize', 'documents.edit.all']),
  documentController.finalizeDocument
);
```

---

## 📂 **DOCUMENTS (16 permisos)**

### **routes/documentRoutes.js**

| Endpoint | Método | Permiso(s) | Tipo |
|----------|--------|------------|------|
| `/submit` (público) | POST | ❌ **SIN AUTENTICACIÓN** | - |
| `/` | GET | `documents.view.all`, `documents.view.area`, `documents.view.own` | ANY |
| `/inbox` | GET | `documents.inbox.view` | SINGLE |
| `/archived` | GET | `documents.archive`, `documents.view.all` | ANY |
| `/:id` | GET | `documents.view.all`, `documents.view.area`, `documents.view.own` | ANY |
| `/` | POST | `documents.create` | SINGLE |
| `/:id` | PUT | `documents.edit.all`, `documents.edit.area` | ANY |
| `/:id` | DELETE | `documents.delete` | SINGLE |
| `/:id/archive` | PATCH | `documents.archive` | SINGLE |
| `/:id/unarchive` | PATCH | `documents.unarchive` | SINGLE |
| `/:id/status` | PATCH | `documents.status.change` | SINGLE |
| `/:id/category` | PATCH | `documents.category.assign` | SINGLE |
| `/:id/priority` | PATCH | `documents.priority.set` | SINGLE |
| `/:id/derive` | POST | `documents.derive` | SINGLE |
| `/:id/finalize` | POST | `documents.finalize` | SINGLE |
| `/search` | POST | `documents.search` | SINGLE |

### **Código a aplicar:**
```javascript
// En routes/documentRoutes.js
const { 
  checkPermission, 
  checkAnyPermission 
} = require('../middleware/permissionMiddleware');

// Ejemplo de endpoints específicos:
router.get('/', authMiddleware, 
  checkAnyPermission(['documents.view.all', 'documents.view.area', 'documents.view.own']),
  documentController.getAllDocuments
);

router.get('/inbox', authMiddleware, 
  checkPermission('documents.inbox.view'),
  documentController.getInboxDocuments
);

router.post('/', authMiddleware, 
  checkPermission('documents.create'),
  documentController.createDocument
);

router.put('/:id', authMiddleware, 
  checkAnyPermission(['documents.edit.all', 'documents.edit.area']),
  documentController.updateDocument
);

router.delete('/:id', authMiddleware, 
  checkPermission('documents.delete'),
  documentController.deleteDocument
);

router.patch('/:id/archive', authMiddleware, 
  checkPermission('documents.archive'),
  documentController.archiveDocument
);

router.patch('/:id/unarchive', authMiddleware, 
  checkPermission('documents.unarchive'),
  documentController.unarchiveDocument
);

router.post('/:id/derive', authMiddleware, 
  checkPermission('documents.derive'),
  documentController.deriveDocument
);

router.post('/:id/finalize', authMiddleware, 
  checkPermission('documents.finalize'),
  documentController.finalizeDocument
);
```

---

## 👥 **USERS (9 permisos)**

### **routes/userRoutes.js**

| Endpoint | Método | Permiso(s) | Tipo |
|----------|--------|------------|------|
| `/` | GET | `users.view.all`, `users.view.area` | ANY |
| `/:id` | GET | `users.view.all`, `users.view.area`, `users.view.own` | ANY |
| `/` | POST | `users.create.all`, `users.create.area` | ANY |
| `/:id` | PUT | `users.edit.all`, `users.edit.area` | ANY |
| `/:id/activate` | PATCH | `users.activate` | SINGLE |
| `/:id/deactivate` | PATCH | `users.delete` | SINGLE |

### **Código a aplicar:**
```javascript
const { checkPermission, checkAnyPermission } = require('../middleware/permissionMiddleware');

router.get('/', authMiddleware, 
  checkAnyPermission(['users.view.all', 'users.view.area']),
  userController.getAllUsers
);

router.get('/:id', authMiddleware, 
  checkAnyPermission(['users.view.all', 'users.view.area', 'users.view.own']),
  userController.getUserById
);

router.post('/', authMiddleware, 
  checkAnyPermission(['users.create.all', 'users.create.area']),
  userController.createUser
);

router.put('/:id', authMiddleware, 
  checkAnyPermission(['users.edit.all', 'users.edit.area']),
  userController.updateUser
);

router.patch('/:id/activate', authMiddleware, 
  checkPermission('users.activate'),
  userController.activateUser
);

router.patch('/:id/deactivate', authMiddleware, 
  checkPermission('users.delete'),
  userController.deactivateUser
);
```

---

## 📦 **MOVEMENTS (5 permisos)**

### **routes/movementRoutes.js**

| Endpoint | Método | Permiso(s) | Tipo |
|----------|--------|------------|------|
| `/` | GET | `movements.view.all`, `movements.view.area` | ANY |
| `/:id` | GET | `movements.view.all`, `movements.view.area` | ANY |
| `/` | POST | `movements.create` | SINGLE |
| `/:id` | PUT | `movements.edit` | SINGLE |
| `/:id` | DELETE | `movements.delete` | SINGLE |

---

## 🏢 **AREAS (9 permisos)**

### **routes/areaRoutes.js**

| Endpoint | Método | Permiso(s) | Tipo |
|----------|--------|------------|------|
| `/` | GET | `areas.view.all`, `areas.view.own` | ANY |
| `/:id` | GET | `areas.view.all`, `areas.view.own` | ANY |
| `/` | POST | `areas.create` | SINGLE |
| `/:id` | PUT | `areas.edit.all` | SINGLE |
| `/:id` | DELETE | `areas.delete` | SINGLE |
| `/:id/users` | GET | `areas.users.view` | SINGLE |
| `/:id/documents` | GET | `areas.documents.view` | SINGLE |
| `/:id/statistics` | GET | `areas.statistics.view` | SINGLE |

---

## 📄 **DOCUMENT TYPES (5 permisos)**

### **routes/documentTypeRoutes.js**

| Endpoint | Método | Permiso(s) | Tipo |
|----------|--------|------------|------|
| `/` | GET | `document_types.view` | SINGLE |
| `/:id` | GET | `document_types.view` | SINGLE |
| `/` | POST | `document_types.create` | SINGLE |
| `/:id` | PUT | `document_types.edit` | SINGLE |
| `/:id` | DELETE | `document_types.delete` | SINGLE |

---

## 🏷️ **CATEGORIES (6 permisos)**

### **routes/areaCategoryRoutes.js**

| Endpoint | Método | Permiso(s) | Tipo |
|----------|--------|------------|------|
| `/` | GET | `categories.view` | SINGLE |
| `/:id` | GET | `categories.view` | SINGLE |
| `/` | POST | `categories.create` | SINGLE |
| `/:id` | PUT | `categories.edit` | SINGLE |
| `/:id` | DELETE | `categories.delete` | SINGLE |
| `/area/:areaId` | GET | `categories.area.view` | SINGLE |

---

## 📎 **ATTACHMENTS (4 permisos)**

### **routes/attachmentRoutes.js**

| Endpoint | Método | Permiso(s) | Tipo |
|----------|--------|------------|------|
| `/` | GET | `attachments.view` | SINGLE |
| `/` | POST | `attachments.create` | SINGLE |
| `/:id` | DELETE | `attachments.delete` | SINGLE |
| `/:id/download` | GET | `attachments.download` | SINGLE |

---

## 📚 **VERSIONS (5 permisos)**

### **routes/documentVersionRoutes.js**

| Endpoint | Método | Permiso(s) | Tipo |
|----------|--------|------------|------|
| `/document/:documentId` | GET | `versions.view` | SINGLE |
| `/:id` | GET | `versions.view` | SINGLE |
| `/` | POST | `versions.create` | SINGLE |
| `/:id/restore` | POST | `versions.restore` | SINGLE |
| `/:id` | DELETE | `versions.delete` | SINGLE |

---

## 📊 **REPORTS (4 permisos)**

### **routes/reportRoutes.js**

| Endpoint | Método | Permiso(s) | Tipo |
|----------|--------|------------|------|
| `/general` | GET | `reports.general` | SINGLE |
| `/by-area` | GET | `reports.by_area` | SINGLE |
| `/by-type` | GET | `reports.by_type` | SINGLE |
| `/by-status` | GET | `reports.by_status` | SINGLE |

---

## 🔧 **CONSIDERACIONES ESPECIALES**

### **1. Lógica en Controladores (No Middleware)**

Algunos endpoints requieren lógica condicional basada en el contexto:

```javascript
// En documentController.js - getAllDocuments()
async getAllDocuments(req, res) {
  const userId = req.user.id;
  const userRole = req.user.role;
  const userPermissions = req.user.permissions || [];

  let whereClause = {};

  if (userPermissions.includes('documents.view.all')) {
    // Ver todos los documentos
    whereClause = {};
  } else if (userPermissions.includes('documents.view.area')) {
    // Ver solo documentos de su área
    whereClause = { areaId: req.user.areaId };
  } else if (userPermissions.includes('documents.view.own')) {
    // Ver solo documentos propios
    whereClause = { userId: req.user.id };
  } else {
    return res.status(403).json({
      success: false,
      message: 'No tiene permisos para ver documentos'
    });
  }

  // Continuar con la query...
}
```

### **2. Endpoints Públicos (Sin Autenticación)**

Estos endpoints NO requieren middleware de permisos:
- `POST /api/documents/submit` - Mesa de Partes Virtual
- `GET /api/health` - Health check

### **3. Mantener Compatibilidad**

Durante la transición, se pueden mantener ambos middlewares:
```javascript
// Mantener isAdmin temporalmente para retrocompatibilidad
router.post('/', authMiddleware, isAdmin, 
  checkPermission('roles.create'),
  roleController.createRole
);

// Una vez verificado que funciona, remover isAdmin:
router.post('/', authMiddleware, 
  checkPermission('roles.create'),
  roleController.createRole
);
```

---

## ✅ **CHECKLIST DE VERIFICACIÓN**

Por cada endpoint actualizado:
- [ ] Importar middleware correcto al principio del archivo de rutas
- [ ] Reemplazar `isAdmin` por `checkPermission()` o `checkAnyPermission()`
- [ ] Mantener `authMiddleware` como primer middleware
- [ ] Actualizar lógica en controlador si el permiso requiere contexto
- [ ] Verificar que el código del permiso existe en la BD
- [ ] Probar el endpoint con usuario que TIENE el permiso
- [ ] Probar el endpoint con usuario que NO tiene el permiso
- [ ] Documentar el cambio en commit message

---

## 📝 **ORDEN DE APLICACIÓN RECOMENDADO**

1. **Aplicar a un archivo completo de rutas:**
   - Empezar con `documentRoutes.js` (más crítico)
   - Probar todos los endpoints
   - Confirmar que funciona correctamente

2. **Continuar con el siguiente archivo:**
   - `userRoutes.js`
   - `movementRoutes.js`
   - etc.

3. **Actualizar controladores si es necesario:**
   - Agregar lógica condicional por permisos
   - No remover validaciones existentes (defensa en profundidad)

4. **Testing:**
   - Crear script de test para cada módulo
   - Verificar acceso permitido y denegado

---

**Próximo paso:** Comenzar aplicando middleware a `documentRoutes.js`
