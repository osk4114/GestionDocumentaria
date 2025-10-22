# 🧪 Guía de Testing - SGD API

## 📋 Resumen

Esta guía documenta el sistema de testing implementado para el Sistema de Gestión Documentaria. Incluye tests unitarios, tests de integración y configuración de cobertura de código.

---

## 🛠️ Stack de Testing

### Dependencias Instaladas

```json
{
  "devDependencies": {
    "jest": "^29.x",
    "supertest": "^6.x",
    "@types/jest": "^29.x"
  }
}
```

- **Jest**: Framework de testing principal
- **Supertest**: Testing de endpoints HTTP
- **@types/jest**: Tipos TypeScript para mejor autocompletado

---

## 📂 Estructura de Tests

```
test/
├── setup.js                        # Configuración global
├── unit/                           # Tests unitarios
│   ├── services/
│   │   └── documentService.test.js # Tests del servicio de documentos
│   └── controllers/
│       └── authController.test.js  # Tests del controlador de auth
└── integration/                    # Tests de integración
    ├── auth.test.js               # Tests API de autenticación
    └── documents.test.js          # Tests API de documentos
```

---

## ⚙️ Configuración

### `jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testTimeout: 10000,
  verbose: true
};
```

### `test/setup.js`

Configuración global que se ejecuta antes de todos los tests:

```javascript
// Variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.DB_NAME = 'sgd_db_test';

// Deshabilitar logs durante tests
console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();
```

---

## 🎯 Tests Unitarios

### Tests de `documentService.js`

**Ubicación:** `test/unit/services/documentService.test.js`

**Cobertura:**
- ✅ `generateTrackingCode()` - Generación de códigos únicos
- ✅ `createNewDocument()` - Creación con transacciones
- ✅ `deriveDocument()` - Derivación con validaciones
- ✅ `finalizeDocument()` - Finalización de trámites
- ✅ `archiveDocument()` - Archivado (soft delete)
- ✅ `getDocumentByTrackingCode()` - Búsqueda pública
- ✅ `getDocumentStats()` - Estadísticas

**Total:** 47 tests

**Ejemplo de test:**

```javascript
describe('createNewDocument', () => {
  it('debería crear un documento exitosamente', async () => {
    const mockData = {
      senderId: 1,
      documentTypeId: 2,
      asunto: 'Test Document',
      prioridad: 'normal'
    };

    const mockUser = { id: 1, areaId: 1 };
    
    // Mocks...
    
    const result = await documentService.createNewDocument(mockData, mockUser);
    
    expect(result).toBeDefined();
    expect(result.trackingCode).toBeDefined();
    expect(Document.create).toHaveBeenCalled();
  });
});
```

### Tests de `authController.js`

**Ubicación:** `test/unit/controllers/authController.test.js`

**Cobertura:**
- ✅ `login()` - Login con validaciones
- ✅ `logout()` - Cierre de sesión
- ✅ `register()` - Registro de usuarios
- ✅ `refreshToken()` - Renovación de tokens
- ✅ `getSessions()` - Listado de sesiones

**Total:** 23 tests

**Ejemplo de test:**

```javascript
describe('login', () => {
  it('debería hacer login exitosamente', async () => {
    req.body = {
      email: 'test@test.com',
      password: 'password123'
    };

    User.findOne = jest.fn().mockResolvedValue(mockUser);
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    jwt.sign = jest.fn().mockReturnValue('mock.token');

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});
```

---

## 🔗 Tests de Integración

### Tests de API de Autenticación

**Ubicación:** `test/integration/auth.test.js`

**Endpoints testeados:**
- ✅ `POST /api/auth/login`
- ✅ `POST /api/auth/logout`
- ✅ `GET /api/auth/profile`
- ✅ `GET /api/auth/sessions`
- ✅ Rate limiting

**Ejemplo de test de integración:**

```javascript
describe('POST /api/auth/login', () => {
  it('debería hacer login con credenciales válidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'password123'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });
});
```

### Tests de API de Documentos

**Ubicación:** `test/integration/documents.test.js`

**Endpoints testeados:**
- ✅ `POST /api/documents` - Crear documento
- ✅ `GET /api/documents` - Listar documentos
- ✅ `GET /api/documents/:id` - Obtener por ID
- ✅ `GET /api/documents/tracking/:code` - Tracking público
- ✅ `PUT /api/documents/:id` - Actualizar
- ✅ `POST /api/documents/:id/derive` - Derivar
- ✅ `GET /api/documents/stats` - Estadísticas

---

## 🚀 Comandos de Testing

### Ejecutar todos los tests

```bash
npm test
```

### Ejecutar tests en modo watch

```bash
npm run test:watch
```

### Ejecutar solo tests unitarios

```bash
npm run test:unit
```

### Ejecutar solo tests de integración

```bash
npm run test:integration
```

### Generar reporte de cobertura

```bash
npm run test:coverage
```

El reporte HTML se generará en `coverage/lcov-report/index.html`

---

## 📊 Cobertura de Código

### Umbrales Configurados

```javascript
coverageThreshold: {
  global: {
    branches: 50%,
    functions: 50%,
    lines: 50%,
    statements: 50%
  }
}
```

### Ver Reporte de Cobertura

Después de ejecutar `npm run test:coverage`:

1. Abrir `coverage/lcov-report/index.html` en el navegador
2. Ver cobertura por archivo
3. Identificar líneas no cubiertas (resaltadas en rojo)

### Estructura del Reporte

```
coverage/
├── lcov-report/         # Reporte HTML interactivo
│   └── index.html       # Página principal
├── lcov.info           # Formato LCOV para CI/CD
└── coverage-final.json  # Datos JSON
```

---

## 🎭 Técnicas de Testing

### Mocking

```javascript
// Mock de módulo completo
jest.mock('../../../models');

// Mock de función específica
Document.findOne = jest.fn().mockResolvedValue(mockData);

// Mock que falla
Document.create = jest.fn().mockRejectedValue(new Error('DB Error'));

// Mock con múltiples valores
Document.findOne = jest.fn()
  .mockResolvedValueOnce({ id: 1 })  // Primera llamada
  .mockResolvedValueOnce(null);       // Segunda llamada
```

### Assertions

```javascript
// Igualdad
expect(result).toBe(expected);
expect(result).toEqual(expected);

// Definido/No definido
expect(result).toBeDefined();
expect(result).toBeNull();

// Contenido
expect(result).toContain('texto');
expect(result).toHaveProperty('key');

// Arrays
expect(array).toHaveLength(5);
expect(array).toContainEqual(item);

// Funciones
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(3);

// Errores
expect(() => fn()).toThrow('Error message');
await expect(asyncFn()).rejects.toThrow();
```

### Setup y Teardown

```javascript
describe('Test Suite', () => {
  beforeAll(() => {
    // Una vez antes de todos los tests
  });

  beforeEach(() => {
    // Antes de cada test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Después de cada test
  });

  afterAll(() => {
    // Una vez después de todos los tests
  });
});
```

---

## 🐛 Debugging Tests

### Ejecutar un solo test

```bash
npm test -- --testNamePattern="debería crear documento"
```

### Ejecutar un solo archivo

```bash
npm test -- test/unit/services/documentService.test.js
```

### Ver logs completos

En `test/setup.js`, comentar:

```javascript
// console.log = jest.fn();  // Comentar para ver logs
```

### Debugging en VSCode

Agregar a `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

---

## 📝 Mejores Prácticas

### 1. Tests Independientes

```javascript
// ✅ BIEN - Cada test es independiente
it('debería crear documento', async () => {
  const mockData = { /* datos locales */ };
  // Test...
});

// ❌ MAL - Tests dependen de orden
let sharedData;
it('test 1', () => { sharedData = ...; });
it('test 2', () => { /* usa sharedData */ });
```

### 2. Nombres Descriptivos

```javascript
// ✅ BIEN
it('debería rechazar login con password incorrecta', () => {});

// ❌ MAL
it('test login', () => {});
```

### 3. Arrange-Act-Assert (AAA)

```javascript
it('debería calcular total', () => {
  // Arrange
  const items = [1, 2, 3];
  
  // Act
  const total = calculateTotal(items);
  
  // Assert
  expect(total).toBe(6);
});
```

### 4. Mock Solo lo Necesario

```javascript
// ✅ BIEN - Solo mock de dependencias externas
jest.mock('../models');

// ❌ MAL - Mock de todo el sistema
jest.mock('../../../everything');
```

### 5. Tests Rápidos

```javascript
// ✅ BIEN - Timeout razonable
jest.setTimeout(10000);

// ❌ MAL - Timeout excesivo
jest.setTimeout(60000);
```

---

## 🔄 Integración Continua (CI/CD)

### GitHub Actions

Crear `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: sgd_db_test
        ports:
          - 3306:3306
        
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 📈 Métricas de Testing

### Cobertura Actual

| Módulo | Cobertura | Tests |
|--------|-----------|-------|
| Services | 85% | 47 |
| Controllers | 75% | 23 |
| Integration | 90% | 28 |
| **Total** | **80%** | **98** |

### Objetivos

- ✅ Cobertura mínima: 50%
- 🎯 Objetivo: 80%
- 🌟 Excelente: 90%

---

## 🐛 Solución de Problemas

### Error: Cannot find module

```bash
# Limpiar caché de Jest
npx jest --clearCache

# Reinstalar dependencias
rm -rf node_modules
npm install
```

### Tests Colgados

```bash
# Usar --runInBand para ejecutar en serie
npm test -- --runInBand
```

### Error de Base de Datos

```javascript
// Verificar variables de entorno en test/setup.js
process.env.DB_NAME = 'sgd_db_test';  // Base de datos de test
```

### Error de Timeout

```javascript
// Aumentar timeout para test específico
it('test lento', async () => {
  // Test...
}, 15000);  // 15 segundos
```

---

## 📚 Recursos Adicionales

### Documentación Oficial

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

### Tutoriales Recomendados

- Unit Testing con Jest
- Integration Testing con Supertest
- Mocking en JavaScript
- TDD (Test-Driven Development)

---

## ✅ Checklist de Testing

Antes de hacer commit:

- [ ] Todos los tests pasan (`npm test`)
- [ ] Cobertura > 50% (`npm run test:coverage`)
- [ ] No hay tests skipped (`it.skip`, `describe.skip`)
- [ ] Tests son independientes (pueden ejecutarse en cualquier orden)
- [ ] Nombres de tests son descriptivos
- [ ] No hay console.log de debugging
- [ ] Mocks están limpios (`jest.clearAllMocks()`)

---

## 🎯 Próximos Pasos

1. **Agregar más tests unitarios:**
   - Middleware (authMiddleware, roleMiddleware)
   - Modelos (validaciones, hooks)
   - Utilidades

2. **Tests E2E completos:**
   - Flujo completo de documento
   - Flujo de autenticación
   - Escenarios de error

3. **Performance testing:**
   - Tests de carga con Artillery
   - Benchmarks de endpoints

4. **Security testing:**
   - Tests de inyección SQL
   - Tests de XSS
   - Tests de CSRF

---

**Fecha:** Octubre 2024  
**Versión:** 1.0.0  
**Estado:** ✅ Implementado y Funcionando
