const Medicamento = require('../models/medicamento');

// Crear un nuevo medicamento
exports.crearMedicamento = async (req, res) => {
  try {
    const nuevoMedicamento = await Medicamento.create(req.body);
    res.status(201).json(nuevoMedicamento);
  } catch (error) {
    console.error('Error al crear medicamento:', error);
    res.status(500).json({ message: 'Error interno del servidor al crear medicamento.', error: error.message });
  }
};

// Obtener todos los medicamentos
exports.obtenerMedicamentos = async (req, res) => {
  try {
    const medicamentos = await Medicamento.findAll();
    res.status(200).json(medicamentos);
  } catch (error) {
    console.error('Error al obtener medicamentos:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener medicamentos.', error: error.message });
  }
};

// Obtener un medicamento por ID
exports.obtenerMedicamentoPorId = async (req, res) => {
  try {
    const medicamento = await Medicamento.findByPk(req.params.id);
    if (!medicamento) {
      return res.status(404).json({ message: 'Medicamento no encontrado.' });
    }
    res.status(200).json(medicamento);
  } catch (error) {
    console.error('Error al obtener medicamento por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener medicamento.', error: error.message });
  }
};

// Actualizar un medicamento por ID
exports.actualizarMedicamento = async (req, res) => {
  try {
    const [updated] = await Medicamento.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const medicamentoActualizado = await Medicamento.findByPk(req.params.id);
      res.status(200).json(medicamentoActualizado);
    } else {
      res.status(404).json({ message: 'Medicamento no encontrado para actualizar.' });
    }
  } catch (error) {
    console.error('Error al actualizar medicamento:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar medicamento.', error: error.message });
  }
};

// Eliminar un medicamento por ID
exports.eliminarMedicamento = async (req, res) => {
  try {
    const deleted = await Medicamento.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      res.status(204).json({ message: 'Medicamento eliminado con éxito.' }); // 204 No Content
    } else {
      res.status(404).json({ message: 'Medicamento no encontrado para eliminar.' });
    }
  } catch (error) {
    console.error('Error al eliminar medicamento:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar medicamento.', error: error.message });
  }
};