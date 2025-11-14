const cargoService = require('../services/cargoService');

/**
 * Crear un nuevo cargo
 */
exports.createCargo = async (req, res) => {
  try {
    const { versionId, customName } = req.body;

    if (!versionId) {
      return res.status(400).json({
        success: false,
        message: 'El campo versionId es obligatorio'
      });
    }

    const cargo = await cargoService.createCargo(versionId, customName, req.user);

    res.status(201).json({
      success: true,
      message: 'Cargo conservado exitosamente',
      data: cargo
    });

  } catch (error) {
    console.error('Error en createCargo:', error);
    const statusCode = error.message === 'Versión no encontrada' ? 404 :
                       error.message.includes('acceso') ? 403 :
                       error.message.includes('Ya existe') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al crear cargo',
      error: error.message
    });
  }
};

/**
 * Obtener todos los cargos del área
 */
exports.getCargosByArea = async (req, res) => {
  try {
    const cargos = await cargoService.getCargosByArea(req.user);

    res.status(200).json({
      success: true,
      data: cargos
    });

  } catch (error) {
    console.error('Error en getCargosByArea:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener cargos',
      error: error.message
    });
  }
};

/**
 * Obtener un cargo por ID
 */
exports.getCargoById = async (req, res) => {
  try {
    const { id } = req.params;
    const cargo = await cargoService.getCargoById(id, req.user);

    res.status(200).json({
      success: true,
      data: cargo
    });

  } catch (error) {
    console.error('Error en getCargoById:', error);
    const statusCode = error.message === 'Cargo no encontrado' ? 404 :
                       error.message.includes('acceso') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al obtener cargo',
      error: error.message
    });
  }
};

/**
 * Actualizar nombre del cargo
 */
exports.updateCargoName = async (req, res) => {
  try {
    const { id } = req.params;
    const { customName } = req.body;

    const cargo = await cargoService.updateCargoName(id, customName, req.user);

    res.status(200).json({
      success: true,
      message: 'Nombre del cargo actualizado exitosamente',
      data: cargo
    });

  } catch (error) {
    console.error('Error en updateCargoName:', error);
    const statusCode = error.message === 'Cargo no encontrado' ? 404 :
                       error.message.includes('permiso') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al actualizar nombre del cargo',
      error: error.message
    });
  }
};

/**
 * Eliminar cargo
 */
exports.deleteCargo = async (req, res) => {
  try {
    const { id } = req.params;
    await cargoService.deleteCargo(id, req.user);

    res.status(200).json({
      success: true,
      message: 'Cargo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en deleteCargo:', error);
    const statusCode = error.message === 'Cargo no encontrado' ? 404 :
                       error.message.includes('permiso') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al eliminar cargo',
      error: error.message
    });
  }
};
