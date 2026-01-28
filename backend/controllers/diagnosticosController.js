const { Op } = require('sequelize');
const AtencionEmergencia = require('../models/atencionEmergencia');
const DetalleDiagnosticos = require('../models/detalleDiagnosticos');
const CatCIE10 = require('../models/catCie10');
const Pacientes = require('../models/pacientes');
const CatSexos = require('../models/cat_sexos');

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
 * Regla Z: código inicia con Z → ESTADISTICO (no ocupa slots 008).
 * Regla S-T: código inicia con S o T → requiereCausaExterna (segundo dx V00-Y84).
 */
exports.agregarDiagnostico = async (req, res) => {
  try {
    const { atencionId } = req.params;
    const { codigoCIE10, descripcion, tipoDiagnostico, esCausaExterna, padreId } = req.body;

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

    const codigo = (codigoCIE10 || '').trim().toUpperCase();
    // Regla Z: Administrativos/Certificados — condición NO APLICA, no ocupa slots L/M
    let tipoDiagnosticoFinal = tipoDiagnostico;
    if (codigo.startsWith('Z')) {
      tipoDiagnosticoFinal = 'NO APLICA';
    }
    // Regla S-T: trauma/causa externa — requiere segundo dx en V00-V99, W00-X59, X60-Y09, Y35-Y84
    const requiereCausaExterna = codigo.startsWith('S') || codigo.startsWith('T');

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
      orden: siguienteOrden,
      padreId: padreId ? parseInt(padreId, 10) : null,
      esCausaExterna: !!esCausaExterna,
      usuarioId: req.userId || null
    });

    const diagnosticoCompleto = await DetalleDiagnosticos.findByPk(diagnostico.id, {
      include: [{
        model: CatCIE10,
        as: 'CIE10',
        attributes: ['codigo', 'descripcion']
      }]
    });
    const payload = diagnosticoCompleto.toJSON ? diagnosticoCompleto.toJSON() : diagnosticoCompleto;
    res.status(201).json({ ...payload, requiereCausaExterna });
  } catch (error) {
    console.error('Error al agregar diagnóstico:', error);
    res.status(500).json({ message: 'Error al agregar diagnóstico.', error: error.message });
  }
};

/**
 * Actualizar un diagnóstico
 * Regla Z → ESTADISTICO; acepta esCausaExterna para códigos V-W-X-Y.
 */
exports.actualizarDiagnostico = async (req, res) => {
  try {
    const { diagnosticoId } = req.params;
    const { codigoCIE10, descripcion, tipoDiagnostico, esCausaExterna, padreId } = req.body;

    const diagnostico = await DetalleDiagnosticos.findByPk(diagnosticoId);
    if (!diagnostico) {
      return res.status(404).json({ message: 'Diagnóstico no encontrado.' });
    }

    const codigoFinal = (codigoCIE10 || diagnostico.codigoCIE10 || '').trim().toUpperCase();
    let tipoDiagnosticoFinal = tipoDiagnostico || diagnostico.tipoDiagnostico;
    if (codigoFinal.startsWith('Z')) {
      tipoDiagnosticoFinal = 'NO APLICA';
    }

    await diagnostico.update({
      codigoCIE10: codigoFinal || diagnostico.codigoCIE10,
      tipoDiagnostico: tipoDiagnosticoFinal,
      descripcion: descripcion !== undefined ? descripcion : diagnostico.descripcion,
      padreId: padreId !== undefined ? (padreId ? parseInt(padreId, 10) : null) : diagnostico.padreId,
      esCausaExterna: esCausaExterna !== undefined ? !!esCausaExterna : diagnostico.esCausaExterna
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
 * Requisitos: (1) al menos un diagnóstico DEFINITIVO (excepto códigos Z);
 * (2) al menos un antecedente con contenido o "No aplica" marcado.
 */
exports.validarFirma = async (req, res) => {
  try {
    const { atencionId } = req.params;

    const diagnosticos = await DetalleDiagnosticos.findAll({
      where: { atencionEmergenciaId: atencionId }
    });

    // Código en rango causa externa (V00-V99, W00-X59, X60-Y09, Y35-Y84)
    const esCausaExternaRango = (cod) => /^[VWXY]\d{2}/.test(String(cod || '').trim().toUpperCase());
    const hayCodigoST = diagnosticos.some(d => {
      const c = String(d.codigoCIE10 || '').trim().toUpperCase();
      return c.startsWith('S') || c.startsWith('T');
    });
    const tieneCausaExterna = diagnosticos.some(d => esCausaExternaRango(d.codigoCIE10));
    const causaExternaOk = !hayCodigoST || tieneCausaExterna;
    const motivoCausaExterna = !causaExternaOk
      ? 'Existe código S o T (trauma). Debe agregar al menos un diagnóstico de causa externa (V00-V99, W00-X59, X60-Y09, Y35-Y84).'
      : null;

    // Verificar si hay al menos un diagnóstico DEFINITIVO (excepto códigos Z)
    const tieneDefinitivo = diagnosticos.some(d => {
      const esZ = (d.codigoCIE10 || '').toUpperCase().startsWith('Z');
      return d.tipoDiagnostico === 'DEFINITIVO' && !esZ;
    });

    // Claves de la Sección H (Examen Físico Regional) — Form 008
    const EXAMEN_FISICO_REGIONAL_KEYS = ['estado_general', 'piel_faneras', 'cabeza', 'ojos', 'oidos', 'nariz', 'boca', 'orofaringe', 'cuello', 'axilas_mamas', 'torax', 'abdomen', 'columna_vertebral', 'miembros_superiores', 'miembros_inferiores'];

    // Verificar antecedentes, Sección D (violencia + observaciones), exámenes H/I y Sección J (Obstetricia / MEF)
    const atencion = await AtencionEmergencia.findByPk(atencionId, {
      attributes: ['antecedentesPatologicos', 'tipoAccidenteViolenciaIntoxicacion', 'observacionesAccidente', 'examenFisico', 'examenFisicoTraumaCritico', 'embarazoParto'],
      include: [{
        model: Pacientes,
        as: 'Paciente',
        attributes: ['fecha_nacimiento'],
        required: false,
        include: [{ model: CatSexos, as: 'Sexo', attributes: ['nombre'], required: false }]
      }]
    });
    let antecedentesOk = true;
    let motivoAntecedentes = null;
    if (atencion && atencion.antecedentesPatologicos) {
      const ap = typeof atencion.antecedentesPatologicos === 'string'
        ? JSON.parse(atencion.antecedentesPatologicos)
        : atencion.antecedentesPatologicos;
      const keys = ['alergicos', 'clinicos', 'ginecologicos', 'traumaticos', 'pediatricos', 'quirurgicos', 'farmacologicos', 'habitos', 'familiares', 'otros'];
      const algunValor = keys.some(k => (ap[k] || '').toString().trim() !== '');
      const noAplicaGeneral = !!ap.noAplicaGeneral;
      const algunNoAplica = keys.some(k => !!(ap.noAplica && ap.noAplica[k]));
      if (!algunValor && !noAplicaGeneral && !algunNoAplica) {
        antecedentesOk = false;
        motivoAntecedentes = 'Debe indicar al menos un antecedente o marcar "No aplica" en la Sección E.';
      }
    }

    // Previsión 094: si hay violencia, Observaciones Sección D obligatorias (mín. 100 caracteres)
    let violenciaOk = true;
    let motivoViolencia = null;
    if (atencion && atencion.tipoAccidenteViolenciaIntoxicacion) {
      let tipoD;
      try {
        tipoD = typeof atencion.tipoAccidenteViolenciaIntoxicacion === 'string'
          ? JSON.parse(atencion.tipoAccidenteViolenciaIntoxicacion)
          : atencion.tipoAccidenteViolenciaIntoxicacion;
      } catch {
        tipoD = { seleccion: [] };
      }
      const sel = Array.isArray(tipoD?.seleccion) ? tipoD.seleccion : [];
      const hayViolencia = sel.some(v => {
        const s = String(v || '').toUpperCase();
        return s.startsWith('VIOLENCIA_') || s.includes('VIOLENCIA');
      });
      if (hayViolencia) {
        const obs = (atencion.observacionesAccidente || '').trim();
        if (obs.length < 100) {
          violenciaOk = false;
          motivoViolencia = 'Por tratarse de violencia, las Observaciones de la Sección D (Accidente, Violencia, Intoxicación) deben tener al menos 100 caracteres para cumplir el relato pericial (Previsión 094).';
        }
      }
    }

    // Secciones H e I: al menos una con contenido (no ambos vacíos)
    let examenFisicoOk = true;
    let motivoExamenFisico = null;
    if (atencion) {
      let ef = {};
      try {
        ef = typeof atencion.examenFisico === 'string' ? JSON.parse(atencion.examenFisico || '{}') : (atencion.examenFisico || {});
      } catch {
        ef = {};
      }
      const hConContenido = EXAMEN_FISICO_REGIONAL_KEYS.some(k => {
        const desc = (ef[k] || '').toString().trim();
        const noNormal = ef[`${k}_normal`] === false;
        return desc !== '' || noNormal;
      });
      const iConContenido = ((atencion.examenFisicoTraumaCritico || '').toString().trim()).length > 0;
      if (!hConContenido && !iConContenido) {
        examenFisicoOk = false;
        motivoExamenFisico = 'Debe completar al menos el Examen Físico Regional (H) o el Examen de Trauma/Crítico (I).';
      }
    }

    // Sección J (Obstetricia): si es mujer en edad fértil (10–49 años), debe tener estado de gestación definido
    let obstetriciaOk = true;
    let motivoObstetricia = null;
    if (atencion && atencion.Paciente) {
      const sexo = (atencion.Paciente.Sexo ? atencion.Paciente.Sexo.nombre : null) || '';
      const fn = atencion.Paciente.fecha_nacimiento;
      let edadAnios = null;
      if (fn) {
        const n = new Date(fn);
        const h = new Date();
        edadAnios = h.getFullYear() - n.getFullYear();
        const m = h.getMonth() - n.getMonth();
        if (m < 0 || (m === 0 && h.getDate() < n.getDate())) edadAnios--;
      }
      const esMasculino = /^(masculino|hombre)$/i.test(String(sexo).trim());
      const esMEF = !esMasculino && edadAnios != null && edadAnios >= 10 && edadAnios <= 49;
      let estadoGestacion = '';
      if (atencion.embarazoParto) {
        try {
          const ep = typeof atencion.embarazoParto === 'string' ? JSON.parse(atencion.embarazoParto) : atencion.embarazoParto;
          estadoGestacion = (ep.estadoGestacion ?? '').toString().trim();
        } catch (_) {}
      }
      if (esMEF && !estadoGestacion) {
        obstetriciaOk = false;
        motivoObstetricia = 'Paciente en edad fértil: Por favor confirme si existe embarazo o sospecha para completar la Sección J.';
      }
    }

    const puedeFirmar = (tieneDefinitivo || diagnosticos.length === 0) && antecedentesOk && violenciaOk && examenFisicoOk && obstetriciaOk && causaExternaOk;
    let motivo = null;
    if (!violenciaOk) motivo = motivoViolencia;
    else if (!antecedentesOk) motivo = motivoAntecedentes;
    else if (!examenFisicoOk) motivo = motivoExamenFisico;
    else if (!obstetriciaOk) motivo = motivoObstetricia;
    else if (!causaExternaOk) motivo = motivoCausaExterna;
    else if (!tieneDefinitivo && diagnosticos.length > 0) motivo = 'Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z).';

    res.status(200).json({
      puedeFirmar,
      motivo,
      tieneDefinitivo,
      totalDiagnosticos: diagnosticos.length,
      antecedentesOk,
      violenciaOk,
      examenFisicoOk,
      obstetriciaOk,
      causaExternaOk,
      ...(motivoViolencia && { motivoViolencia }),
      ...(motivoExamenFisico && { motivoExamenFisico }),
      ...(motivoObstetricia && { motivoObstetricia }),
      ...(motivoCausaExterna && { motivoCausaExterna })
    });
  } catch (error) {
    console.error('Error al validar firma:', error);
    res.status(500).json({ message: 'Error al validar firma.', error: error.message });
  }
};

module.exports = exports;
