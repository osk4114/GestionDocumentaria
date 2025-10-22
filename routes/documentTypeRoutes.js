const express = require('express');
const router = express.Router();
const { DocumentType } = require('../models');

/**
 * @route   GET /api/document-types
 * @desc    Obtener todos los tipos de documento
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const documentTypes = await DocumentType.findAll({
      attributes: ['id', 'nombre', 'descripcion'],
      order: [['nombre', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: documentTypes
    });

  } catch (error) {
    console.error('Error al obtener tipos de documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de documento',
      error: error.message
    });
  }
});

module.exports = router;
