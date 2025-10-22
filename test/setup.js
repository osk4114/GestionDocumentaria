/**
 * Configuración global para tests
 * Se ejecuta antes de todos los tests
 */

// Configurar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'sgd_db_test';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';

// Deshabilitar logs durante tests
console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();
// Mantener console.error para debugging
// console.error = jest.fn();

// Timeout global para operaciones asíncronas
jest.setTimeout(10000);
