/**
 * ============================================================
 * CONFIGURACIÓN PM2 - Sistema de Gestión Documentaria (SGD)
 * ============================================================
 * 
 * Configuración para gestión de procesos Node.js en producción
 * 
 * USO:
 *   pm2 start ecosystem.config.js
 *   pm2 restart ecosystem.config.js
 *   pm2 stop ecosystem.config.js
 *   pm2 delete ecosystem.config.js
 * 
 * MONITOREO:
 *   pm2 status
 *   pm2 logs sgd-backend
 *   pm2 monit
 * 
 * ============================================================
 */

module.exports = {
  apps: [
    {
      // ========================================================
      // CONFIGURACIÓN BÁSICA
      // ========================================================
      name: 'sgd-backend',
      script: './server.js',
      
      // ========================================================
      // MODO DE EJECUCIÓN
      // ========================================================
      // 'cluster' distribuye carga entre múltiples procesos
      // 'fork' ejecuta un solo proceso
      exec_mode: 'cluster',
      
      // Número de instancias
      // 'max' usa todos los CPUs disponibles
      // Recomendado: 2-4 instancias para mejor balance
      instances: 2,
      
      // ========================================================
      // VARIABLES DE ENTORNO
      // ========================================================
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000
      },
      
      // ========================================================
      // GESTIÓN DE LOGS
      // ========================================================
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      
      // Formato de fecha en logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Combinar logs de todas las instancias
      merge_logs: true,
      
      // ========================================================
      // GESTIÓN DE MEMORIA
      // ========================================================
      // Reiniciar si el uso de memoria excede este límite
      max_memory_restart: '500M',
      
      // ========================================================
      // REINICIO AUTOMÁTICO
      // ========================================================
      // Reiniciar automáticamente si la app crashea
      autorestart: true,
      
      // Número máximo de reinicios consecutivos
      max_restarts: 10,
      
      // Tiempo mínimo de uptime antes de considerar exitoso
      min_uptime: '10s',
      
      // Delay entre reinicios (evitar restart loop)
      restart_delay: 4000,
      
      // ========================================================
      // WATCH MODE (DESHABILITADO EN PRODUCCIÓN)
      // ========================================================
      // Reiniciar automáticamente cuando cambien archivos
      watch: false,
      
      // Archivos/directorios a ignorar en watch mode
      ignore_watch: [
        'node_modules',
        'uploads',
        'logs',
        '.git',
        '*.log'
      ],
      
      // ========================================================
      // MANEJO DE SEÑALES
      // ========================================================
      // Tiempo de espera para graceful shutdown
      kill_timeout: 5000,
      
      // Escuchar señales de graceful reload
      listen_timeout: 3000,
      
      // ========================================================
      // CONFIGURACIÓN AVANZADA
      // ========================================================
      // Incrementar versión en cada deploy
      increment_var: 'PORT',
      
      // Deshabilitar auto-dump de proceso (performance)
      autoDump: false,
      
      // Deshabilitar trace de ejecución (performance)
      trace: false,
      
      // Deshabilitar interpretación de parámetros v8/node
      disable_trace: true,
      
      // ========================================================
      // CRON (TAREAS PROGRAMADAS)
      // ========================================================
      // Ejemplo: Reiniciar cada día a las 4:00 AM
      // cron_restart: '0 4 * * *',
      
      // ========================================================
      // SOURCE MAP SUPPORT
      // ========================================================
      // Habilitar si usas TypeScript compilado
      source_map_support: false,
      
      // ========================================================
      // POST-DEPLOY HOOKS (OPCIONAL)
      // ========================================================
      // Comandos a ejecutar después del deploy
      // post_update: ['npm install', 'echo "Deploy completado"'],
      
      // ========================================================
      // HEALTH CHECK (EXPERIMENTAL)
      // ========================================================
      // URL para verificar que la app está respondiendo
      // healthcheck: {
      //   interval: 5000,
      //   url: 'http://localhost:3000/api/health'
      // }
    }
  ],
  
  // ============================================================
  // CONFIGURACIÓN DE DEPLOY (OPCIONAL)
  // ============================================================
  // Permite hacer deploy remoto con: pm2 deploy production
  deploy: {
    production: {
      // Usuario SSH
      user: 'deploy',
      
      // Host del servidor
      host: '192.168.1.100',
      
      // Branch de Git
      ref: 'origin/main',
      
      // Repositorio
      repo: 'https://github.com/osk4114/GestionDocumentaria.git',
      
      // Ruta en el servidor
      path: '/var/www/sgd',
      
      // Comandos post-deploy
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      
      // Variables de entorno
      env: {
        NODE_ENV: 'production'
      }
    },
    
    staging: {
      user: 'deploy',
      host: '192.168.1.101',
      ref: 'origin/develop',
      repo: 'https://github.com/osk4114/GestionDocumentaria.git',
      path: '/var/www/sgd-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};
