const express = require('express');
const router = express.Router();
const cargoController = require('../controllers/cargoController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkAnyPermission } = require('../middleware/permissionMiddleware');

/**
 * Rutas para gestión de cargos (versiones conservadas)
 * Base: /api/cargos
 */

/**
 * @route   POST /api/cargos
 * @desc    Conservar una versión como cargo
 * @access  Private (requiere crear cargos)
 */
router.post('/', 
  authMiddleware, 
  checkAnyPermission(['area_mgmt.cargos.create']),
  cargoController.createCargo
);

/**
 * @route   GET /api/cargos
 * @desc    Obtener todos los cargos del área
 * @access  Private (requiere ver cargos)
 */
router.get('/', 
  authMiddleware, 
  checkAnyPermission(['area_mgmt.cargos.view']),
  cargoController.getCargosByArea
);

/**
 * @route   GET /api/cargos/:id
 * @desc    Obtener un cargo específico
 * @access  Private (requiere ver cargos)
 */
router.get('/:id', 
  authMiddleware, 
  checkAnyPermission(['area_mgmt.cargos.view']),
  cargoController.getCargoById
);

/**
 * @route   PATCH /api/cargos/:id
 * @desc    Actualizar nombre personalizado del cargo
 * @access  Private (requiere editar cargos)
 */
router.patch('/:id', 
  authMiddleware, 
  checkAnyPermission(['area_mgmt.cargos.edit']),
  cargoController.updateCargoName
);

/**
 * @route   DELETE /api/cargos/:id
 * @desc    Eliminar cargo
 * @access  Private (requiere eliminar cargos)
 */
router.delete('/:id', 
  authMiddleware, 
  checkAnyPermission(['area_mgmt.cargos.delete']),
  cargoController.deleteCargo
);

module.exports = router;
