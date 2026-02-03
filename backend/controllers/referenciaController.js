const Referencia = require('../models/referencia');
const Admision = require('../models/admisiones');
const Usuario = require('../models/usuario');
const bcrypt = require('bcryptjs');

exports.createReferencia = async (req, res) => {
  const { 
    admisionId, 
    establecimientoDestino, 
    servicioDestino, 
    motivoReferencia, 
    resumenCuadroClinico, 
    hallazgosRelevantes, 
    diagnosticoCIE10, 
    planTratamiento, 
    firmaElectronica 
  } = req.body;
  const usuarioId = req.userId;

  try {
    const admision = await Admision.findByPk(admisionId);
    if (!admision) {
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }

    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(firmaElectronica, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Firma electrónica inválida.' });
    }

    // Generar correlativo: REF-[admisionId]-[count+1]
    const count = await Referencia.count({ where: { admisionId } });
    const correlativo = `REF-${admisionId}-${count + 1}`;

    const referencia = await Referencia.create({
      admisionId,
      usuarioId,
      correlativo,
      establecimientoDestino,
      servicioDestino,
      motivoReferencia,
      resumenCuadroClinico,
      hallazgosRelevantes,
      diagnosticoCIE10,
      planTratamiento,
      firmaElectronica: 'VALIDADA'
    });

    res.status(201).json(referencia);
  } catch (error) {
    console.error('Error al crear la referencia:', error);
    res.status(500).json({ message: 'Error al crear la referencia.', error: error.message });
  }
};

exports.getReferenciasByAdmision = async (req, res) => {
  const { admisionId } = req.params;

  try {
    const referencias = await Referencia.findAll({
      where: { admisionId },
      include: [
        { model: Admision, as: 'AdmisionReferencia', attributes: ['id', 'fecha_hora_admision'] },
        { model: Usuario, as: 'Usuario', attributes: ['nombre_completo', 'rolId'] }
      ],
      order: [['fechaEmision', 'DESC']]
    });

    res.status(200).json(referencias);
  } catch (error) {
    console.error('Error al obtener las referencias:', error);
    res.status(500).json({ message: 'Error al obtener las referencias.', error: error.message });
  }
};

exports.updateReferencia = async (req, res) => {
  const { id } = req.params;
  const { 
    establecimientoDestino, 
    servicioDestino, 
    motivoReferencia, 
    resumenCuadroClinico, 
    hallazgosRelevantes, 
    diagnosticoCIE10, 
    planTratamiento, 
    firmaElectronica 
  } = req.body;
  const usuarioId = req.userId;

  try {
    const referencia = await Referencia.findByPk(id);
    if (!referencia) {
      return res.status(404).json({ message: 'Referencia no encontrada.' });
    }

    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(firmaElectronica, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Firma electrónica inválida.' });
    }

    referencia.establecimientoDestino = establecimientoDestino || referencia.establecimientoDestino;
    referencia.servicioDestino = servicioDestino || referencia.servicioDestino;
    referencia.motivoReferencia = motivoReferencia || referencia.motivoReferencia;
    referencia.resumenCuadroClinico = resumenCuadroClinico || referencia.resumenCuadroClinico;
    referencia.hallazgosRelevantes = hallazgosRelevantes || referencia.hallazgosRelevantes;
    referencia.diagnosticoCIE10 = diagnosticoCIE10 || referencia.diagnosticoCIE10;
    referencia.planTratamiento = planTratamiento || referencia.planTratamiento;
    referencia.firmaElectronica = 'VALIDADA';

    await referencia.save();
    res.status(200).json(referencia);
  } catch (error) {
    console.error('Error al actualizar la referencia:', error);
    res.status(500).json({ message: 'Error al actualizar la referencia.', error: error.message });
  }
};

exports.deleteReferencia = async (req, res) => {
  const { id } = req.params;
  const { firmaElectronica } = req.body;
  const usuarioId = req.userId;

  try {
    const referencia = await Referencia.findByPk(id);
    if (!referencia) {
      return res.status(404).json({ message: 'Referencia no encontrada.' });
    }

    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(firmaElectronica, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Firma electrónica inválida.' });
    }

    await referencia.destroy();
    res.status(204).json({ message: 'Referencia eliminada exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar la referencia:', error);
    res.status(500).json({ message: 'Error al eliminar la referencia.', error: error.message });
  }
};
