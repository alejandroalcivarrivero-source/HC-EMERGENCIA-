const OrdenImagen = require('../models/ordenImagen');
const Admision = require('../models/admisiones');
const Usuario = require('../models/usuario');
const bcrypt = require('bcryptjs'); // Para verificar la firma electrónica (contraseña)

exports.createOrdenImagen = async (req, res) => {
  const { admisionId, tipoImagen, observaciones, firmaElectronica } = req.body;
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

    const ordenImagen = await OrdenImagen.create({
      admisionId,
      usuarioId,
      tipoImagen,
      observaciones,
      firmaElectronica: 'VALIDADA' // O un hash de la firma real si se implementa un sistema más robusto
    });

    res.status(201).json(ordenImagen);
  } catch (error) {
    console.error('Error al crear la orden de imagen:', error);
    res.status(500).json({ message: 'Error al crear la orden de imagen.', error: error.message });
  }
};

exports.getOrdenesImagenByAdmision = async (req, res) => {
  const { admisionId } = req.params;

  try {
    const ordenesImagen = await OrdenImagen.findAll({
      where: { admisionId },
      include: [
        { model: Admision, as: 'Admision', attributes: ['id', 'fecha_hora_admision'] },
        { model: Usuario, as: 'Usuario', attributes: ['nombre_completo', 'rolId'] }
      ],
      order: [['fechaEmision', 'DESC']]
    });

    res.status(200).json(ordenesImagen);
  } catch (error) {
    console.error('Error al obtener las órdenes de imagen:', error);
    res.status(500).json({ message: 'Error al obtener las órdenes de imagen.', error: error.message });
  }
};

exports.updateOrdenImagen = async (req, res) => {
  const { id } = req.params;
  const { tipoImagen, observaciones, firmaElectronica } = req.body;
  const usuarioId = req.userId;

  try {
    const ordenImagen = await OrdenImagen.findByPk(id);
    if (!ordenImagen) {
      return res.status(404).json({ message: 'Orden de imagen no encontrada.' });
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

    ordenImagen.tipoImagen = tipoImagen !== undefined ? tipoImagen : ordenImagen.tipoImagen;
    ordenImagen.observaciones = observaciones !== undefined ? observaciones : ordenImagen.observaciones;
    ordenImagen.firmaElectronica = 'VALIDADA'; // Actualizar la firma al validar

    await ordenImagen.save();
    res.status(200).json(ordenImagen);
  } catch (error) {
    console.error('Error al actualizar la orden de imagen:', error);
    res.status(500).json({ message: 'Error al actualizar la orden de imagen.', error: error.message });
  }
};

exports.deleteOrdenImagen = async (req, res) => {
  const { id } = req.params;
  const { firmaElectronica } = req.body; // Se requiere firma para eliminar
  const usuarioId = req.userId;

  try {
    const ordenImagen = await OrdenImagen.findByPk(id);
    if (!ordenImagen) {
      return res.status(404).json({ message: 'Orden de imagen no encontrada.' });
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

    await ordenImagen.destroy();
    res.status(204).json({ message: 'Orden de imagen eliminada exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar la orden de imagen:', error);
    res.status(500).json({ message: 'Error al eliminar la orden de imagen.', error: error.message });
  }
};