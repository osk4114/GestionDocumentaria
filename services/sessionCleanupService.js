const { UserSession, LoginAttempt } = require('../models');
const { Op } = require('sequelize');
const { cleanupOldAttempts } = require('../controllers/authController');

/**
 * Invalidar TODAS las sesiones al iniciar el servidor
 * Cuando el servidor se reinicia, todas las sesiones WebSocket se pierden
 * Por lo tanto, todas las sesiones deben ser invalidadas
 */
const cleanupStaleSessionsOnStartup = async () => {
  try {
    const result = await UserSession.update(
      { isActive: false },
      {
        where: {
          isActive: true
        }
      }
    );

    if (result[0] > 0) {
      console.log(`🧹 Limpieza de inicio: ${result[0]} sesiones invalidadas (servidor reiniciado)`);
    } else {
      console.log(`✓ No hay sesiones activas para limpiar`);
    }
  } catch (error) {
    console.error('✗ Error en limpieza de inicio:', error);
  }
};

/**
 * Limpieza automática de sesiones expiradas
 * Ejecutar cada hora
 */
const cleanupExpiredSessions = async () => {
  try {
    const now = new Date();
    
    // Desactivar sesiones expiradas
    const result = await UserSession.update(
      { isActive: false },
      {
        where: {
          isActive: true,
          expiresAt: {
            [Op.lt]: now
          }
        }
      }
    );

    console.log(`✓ Limpieza completada: ${result[0]} sesiones expiradas desactivadas`);

    // Eliminar sesiones antiguas (más de 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await UserSession.destroy({
      where: {
        updated_at: {
          [Op.lt]: thirtyDaysAgo
        }
      }
    });

    console.log(`✓ ${deleted} sesiones antiguas eliminadas`);

    // Limpiar intentos de login antiguos
    await cleanupOldAttempts();
    console.log('✓ Intentos de login antiguos limpiados');

  } catch (error) {
    console.error('✗ Error en limpieza automática:', error);
  }
};

/**
 * Iniciar proceso de limpieza periódica
 * Por defecto cada hora
 */
const startCleanupSchedule = (intervalMs = 3600000) => {
  // Limpiar sesiones inactivas al inicio
  cleanupStaleSessionsOnStartup();

  // Ejecutar limpieza de expiradas inmediatamente
  cleanupExpiredSessions();

  // Programar ejecuciones periódicas
  setInterval(cleanupExpiredSessions, intervalMs);
  
  console.log(`✓ Limpieza automática programada cada ${intervalMs / 1000 / 60} minutos`);
};

module.exports = {
  cleanupExpiredSessions,
  cleanupStaleSessionsOnStartup,
  startCleanupSchedule
};
