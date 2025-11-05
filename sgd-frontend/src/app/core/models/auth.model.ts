import { User } from './user.model';

/**
 * Credenciales para login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Respuesta del login
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    sessionId: number;
    expiresIn: string;
    user: User;
    permissions?: string[]; // Códigos de permisos del usuario
  };
}

/**
 * Respuesta del refresh token
 */
export interface RefreshTokenResponse {
  success: boolean;
  data: {
    token: string;
    refreshToken: string;
    sessionId: number;
  };
}

/**
 * Información de sesión activa
 */
export interface UserSession {
  id: number;
  ipAddress: string;
  userAgent: string;
  lastActivity: string;
  expiresAt: string;
  isActive: boolean;
}

/**
 * Request para cambio de contraseña
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Request para registro de usuario
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nombre: string;
  areaId: number;
  rolId: number;
}
