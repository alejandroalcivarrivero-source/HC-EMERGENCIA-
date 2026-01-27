const OrdenExamen = require('../models/ordenExamen');
const Admision = require('../models/admisiones');
const Usuario = require('../models/usuario');
const bcrypt = require('bcryptjs'); // Para verificar la firma electrónica (contraseña)

exports.createOrdenExamen = async (req, res) => {
  const { admisionId, tipoExamen, observaciones, firmaElectronica } = req.body;
  const usuarioId = req.userId; // El ID del usuario se adjunta a req.userId en el middleware validarToken

  try {
    // Verificar si la admisión existe
    const admision = await Admision.findByPk(admisionId);
    if (!admision) {
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }

    // Verificar la firma electrónica
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(firmaElectronica, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Firma electrónica inválida.' });
    }

    const ordenExamen = await OrdenExamen.create({
      admisionId,
      usuarioId,
      tipoExamen,
      observaciones,
      firmaElectronica: 'VALIDADA' // O un hash de la firma real si se implementa un sistema más robusto
    });

    res.status(201).json(ordenExamen);
  } catch (error) {
    console.error('Error al crear la orden de examen:', error);
    res.status(500).json({ message: 'Error al crear la orden de examen.', error: error.message });
  }
};

exports.getOrdenesExamenByAdmision = async (req, res) => {
  const { admisionId } = req.params;

  try {
    const ordenesExamen = await OrdenExamen.findAll({
      where: { admisionId },
      include: [
        { model: Admision, as: 'Admision', attributes: ['id', 'fecha_hora_admision'] },
        { model: Usuario, as: 'Usuario', attributes: ['nombre_completo', 'rolId'] }
      ],
      order: [['fechaEmision', 'DESC']]
    });

    res.status(200).json(ordenesExamen);
  } catch (error) {
    console.error('Error al obtener las órdenes de examen:', error);
    res.status(500).json({ message: 'Error al obtener las órdenes de examen.', error: error.message });
  }
};

exports.updateOrdenExamen = async (req, res) => {
  const { id } = req.params;
  const { tipoExamen, observaciones, firmaElectronica } = req.body;
  const usuarioId = req.userId;

  try {
    const ordenExamen = await OrdenExamen.findByPk(id);
    if (!ordenExamen) {
      return res.status(404).json({ message: 'Orden de examen no encontrada.' });
    }

    // Verificar la firma electrónica para la actualización
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(firmaElectronica, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Firma electrónica inválida.' });
    }

    ordenExamen.tipoExamen = tipoExamen !== undefined ? tipoExamen : ordenExamen.tipoExamen;
    ordenExamen.observaciones = observaciones !== undefined ? observaciones : ordenExamen.observaciones;
    ordenExamen.firmaElectronica = 'VALIDADA'; // Actualizar la firma al validar

    await ordenExamen.save();
    res.status(200).json(ordenExamen);
  } catch (error) {
    console.error('Error al actualizar la orden de examen:', error);
    res.status(500).json({ message: 'Error al actualizar la orden de examen.', error: error.message });
  }
};

exports.deleteOrdenExamen = async (req, res) => {
  const { id } = req.params;
  const { firmaElectronica } = req.body; // Se requiere firma para eliminar
  const usuarioId = req.userId;

  try {
    const ordenExamen = await OrdenExamen.findByPk(id);
    if (!ordenExamen) {
      return res.status(404).json({ message: 'Orden de examen no encontrada.' });
    }

    // Verificar la firma electrónica para la eliminación
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(firmaElectronica, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Firma electrónica inválida.' });
    }

    await ordenExamen.destroy();
    res.status(204).json({ message: 'Orden de examen eliminada exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar la orden de examen:', error);
    res.status(500).json({ message: 'Error al eliminar la orden de examen.', error: error.message });
  }
};