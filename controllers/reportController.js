const { sequelize } = require('../config/sequelize');
const Sequelize = require('sequelize');

/**
 * Obtener estadísticas para el dashboard de reportes
 * Coincide con la interface ReportStats del frontend
 */
exports.getStats = async (req, res) => {
  try {
    // 1. Total de documentos
    const totalResult = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM documents
    `, { type: Sequelize.QueryTypes.SELECT });

    const totalDocuments = totalResult[0].total;

    // 2. Documentos por estado
    const byStatus = await sequelize.query(`
      SELECT 
        ds.nombre as status,
        ds.color as color,
        COUNT(d.id) as count
      FROM documents d
      INNER JOIN document_statuses ds ON d.status_id = ds.id
      GROUP BY ds.id, ds.nombre, ds.color
      ORDER BY ds.id
    `, { type: Sequelize.QueryTypes.SELECT });

    // 3. Documentos por área
    const byArea = await sequelize.query(`
      SELECT 
        a.nombre as area,
        COUNT(d.id) as count
      FROM documents d
      INNER JOIN areas a ON d.current_area_id = a.id
      GROUP BY a.id, a.nombre
      ORDER BY count DESC
    `, { type: Sequelize.QueryTypes.SELECT });

    // 4. Documentos por tipo
    const byType = await sequelize.query(`
      SELECT 
        dt.nombre as type,
        COUNT(d.id) as count
      FROM documents d
      INNER JOIN document_types dt ON d.doc_type_id = dt.id
      GROUP BY dt.id, dt.nombre
      ORDER BY count DESC
      LIMIT 10
    `, { type: Sequelize.QueryTypes.SELECT });

    // 5. Documentos por mes (últimos 6 meses)
    const byMonth = await sequelize.query(`
      SELECT 
        DATE_FORMAT(d.created_at, '%b %Y') as month,
        COUNT(d.id) as count
      FROM documents d
      WHERE d.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(d.created_at, '%Y-%m'), DATE_FORMAT(d.created_at, '%b %Y')
      ORDER BY DATE_FORMAT(d.created_at, '%Y-%m') ASC
    `, { type: Sequelize.QueryTypes.SELECT });

    // 6. Documentos por prioridad
    const byPriority = await sequelize.query(`
      SELECT 
        d.prioridad as priority,
        COUNT(d.id) as count
      FROM documents d
      WHERE d.prioridad IS NOT NULL
      GROUP BY d.prioridad
      ORDER BY 
        CASE d.prioridad
          WHEN 'baja' THEN 1
          WHEN 'normal' THEN 2
          WHEN 'alta' THEN 3
          WHEN 'urgente' THEN 4
        END
    `, { type: Sequelize.QueryTypes.SELECT });

    res.json({
      success: true,
      data: {
        totalDocuments,
        byStatus,
        byArea,
        byType,
        byMonth,
        byPriority
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Exportar reportes a CSV
 */
exports.exportToCsv = async (req, res) => {
  try {
    const { type = 'general', startDate, endDate } = req.query;

    let query = '';
    const replacements = {};

    // Construir filtro de fechas si existe
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = 'WHERE d.created_at BETWEEN :startDate AND :endDate';
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    }

    // Consulta según tipo de reporte
    if (type === 'general') {
      query = `
        SELECT 
          d.tracking_code as 'Código',
          d.asunto as 'Asunto',
          dt.nombre as 'Tipo',
          ds.nombre as 'Estado',
          a.nombre as 'Área',
          d.prioridad as 'Prioridad',
          CONCAT(
            COALESCE(s.nombres, ''), 
            ' ', 
            COALESCE(s.apellido_paterno, ''), 
            ' ', 
            COALESCE(s.apellido_materno, '')
          ) as 'Remitente',
          s.email as 'Email',
          s.telefono as 'Teléfono',
          DATE_FORMAT(d.created_at, '%d/%m/%Y %H:%i') as 'Fecha Registro'
        FROM documents d
        LEFT JOIN document_types dt ON d.doc_type_id = dt.id
        INNER JOIN document_statuses ds ON d.status_id = ds.id
        LEFT JOIN areas a ON d.current_area_id = a.id
        INNER JOIN senders s ON d.sender_id = s.id
        ${dateFilter}
        ORDER BY d.created_at DESC
        LIMIT 5000
      `;
    } else if (type === 'by-status') {
      query = `
        SELECT 
          ds.nombre as 'Estado',
          COUNT(d.id) as 'Total Documentos'
        FROM documents d
        INNER JOIN document_statuses ds ON d.status_id = ds.id
        ${dateFilter}
        GROUP BY ds.id, ds.nombre
        ORDER BY ds.id
      `;
    } else if (type === 'by-area') {
      query = `
        SELECT 
          a.nombre as 'Área',
          COUNT(d.id) as 'Total Documentos'
        FROM documents d
        LEFT JOIN areas a ON d.current_area_id = a.id
        ${dateFilter}
        GROUP BY a.id, a.nombre
        ORDER BY COUNT(d.id) DESC
      `;
    }

    const results = await sequelize.query(query, {
      replacements,
      type: Sequelize.QueryTypes.SELECT
    });

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay datos para exportar'
      });
    }

    // Generar CSV
    const headers = Object.keys(results[0]);
    const csvRows = [];
    
    // Agregar encabezados
    csvRows.push(headers.join(','));
    
    // Agregar datos
    for (const row of results) {
      const values = headers.map(header => {
        const value = row[header];
        // Escapar comillas y encerrar en comillas si contiene coma o salto de línea
        const escaped = String(value || '').replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r') 
          ? `"${escaped}"` 
          : escaped;
      });
      csvRows.push(values.join(','));
    }
    
    const csv = csvRows.join('\n');
    
    // Enviar como descarga
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${type}_${Date.now()}.csv`);
    res.send('\ufeff' + csv); // BOM para UTF-8

  } catch (error) {
    console.error('Error al exportar CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar reporte',
      error: error.message
    });
  }
};
