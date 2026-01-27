const { Op } = require('sequelize');
const AtencionEmergencia = require('../models/atencionEmergencia');
const DetalleDiagnosticos = require('../models/detalleDiagnosticos');
const CatCIE10 = require('../models/catCie10');

/**
 * Obtener diagnósticos de una atención
 */
exports.getDiagnosticos = async (req, res) => {
  try {
    const { atencionId } = req.params;

    const diagnosticos = await DetalleDiagnosticos.findAll({
      where: { atencionEmergenciaId: atencionId },
      include: [{
        model: CatCIE10,
        as: 'CIE10',
        attributes: ['codigo', 'descripcion']
      }],
      order: [['orden', 'ASC'], ['createdAt', 'ASC']]
    });

    res.status(200).json(diagnosticos);
  } catch (error) {
    console.error('Error al obtener diagnósticos:', error);
    res.status(500).json({ message: 'Error al obtener diagnósticos.', error: error.message });
  }
};

/**
 * Agregar un diagnóstico
 * Aplica la regla de la letra Z: si el código empieza con Z, tipo_diagnostico = 'NO APLICA'
 */
exports.agregarDiagnostico = async (req, res) => {
  try {
    const { atencionId } = req.params;
    const { codigoCIE10, descripcion, tipoDiagnostico } = req.body;

    // Verificar que la atención existe
    const atencion = await AtencionEmergencia.findByPk(atencionId);
    if (!atencion) {
      return res.status(404).json({ message: 'Atención no encontrada.' });
    }

    // Verificar que el código CIE-10 existe
    const cie10 = await CatCIE10.findOne({ where: { codigo: codigoCIE10 } });
    if (!cie10) {
      return res.status(404).json({ message: 'Código CIE-10 no encontrado.' });
    }

    // Aplicar regla de la letra Z
    let tipoDiagnosticoFinal = tipoDiagnostico;
    if (codigoCIE10.toUpperCase().startsWith('Z')) {
      tipoDiagnosticoFinal = 'NO APLICA';
    }

    // Obtener el siguiente orden
    const ultimoDiagnostico = await DetalleDiagnosticos.findOne({
      where: { atencionEmergenciaId: atencionId },
      order: [['orden', 'DESC']]
    });
    const siguienteOrden = ultimoDiagnostico ? ultimoDiagnostico.orden + 1 : 1;

    const diagnostico = await DetalleDiagnosticos.create({
      atencionEmergenciaId: atencionId,
      codigoCIE10,
      tipoDiagnostico: tipoDiagnosticoFinal,
      descripcion: descripcion || cie10.descripcion,
      orden: siguienteOrden
    });

    const diagnosticoCompleto = await DetalleDiagnosticos.findByPk(diagnostico.id, {
      include: [{
        model: CatCIE10,
        as: 'CIE10',
        attributes: ['codigo', 'descripcion']
      }]
    });

    res.status(201).json(diagnosticoCompleto);
  } catch (error) {
    console.error('Error al agregar diagnóstico:', error);
    res.status(500).json({ message: 'Error al agregar diagnóstico.', error: error.message });
  }
};

/**
 * Actualizar un diagnóstico
 */
exports.actualizarDiagnostico = async (req, res) => {
  try {
    const { diagnosticoId } = req.params;
    const { codigoCIE10, descripcion, tipoDiagnostico } = req.body;

    const diagnostico = await DetalleDiagnosticos.findByPk(diagnosticoId);
    if (!diagnostico) {
      return res.status(404).json({ message: 'Diagnóstico no encontrado.' });
    }

    // Si se cambia el código CIE-10, aplicar regla de la letra Z
    let tipoDiagnosticoFinal = tipoDiagnostico || diagnostico.tipoDiagnostico;
    const codigoFinal = codigoCIE10 || diagnostico.codigoCIE10;

    if (codigoFinal.toUpperCase().startsWith('Z')) {
      tipoDiagnosticoFinal = 'NO APLICA';
    }

    await diagnostico.update({
      codigoCIE10: codigoFinal,
      tipoDiagnostico: tipoDiagnosticoFinal,
      descripcion: descripcion || diagnostico.descripcion
    });

    const diagnosticoActualizado = await DetalleDiagnosticos.findByPk(diagnosticoId, {
      include: [{
        model: CatCIE10,
        as: 'CIE10',
        attributes: ['codigo', 'descripcion']
      }]
    });

    res.status(200).json(diagnosticoActualizado);
  } catch (error) {
    console.error('Error al actualizar diagnóstico:', error);
    res.status(500).json({ message: 'Error al actualizar diagnóstico.', error: error.message });
  }
};

/**
 * Eliminar un diagnóstico
 */
exports.eliminarDiagnostico = async (req, res) => {
  try {
    const { diagnosticoId } = req.params;

    const diagnostico = await DetalleDiagnosticos.findByPk(diagnosticoId);
    if (!diagnostico) {
      return res.status(404).json({ message: 'Diagnóstico no encontrado.' });
    }

    await diagnostico.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar diagnóstico:', error);
    res.status(500).json({ message: 'Error al eliminar diagnóstico.', error: error.message });
  }
};

/**
 * Validar si una atención puede ser firmada
 * Valida bloques obligatorios: Anamnesis y Diagnósticos CIE-10
 */
exports.validarFirma = async (req, res) => {
  try {
    const { atencionId } = req.params;

    // Usar el servicio de validación pre-firma
    const { validarPreFirmaFormulario008 } = require('../services/validacionPreFirmaService');
    const validacion = await validarPreFirmaFormulario008(atencionId);

    res.status(200).json({
      puedeFirmar: validacion.puedeFirmar,
      motivo: validacion.motivo,
      errores: validacion.errores,
      erroresCriticos: validacion.erroresCriticos,
      detalles: validacion.detalles,
      // Mantener compatibilidad con código anterior
      tieneDefinitivo: validacion.detalles.diagnosticos?.tieneDefinitivo || false,
      totalDiagnosticos: validacion.detalles.diagnosticos?.totalDiagnosticos || 0
    });
  } catch (error) {
    console.error('Error al validar firma:', error);
    res.status(500).json({ message: 'Error al validar firma.', error: error.message });
  }
};

module.exports = exports;
