const { UserSession, LoginAttempt } = require('../models');
const { Op } = require('sequelize');
const { cleanupOldAttempts } = require('../controllers/authController');

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
  // Ejecutar inmediatamente
  cleanupExpiredSessions();

  // Programar ejecuciones periódicas
  setInterval(cleanupExpiredSessions, intervalMs);
  
  console.log(`✓ Limpieza automática programada cada ${intervalMs / 1000 / 60} minutos`);
};

module.exports = {
  cleanupExpiredSessions,
  startCleanupSchedule
};
