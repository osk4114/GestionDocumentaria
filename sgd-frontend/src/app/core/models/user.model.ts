/**
 * Modelo de Usuario
 */
export interface User {
  id: number;
  username: string;
  email: string;
  nombre: string;
  isActive: boolean;
  areaId: number;
  rolId: number;
  createdAt?: string;
  updatedAt?: string;
  
  // Relaciones
  role?: Role;
  area?: Area;
}

/**
 * Modelo de Rol
 */
export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
}

/**
 * Modelo de Área
 */
export interface Area {
  id: number;
  nombre: string;
  sigla: string;
  descripcion?: string;
  isActive: boolean;
}
