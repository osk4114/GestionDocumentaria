const { UserSession, LoginAttempt } = require('../models');
const { Op } = require('sequelize');
const { cleanupOldAttempts } = require('../controllers/authController');

/**
 * Verificar integridad de sesiones al iniciar el servidor
 * Solo reporta el estado, NO invalida sesiones activas
 * Las sesiones se invalidan por expiración temporal, no por reinicio del servidor
 */
const verifySessionsOnStartup = async () => {
  try {
    const activeSessions = await UserSession.count({
      where: { isActive: true }
    });

    const expiredSessions = await UserSession.count({
      where: {
        isActive: true,
        expiresAt: {
          [Op.lt]: new Date()
        }
      }
    });

    console.log(`📊 Sesiones activas: ${activeSessions}`);
    if (expiredSessions > 0) {
      console.log(`⚠️ Sesiones expiradas que serán limpiadas: ${expiredSessions}`);
    }
  } catch (error) {
    console.error('✗ Error al verificar sesiones:', error);
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
  // Verificar estado de sesiones al inicio (no invalida, solo reporta)
  verifySessionsOnStartup();

  // Ejecutar limpieza de sesiones expiradas inmediatamente
  cleanupExpiredSessions();

  // Programar ejecuciones periódicas de limpieza
  setInterval(cleanupExpiredSessions, intervalMs);
  
  console.log(`✓ Limpieza automática programada cada ${intervalMs / 1000 / 60} minutos`);
};

module.exports = {
  cleanupExpiredSessions,
  verifySessionsOnStartup,
  startCleanupSchedule
};
