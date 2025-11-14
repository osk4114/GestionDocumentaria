/**
 * Configuración de ambiente para producción
 * 
 * IMPORTANTE: Antes de compilar para producción, configurar:
 * 1. apiUrl: URL de la API en producción (ej: https://api.drtcpuno.gob.pe/api)
 * 2. socketUrl: URL del servidor WebSocket (ej: https://api.drtcpuno.gob.pe)
 * 
 * Build de producción:
 *   npm run build --configuration=production
 */

export const environment = {
  production: true,
  
  // URL de la API REST
  apiUrl: 'https://api.sgd-drtcpuno.me/api',
  
  // URL del servidor WebSocket
  socketUrl: 'https://api.sgd-drtcpuno.me',
  
  // Información de la aplicación
  appName: 'Sistema de Gestión Documentaria',
  appVersion: '3.5.0',
  
  // Configuración de timeouts (en milisegundos)
  apiTimeout: 30000,
  socketTimeout: 5000,
  
  // Características habilitadas en producción
  features: {
    enableNotifications: true,
    enableEmailNotifications: true,
    enableFileUpload: true,
    enableRealTimeUpdates: true,
    enableAnalytics: false // Cambiar a true si se implementa analytics
  },
  
  // Límites
  maxFileSize: 10485760, // 10 MB en bytes
  allowedFileTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ]
};
