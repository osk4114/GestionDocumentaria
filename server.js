const express = require('express');
const cors = require('cors');
const { sequelize, syncDatabase } = require('./models');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await sequelize.authenticate();
    console.log('✓ Conexión a MySQL establecida correctamente');
    
    // Sincronizar modelos con la base de datos
    // NOTA: En producción usar migraciones en lugar de sync
    await syncDatabase(false); // false = no elimina tablas existentes
    
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
