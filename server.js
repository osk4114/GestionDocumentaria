// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, syncDatabase } = require('./models');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const movementRoutes = require('./routes/movementRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');

// Importar servicios
const { startCleanupSchedule } = require('./services/sessionCleanupService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
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
app.use('/api/movements', movementRoutes);
app.use('/api/attachments', attachmentRoutes);

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
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('✗ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();

module.exports = app;
