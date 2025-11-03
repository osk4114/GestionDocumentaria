/**
 * Configuración de ambiente para desarrollo
 * 
 * IMPORTANTE: Esta configuración funciona automáticamente en:
 * - localhost (http://localhost:4200)
 * - Red LAN con IP dinámica (http://192.168.x.x:4200)
 * - DevTunnels (https://xxx.devtunnels.ms)
 * - Cualquier otra red
 * 
 * NO requiere modificar URLs ni IPs manualmente.
 * El proxy de Angular redirige automáticamente /api → localhost:3000
 */

export const environment = {
  production: false,
  apiUrl: '/api', // Ruta relativa - el proxy redirige a localhost:3000
  appName: 'Sistema de Gestión Documentaria',
  appVersion: '1.0.0'
};
