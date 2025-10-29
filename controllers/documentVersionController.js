const { DocumentVersion, Document, User, Area } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;

/**
 * Controlador de Versiones de Documentos
 * Gestiona el historial de versiones de documentos (con sellos y firmas)
 */

/**
 * Obtener todas las versiones de un documento
 * @route GET /api/documents/:documentId/versions
 * @access Private
 */
exports.getVersionsByDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Verificar que el documento existe
    const document = await Document.findByPk(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    const versions = await DocumentVersion.findAll({
      where: { documentId },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'nombre', 'sigla']
        }
      ],
      order: [['versionNumber', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: versions.length,
      data: versions
    });

  } catch (error) {
    console.error('Error en getVersionsByDocument:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener versiones del documento',
      error: error.message
    });
  }
};

/**
 * Obtener versión específica
 * @route GET /api/documents/versions/:id
 * @access Private
 */
exports.getVersionById = async (req, res) => {
  try {
    const { id } = req.params;

    const version = await DocumentVersion.findByPk(id, {
      include: [
        {
          model: Document,
          as: 'document',
          attributes: ['id', 'trackingCode', 'asunto']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'nombre', 'sigla']
        }
      ]
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Versión no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: version
    });

  } catch (error) {
    console.error('Error en getVersionById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener versión',
      error: error.message
    });
  }
};

/**
 * Subir nueva versión de documento
 * @route POST /api/documents/:documentId/versions
 * @access Private
 */
exports.uploadVersion = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { descripcion, tieneSello, tieneFirma } = req.body;
    const userId = req.user?.id;
    const userAreaId = req.user?.areaId;

    // Verificar que el documento existe
    const document = await Document.findByPk(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    // Obtener el siguiente número de versión
    const lastVersion = await DocumentVersion.findOne({
      where: { documentId },
      order: [['versionNumber', 'DESC']]
    });

    const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    // Crear registro de versión
    const version = await DocumentVersion.create({
      documentId: documentId,
      versionNumber: nextVersionNumber,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      descripcion: descripcion || null,
      tieneSello: tieneSello === 'true' || tieneSello === true,
      tieneFirma: tieneFirma === 'true' || tieneFirma === true,
      uploadedBy: userId,
      areaId: userAreaId
    });

    // Obtener versión con relaciones
    const versionWithRelations = await DocumentVersion.findByPk(version.id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'nombre', 'sigla']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Nueva versión del documento subida exitosamente',
      data: versionWithRelations
    });

  } catch (error) {
    console.error('Error en uploadVersion:', error);
    
    // Eliminar archivo si hubo error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error al subir versión del documento',
      error: error.message
    });
  }
};

/**
 * Descargar versión específica
 * @route GET /api/documents/versions/:id/download
 * @access Private
 */
exports.downloadVersion = async (req, res) => {
  try {
    const { id } = req.params;

    const version = await DocumentVersion.findByPk(id);

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Versión no encontrada'
      });
    }

    // Verificar que el archivo existe
    const filePath = path.resolve(version.filePath);
    
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en el servidor'
      });
    }

    // Descargar archivo
    res.download(filePath, version.originalName, (err) => {
      if (err) {
        console.error('Error al descargar archivo:', err);
        res.status(500).json({
          success: false,
          message: 'Error al descargar archivo'
        });
      }
    });

  } catch (error) {
    console.error('Error en downloadVersion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar versión',
      error: error.message
    });
  }
};

/**
 * Eliminar versión
 * @route DELETE /api/documents/versions/:id
 * @access Private (Solo Admin o creador)
 */
exports.deleteVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role?.nombre;

    const version = await DocumentVersion.findByPk(id);

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Versión no encontrada'
      });
    }

    // Verificar permisos: solo admin o el que subió la versión
    if (userRole !== 'Administrador' && version.uploadedBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta versión'
      });
    }

    // No permitir eliminar la versión 1 si hay otras versiones
    if (version.versionNumber === 1) {
      const otherVersions = await DocumentVersion.count({
        where: { 
          documentId: version.documentId,
          versionNumber: { [Op.gt]: 1 }
        }
      });

      if (otherVersions > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar la versión original si existen versiones posteriores'
        });
      }
    }

    // Eliminar archivo físico
    try {
      await fs.unlink(version.filePath);
    } catch (unlinkError) {
      console.warn('No se pudo eliminar el archivo físico:', unlinkError);
    }

    // Eliminar registro
    await version.destroy();

    res.status(200).json({
      success: true,
      message: 'Versión eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error en deleteVersion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar versión',
      error: error.message
    });
  }
};

/**
 * Obtener última versión de un documento
 * @route GET /api/documents/:documentId/versions/latest
 * @access Private
 */
exports.getLatestVersion = async (req, res) => {
  try {
    const { documentId } = req.params;

    const version = await DocumentVersion.findOne({
      where: { documentId },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'nombre', 'sigla']
        }
      ],
      order: [['versionNumber', 'DESC']]
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron versiones para este documento'
      });
    }

    res.status(200).json({
      success: true,
      data: version
    });

  } catch (error) {
    console.error('Error en getLatestVersion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener última versión',
      error: error.message
    });
  }
};

module.exports = exports;
