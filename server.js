// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { sequelize, syncDatabase } = require('./models');
const { UserSession } = require('./models');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const documentTypeRoutes = require('./routes/documentTypeRoutes');
const movementRoutes = require('./routes/movementRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
// Rutas administrativas
const areaRoutes = require('./routes/areaRoutes');
const roleRoutes = require('./routes/roleRoutes');
const userRoutes = require('./routes/userRoutes');
// Rutas de permisos (v3.0)
const permissionRoutes = require('./routes/permissionRoutes');
const rolePermissionRoutes = require('./routes/rolePermissionRoutes');
const cargoRoutes = require('./routes/cargoRoutes');

// Importar servicios
const { startCleanupSchedule } = require('./services/sessionCleanupService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Permitir sin origin
      if (!origin) return callback(null, true);
      
      // Permitir localhost, IPs locales y DevTunnels
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(origin);
      const isLocalIP = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})/.test(origin);
      const isDevTunnel = /^https?:\/\/.*\.devtunnels\.ms/.test(origin);
      
      if (isLocalhost || isLocalIP || isDevTunnel) {
        callback(null, true);
      } else {
        callback(null, true); // En desarrollo, permitir de todos modos
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// Hacer io accesible globalmente para otros módulos
global.io = io;

// Configuración CORS mejorada para desarrollo y DevTunnels
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:4200',
      'http://localhost:3000',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:3000',
    ];
    
    // Permitir cualquier IP local (192.168.x.x, 10.x.x.x)
    const isLocalIP = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})/.test(origin);
    
    // Permitir DevTunnels (*.devtunnels.ms)
    const isDevTunnel = /^https?:\/\/.*\.devtunnels\.ms(:\d+)?$/.test(origin);
    
    if (allowedOrigins.includes(origin) || isLocalIP || isDevTunnel) {
      callback(null, true);
    } else {
      console.log('⚠️  Origen no permitido por CORS:', origin);
      callback(null, true); // En desarrollo, permitir de todos modos
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de uploads (con autenticación en producción)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SGD API funcionando correctamente',
    timestamp: new Date()
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/document-types', documentTypeRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/reports', reportRoutes);
// Rutas administrativas
app.use('/api/areas', areaRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
// Rutas de permisos (v3.0 RBAC)
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', rolePermissionRoutes);
app.use('/api/cargos', cargoRoutes);

// Configurar Socket.IO
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  // Autenticar usuario mediante token
  socket.on('authenticate', async (data) => {
    const { userId, sessionId } = data;
    
    if (userId && sessionId) {
      try {
        // Verificar que la sesión existe y está activa
        const session = await UserSession.findOne({
          where: {
            id: sessionId,
            userId: userId,
            isActive: true
          }
        });

        if (session) {
          // Sesión válida - autenticar WebSocket
          socket.join(`user:${userId}`);
          socket.userId = userId;
          socket.sessionId = sessionId;
          console.log(`✓ Usuario ${userId} autenticado (sesión: ${sessionId})`);
        } else {
          // Sesión inválida - rechazar autenticación
          console.warn(`⚠️ Intento de autenticación con sesión inválida: ${sessionId}`);
          socket.emit('authentication-failed', {
            reason: 'session-invalid',
            message: 'Tu sesión ha expirado o fue cerrada'
          });
          socket.disconnect(true);
        }
      } catch (error) {
        console.error('❌ Error verificando sesión:', error);
        socket.disconnect(true);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
  });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await sequelize.authenticate();
    console.log('✓ Conexión a MySQL establecida correctamente');
    
    // Sincronizar modelos con la base de datos
    // NOTA: En producción usar migraciones en lugar de sync
    await syncDatabase(false); // false = no elimina tablas existentes
    
    // Iniciar servicio de limpieza automática de sesiones
    startCleanupSchedule(); // Ejecuta cada hora por defecto
    
    // Iniciar servidor HTTP (escuchando en todas las interfaces)
    server.listen(PORT, '0.0.0.0', () => {
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      let localIP = 'localhost';
      
      // Obtener la IP de la red local
      Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(iface => {
          if (iface.family === 'IPv4' && !iface.internal) {
            localIP = iface.address;
          }
        });
      });
      
      console.log(`✓ Servidor HTTP corriendo en:`);
      console.log(`  - Local:   http://localhost:${PORT}`);
      console.log(`  - Red:     http://${localIP}:${PORT}`);
      console.log(`✓ WebSocket corriendo en:`);
      console.log(`  - Local:   ws://localhost:${PORT}`);
      console.log(`  - Red:     ws://${localIP}:${PORT}`);
      console.log(`✓ Health check: http://${localIP}:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('✗ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

// Solo iniciar el servidor si se ejecuta directamente
// (no cuando se importa para tests)
if (require.main === module) {
  startServer();
}

module.exports = { app, io, server };
