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
 * Modelo de Permiso
 */
export interface Permission {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  nivel?: string;
}

/**
 * Modelo de Rol
 */
export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
  es_sistema?: boolean;
  puede_asignar_permisos?: boolean;
  is_active?: boolean;
  permissions?: Permission[];
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
