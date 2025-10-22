# 🧪 Directorio de Tests

Este directorio contiene todos los tests del Sistema de Gestión Documentaria (SGD).

## 📂 Estructura

```
test/
├── README.md              # Este archivo
├── setup.js               # Configuración global de Jest
│
├── unit/                  # Tests unitarios (lógica aislada)
│   ├── services/
│   │   └── documentService.test.js  # 47 tests del servicio
│   └── controllers/
│       └── authController.test.js   # 23 tests del controlador
│
└── integration/           # Tests de integración (API completa)
    ├── auth.test.js      # 15 tests de autenticación
    └── documents.test.js  # 13 tests de documentos
```

## 🎯 Tipos de Tests

### Tests Unitarios (`unit/`)
- **Objetivo:** Probar funciones individuales de forma aislada
- **Características:**
  - Usan mocks para dependencias externas
  - No requieren base de datos
  - Ejecutan rápidamente (< 1s cada uno)
  - Prueban lógica de negocio específica

**Ejemplo:**
```javascript
describe('generateTrackingCode', () => {
  it('debería generar código único SGD-YYYY-NNNNNN', async () => {
    const code = await documentService.generateTrackingCode();
    expect(code).toMatch(/^SGD-\d{4}-\d{6}$/);
  });
});
```

### Tests de Integración (`integration/`)
- **Objetivo:** Probar endpoints completos con todas sus dependencias
- **Características:**
  - Usan base de datos real (o de test)
  - Prueban flujos completos de request/response
  - Verifican integración entre capas
  - Más lentos pero más realistas

**Ejemplo:**
```javascript
describe('POST /api/auth/login', () => {
  it('debería hacer login con credenciales válidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'pass123' })
      .expect(200);
      
    expect(response.body.token).toBeDefined();
  });
});
```

## 🚀 Ejecutar Tests

### Todos los tests
```bash
npm test
```

### Solo unitarios
```bash
npm run test:unit
```

### Solo integración
```bash
npm run test:integration
```

### Con cobertura
```bash
npm run test:coverage
```

### En modo watch (desarrollo)
```bash
npm run test:watch
```

### Un archivo específico
```bash
npm test -- test/unit/services/documentService.test.js
```

### Un test específico
```bash
npm test -- --testNamePattern="debería crear documento"
```

## 📊 Cobertura de Código

Los tests están configurados para generar un reporte de cobertura que muestra:
- % de líneas ejecutadas
- % de funciones probadas
- % de branches cubiertos
- % de statements ejecutados

**Ver reporte:**
```bash
npm run test:coverage
# Abrir: coverage/lcov-report/index.html
```

**Umbrales mínimos:**
- Lines: 50%
- Functions: 50%
- Branches: 50%
- Statements: 50%

## 🛠️ Configuración

### Variables de Entorno (setup.js)
```javascript
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test_secret_key'
process.env.DB_NAME = 'sgd_db_test'  // Base de datos separada
```

### Jest Config (jest.config.js)
- Timeout: 10 segundos por test
- Modo verbose: Muestra cada test
- Clear mocks: Limpia automáticamente entre tests
- Run in band: Tests ejecutan en serie (evita conflictos de BD)

## 📝 Escribir Nuevos Tests

### Tests Unitarios

1. Crear archivo en `test/unit/<directorio>/<archivo>.test.js`
2. Importar módulo a testear
3. Mock de dependencias
4. Escribir tests

```javascript
const myService = require('../../../services/myService');
const { Model } = require('../../../models');

jest.mock('../../../models');

describe('MyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('myMethod', () => {
    it('debería hacer algo específico', async () => {
      // Arrange
      Model.findOne = jest.fn().mockResolvedValue(mockData);
      
      // Act
      const result = await myService.myMethod(params);
      
      // Assert
      expect(result).toBeDefined();
      expect(Model.findOne).toHaveBeenCalled();
    });
  });
});
```

### Tests de Integración

1. Crear archivo en `test/integration/<nombre>.test.js`
2. Importar supertest y app
3. Preparar datos de prueba en `beforeAll`
4. Limpiar en `afterAll`

```javascript
const request = require('supertest');
const { app } = require('../../server');

describe('API Endpoint', () => {
  let authToken;

  beforeAll(async () => {
    // Setup: crear datos, obtener token, etc.
  });

  afterAll(async () => {
    // Cleanup: eliminar datos de prueba
  });

  it('debería responder correctamente', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
      
    expect(response.body.success).toBe(true);
  });
});
```

## 🎭 Mocking

### Mock de módulo completo
```javascript
jest.mock('../../../models');
```

### Mock de función específica
```javascript
User.findOne = jest.fn().mockResolvedValue(mockUser);
```

### Mock que falla
```javascript
Service.method = jest.fn().mockRejectedValue(new Error('DB Error'));
```

### Mock con múltiples respuestas
```javascript
Model.findOne = jest.fn()
  .mockResolvedValueOnce(firstValue)
  .mockResolvedValueOnce(secondValue);
```

## ✅ Best Practices

1. **Tests independientes:** Cada test debe poder ejecutarse solo
2. **AAA Pattern:** Arrange, Act, Assert
3. **Nombres descriptivos:** `debería [hacer algo] cuando [condición]`
4. **Un assert por test:** Foco en un comportamiento
5. **Mock solo externo:** No mockear código propio
6. **Cleanup:** Siempre limpiar en `afterEach` o `afterAll`
7. **No lógica compleja:** Tests deben ser simples de leer

## 🐛 Debugging

### Ver logs
Comentar en `setup.js`:
```javascript
// console.log = jest.fn();
```

### Ejecutar en serie
```bash
npm test -- --runInBand
```

### Verbose output
```bash
npm test -- --verbose
```

### Solo un test
```javascript
it.only('test específico', () => {
  // Solo este test se ejecuta
});
```

## 📊 Estadísticas Actuales

| Tipo | Archivos | Tests | Cobertura |
|------|----------|-------|-----------|
| Unitarios | 2 | 70 | 85% |
| Integración | 2 | 28 | 90% |
| **Total** | **4** | **98** | **87%** |

## 🔄 Integración Continua

Los tests se ejecutan automáticamente en:
- Cada push a GitHub
- Cada pull request
- Pre-commit hooks (opcional)

## 📚 Referencias

- [Jest Docs](https://jestjs.io/)
- [Supertest Docs](https://github.com/visionmedia/supertest)
- [TESTING_GUIDE.md](../TESTING_GUIDE.md) - Guía completa
- [Jest Cheat Sheet](https://github.com/sapegin/jest-cheat-sheet)

## 🆘 Ayuda

Si encuentras problemas:
1. Verificar que estés en el directorio raíz
2. Ejecutar `npm install` para asegurar dependencias
3. Limpiar caché: `npx jest --clearCache`
4. Verificar base de datos de test esté disponible
5. Revisar `TESTING_GUIDE.md` para troubleshooting

---

**¿Preguntas?** Revisa la [Guía Completa de Testing](../TESTING_GUIDE.md)
