module.exports = {
  // Entorno de ejecución
  testEnvironment: 'node',
  
  // Transformar node_modules/uuid para Jest
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],
  
  // Cobertura de código
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Archivos a incluir en cobertura
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/coverage/**'
  ],
  
  // Umbrales de cobertura
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // Patrones de archivos de test
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Setup antes de los tests
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  // Timeout por test (10 segundos)
  testTimeout: 10000,
  
  // Mostrar cada test individual
  verbose: true,
  
  // Limpiar mocks entre tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
