/**
 * Tests de integración para endpoints de autenticación
 */

const request = require('supertest');
const { app } = require('../../server');
const { User, UserSession, Role, Area } = require('../../models');
const bcrypt = require('bcryptjs');

describe('API de Autenticación - Tests de Integración', () => {
  
  let testUser;
  let authToken;

  // Setup antes de todos los tests
  beforeAll(async () => {
    // Crear usuario de prueba
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    // Asegurarse que exista un rol y área
    const role = await Role.findOne({ where: { nombre: 'Funcionario' } }) || 
                  await Role.create({ nombre: 'Funcionario', descripcion: 'Test' });
                  
    const area = await Area.findOne({ where: { nombre: 'Test Area' } }) || 
                  await Area.create({ nombre: 'Test Area', sigla: 'TA' });

    testUser = await User.create({
      email: 'test-integration@test.com',
      password: hashedPassword,
      nombre: 'Test Integration User',
      rolId: role.id,
      areaId: area.id,
      isActive: true
    });
  });

  // Cleanup después de todos los tests
  afterAll(async () => {
    // Limpiar datos de prueba
    if (testUser) {
      await UserSession.destroy({ where: { userId: testUser.id } });
      await User.destroy({ where: { id: testUser.id } });
    }
  });

  describe('POST /api/auth/login', () => {
    it('debería hacer login con credenciales válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-integration@test.com',
          password: 'testpassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test-integration@test.com');

      // Guardar token para otros tests
      authToken = response.body.token;
    });

    it('debería rechazar login con password incorrecta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-integration@test.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Credenciales inválidas');
    });

    it('debería rechazar login con email inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noexiste@test.com',
          password: 'anypassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('debería rechazar login sin email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email y password son obligatorios');
    });

    it('debería rechazar login sin password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('debería obtener el perfil del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe('test-integration@test.com');
    });

    it('debería rechazar acceso sin token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token no proporcionado');
    });

    it('debería rechazar token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/sessions', () => {
    it('debería listar sesiones activas del usuario', async () => {
      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('debería rechazar sin autenticación', async () => {
      const response = await request(app)
        .get('/api/auth/sessions')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('debería cerrar sesión correctamente', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Sesión cerrada');
    });

    it('debería rechazar uso del token después del logout', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Sesión inválida');
    });
  });

  describe('Rate Limiting', () => {
    it('debería aplicar rate limiting después de múltiples intentos', async () => {
      // Hacer múltiples intentos de login fallidos
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@test.com',
            password: 'wrongpassword'
          });
      }

      // El siguiente debería ser bloqueado
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword'
        })
        .expect(429);

      expect(response.body.message).toContain('Demasiados intentos');
    }, 15000); // Timeout extendido para este test
  });
});
