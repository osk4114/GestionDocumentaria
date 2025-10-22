const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, Area } = require('../models');

// Secret key para JWT (en producción usar variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'sgd_secret_key_2025_change_in_production';
const JWT_EXPIRES_IN = '24h';

/**
 * Registrar nuevo usuario
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { nombre, email, password, rolId, areaId } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password || !rolId) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email, password y rol son obligatorios'
      });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Verificar que el rol existe
    const role = await Role.findByPk(rolId);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'El rol especificado no existe'
      });
    }

    // Verificar área si se proporcionó
    if (areaId) {
      const area = await Area.findByPk(areaId);
      if (!area) {
        return res.status(400).json({
          success: false,
          message: 'El área especificada no existe'
        });
      }
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const user = await User.create({
      nombre,
      email,
      password: hashedPassword,
      rolId,
      areaId: areaId || null
    });

    // Obtener usuario con relaciones
    const userWithRelations = await User.findByPk(user.id, {
      include: [
        { model: Role, as: 'role', attributes: ['id', 'nombre'] },
        { model: Area, as: 'area', attributes: ['id', 'nombre', 'sigla'] }
      ],
      attributes: { exclude: ['password'] }
    });

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        rolId: user.rolId 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: userWithRelations,
        token
      }
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

/**
 * Login de usuario
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y password son obligatorios'
      });
    }

    // Buscar usuario por email
    const user = await User.findOne({ 
      where: { email },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'nombre'] },
        { model: Area, as: 'area', attributes: ['id', 'nombre', 'sigla'] }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        rolId: user.rolId,
        areaId: user.areaId
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Remover password de la respuesta
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

/**
 * Obtener perfil del usuario autenticado
 * GET /api/auth/me
 */
const getProfile = async (req, res) => {
  try {
    // req.user viene del middleware de autenticación
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: Role, as: 'role', attributes: ['id', 'nombre', 'descripcion'] },
        { model: Area, as: 'area', attributes: ['id', 'nombre', 'sigla'] }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

/**
 * Cambiar contraseña
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva son obligatorias'
      });
    }

    // Validar longitud mínima
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Buscar usuario
    const user = await User.findByPk(req.user.id);

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña
    await user.update({ password: hashedPassword });

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  changePassword
};
