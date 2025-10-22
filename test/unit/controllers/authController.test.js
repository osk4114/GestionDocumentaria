/**
 * Tests unitarios para authController
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = require('../../../controllers/authController');
const { User, Role, Area, UserSession, LoginAttempt } = require('../../../models');

// Mock de los módulos
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../models');

describe('AuthController', () => {
  
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock de request y response
    req = {
      body: {},
      headers: {},
      user: null,
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0')
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('login', () => {
    it('debería hacer login exitosamente con credenciales válidas', async () => {
      // Datos de prueba
      req.body = {
        email: 'test@test.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password: 'hashedPassword',
        nombre: 'Test User',
        rolId: 1,
        areaId: 1,
        isActive: true,
        role: { id: 1, nombre: 'Funcionario' },
        area: { id: 1, nombre: 'Area Test' }
      };

      // Mock de búsqueda de usuario
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      // Mock de comparación de password
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      // Mock de JWT
      const mockToken = 'mock.jwt.token';
      const mockRefreshToken = 'mock.refresh.token';
      jwt.sign = jest.fn()
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(mockRefreshToken);

      // Mock de creación de sesión
      UserSession.create = jest.fn().mockResolvedValue({
        id: 'session-id-123'
      });

      // Mock de LoginAttempt
      LoginAttempt.create = jest.fn().mockResolvedValue({});

      // Ejecutar
      await authController.login(req, res);

      // Verificar
      expect(User.findOne).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledTimes(2); // token y refreshToken
      expect(UserSession.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: mockToken,
          refreshToken: mockRefreshToken
        })
      );
    });

    it('debería rechazar login con credenciales inválidas', async () => {
      req.body = {
        email: 'test@test.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password: 'hashedPassword'
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(false);
      LoginAttempt.create = jest.fn().mockResolvedValue({});

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Credenciales inválidas')
        })
      );
    });

    it('debería rechazar login si el usuario no existe', async () => {
      req.body = {
        email: 'noexiste@test.com',
        password: 'password123'
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      LoginAttempt.create = jest.fn().mockResolvedValue({});

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Credenciales inválidas')
        })
      );
    });

    it('debería rechazar login si el usuario está inactivo', async () => {
      req.body = {
        email: 'test@test.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password: 'hashedPassword',
        isActive: false
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);
      LoginAttempt.create = jest.fn().mockResolvedValue({});

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('inactiva')
        })
      );
    });

    it('debería manejar errores del servidor', async () => {
      req.body = {
        email: 'test@test.com',
        password: 'password123'
      };

      User.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Error')
        })
      );
    });
  });

  describe('logout', () => {
    it('debería cerrar sesión correctamente', async () => {
      req.user = {
        id: 1,
        sessionId: 'session-123'
      };

      const mockSession = {
        update: jest.fn().mockResolvedValue(true)
      };

      UserSession.findOne = jest.fn().mockResolvedValue(mockSession);

      await authController.logout(req, res);

      expect(UserSession.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session-123' }
        })
      );
      expect(mockSession.update).toHaveBeenCalledWith({ isActive: false });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('cerrada')
        })
      );
    });

    it('debería manejar sesión no encontrada', async () => {
      req.user = {
        id: 1,
        sessionId: 'invalid-session'
      };

      UserSession.findOne = jest.fn().mockResolvedValue(null);

      await authController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Sesión no encontrada')
        })
      );
    });
  });

  describe('register', () => {
    it('debería registrar un nuevo usuario correctamente', async () => {
      req.body = {
        email: 'nuevo@test.com',
        password: 'password123',
        nombre: 'Nuevo Usuario',
        rolId: 2,
        areaId: 1
      };

      // Usuario no existe
      User.findOne = jest.fn().mockResolvedValue(null);

      // Hash de password
      bcrypt.hash = jest.fn().mockResolvedValue('hashedPassword');

      // Creación de usuario
      const mockUser = {
        id: 2,
        ...req.body,
        password: 'hashedPassword'
      };
      User.create = jest.fn().mockResolvedValue(mockUser);

      // Usuario con relaciones
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        role: { nombre: 'Funcionario' },
        area: { nombre: 'Area Test' }
      });

      await authController.register(req, res);

      expect(User.findOne).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('registrado')
        })
      );
    });

    it('debería rechazar registro con email duplicado', async () => {
      req.body = {
        email: 'existente@test.com',
        password: 'password123',
        nombre: 'Usuario'
      };

      // Usuario ya existe
      User.findOne = jest.fn().mockResolvedValue({
        id: 1,
        email: 'existente@test.com'
      });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('ya existe')
        })
      );
    });
  });

  describe('refreshToken', () => {
    it('debería renovar el token correctamente', async () => {
      req.body = {
        refreshToken: 'valid.refresh.token'
      };

      const mockDecodedToken = {
        userId: 1,
        jti: 'session-123'
      };

      // Verificar refresh token
      jwt.verify = jest.fn().mockReturnValue(mockDecodedToken);

      // Sesión activa
      const mockSession = {
        id: 'session-123',
        userId: 1,
        isActive: true,
        update: jest.fn().mockResolvedValue(true)
      };
      UserSession.findOne = jest.fn().mockResolvedValue(mockSession);

      // Usuario
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        role: { nombre: 'Funcionario' }
      };
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      // Nuevos tokens
      const mockNewToken = 'new.jwt.token';
      const mockNewRefreshToken = 'new.refresh.token';
      jwt.sign = jest.fn()
        .mockReturnValueOnce(mockNewToken)
        .mockReturnValueOnce(mockNewRefreshToken);

      await authController.refreshToken(req, res);

      expect(jwt.verify).toHaveBeenCalled();
      expect(UserSession.findOne).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(mockSession.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: mockNewToken,
          refreshToken: mockNewRefreshToken
        })
      );
    });

    it('debería rechazar refresh token inválido', async () => {
      req.body = {
        refreshToken: 'invalid.token'
      };

      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('inválido')
        })
      );
    });
  });

  describe('getSessions', () => {
    it('debería listar todas las sesiones activas del usuario', async () => {
      req.user = { id: 1 };

      const mockSessions = [
        {
          id: 'session-1',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
          lastActivity: new Date()
        },
        {
          id: 'session-2',
          ipAddress: '192.168.1.1',
          userAgent: 'Chrome',
          createdAt: new Date(),
          lastActivity: new Date()
        }
      ];

      UserSession.findAll = jest.fn().mockResolvedValue(mockSessions);

      await authController.getSessions(req, res);

      expect(UserSession.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 1,
            isActive: true
          }
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 2,
          data: mockSessions
        })
      );
    });
  });
});
