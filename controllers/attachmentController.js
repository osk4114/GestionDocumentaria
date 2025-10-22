const { Attachment, Document, User } = require('../models');
const path = require('path');
const fs = require('fs').promises;

/**
 * Subir archivo adjunto
 */
exports.uploadAttachment = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { descripcion } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    // Verificar que el documento existe
    const document = await Document.findByPk(documentId);
    if (!document) {
      // Eliminar archivo subido si el documento no existe
      await fs.unlink(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Crear registro de adjunto
    const attachment = await Attachment.create({
      documentId,
      uploaderId: req.user.id,
      nombreArchivo: req.file.originalname,
      rutaArchivo: req.file.path,
      tipoMime: req.file.mimetype,
      tamano: req.file.size,
      descripcion
    });

    const fullAttachment = await Attachment.findByPk(attachment.id, {
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'nombre'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Archivo subido exitosamente',
      data: fullAttachment
    });

  } catch (error) {
    console.error('Error en uploadAttachment:', error);
    
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
      message: 'Error al subir archivo',
      error: error.message
    });
  }
};

/**
 * Descargar archivo adjunto
 */
exports.downloadAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await Attachment.findByPk(id, {
      include: [
        { model: Document, as: 'document' }
      ]
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    // Verificar que el archivo existe en el sistema
    try {
      await fs.access(attachment.rutaArchivo);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en el servidor'
      });
    }

    // Enviar archivo
    res.download(attachment.rutaArchivo, attachment.nombreArchivo);

  } catch (error) {
    console.error('Error en downloadAttachment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar archivo',
      error: error.message
    });
  }
};

/**
 * Eliminar archivo adjunto
 */
exports.deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await Attachment.findByPk(id, {
      include: [
        { model: Document, as: 'document' }
      ]
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    // Verificar permisos: solo el uploader, admin o área actual del documento
    const document = attachment.document;
    const isOwner = attachment.uploaderId === req.user.id;
    const isAdmin = req.user.role.nombre === 'Administrador';
    const isCurrentArea = document.currentAreaId === req.user.areaId;

    if (!isOwner && !isAdmin && !isCurrentArea) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este archivo'
      });
    }

    // Eliminar archivo físico
    try {
      await fs.unlink(attachment.rutaArchivo);
    } catch (unlinkError) {
      console.error('Error al eliminar archivo físico:', unlinkError);
      // Continuar aunque falle el borrado físico
    }

    // Eliminar registro de base de datos
    await attachment.destroy();

    res.status(200).json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en deleteAttachment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar archivo',
      error: error.message
    });
  }
};

/**
 * Listar adjuntos de un documento
 */
exports.listAttachments = async (req, res) => {
  try {
    const { documentId } = req.params;

    const attachments = await Attachment.findAll({
      where: { documentId },
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'nombre'] }
      ],
      order: [['uploaded_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: attachments.length,
      data: attachments
    });

  } catch (error) {
    console.error('Error en listAttachments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar archivos',
      error: error.message
    });
  }
};
