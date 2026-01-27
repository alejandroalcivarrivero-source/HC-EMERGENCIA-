/**
 * Servicio de Validación Pre-Firma para Formulario 008
 * Valida que los bloques obligatorios estén completos según normas MSP
 */

const AtencionEmergencia = require('../models/atencionEmergencia');
const DetalleDiagnosticos = require('../models/detalleDiagnosticos');

/**
 * Valida el bloque de Anamnesis (Enfermedad o Problema Actual)
 * @param {object} atencion - Objeto de atención de emergencia
 * @returns {object} { valido: boolean, errores: Array }
 */
function validarAnamnesis(atencion) {
  const errores = [];

  // Validar que existe el campo
  if (!atencion.enfermedadProblemaActual) {
    errores.push({
      bloque: 'anamnesis',
      campo: 'enfermedadProblemaActual',
      mensaje: 'La anamnesis (enfermedad o problema actual) es obligatoria'
    });
    return { valido: false, errores };
  }

  // Validar longitud mínima (según norma MSP: mínimo 10 caracteres, pero el código actual usa 20)
  const anamnesis = atencion.enfermedadProblemaActual.trim();
  if (anamnesis.length < 10) {
    errores.push({
      bloque: 'anamnesis',
      campo: 'enfermedadProblemaActual',
      mensaje: 'La anamnesis debe tener al menos 10 caracteres'
    });
  } else if (anamnesis.length < 20) {
    // Advertencia si está entre 10 y 20 caracteres (el código frontend requiere 20)
    errores.push({
      bloque: 'anamnesis',
      campo: 'enfermedadProblemaActual',
      mensaje: 'Se recomienda que la anamnesis tenga al menos 20 caracteres para mayor detalle',
      tipo: 'advertencia'
    });
  }

  return {
    valido: errores.filter(e => e.tipo !== 'advertencia').length === 0,
    errores
  };
}

/**
 * Valida los diagnósticos CIE-10
 * @param {number} atencionId - ID de la atención
 * @returns {Promise<object>} { valido: boolean, errores: Array }
 */
async function validarDiagnosticos(atencionId) {
  const errores = [];

  const diagnosticos = await DetalleDiagnosticos.findAll({
    where: { atencionEmergenciaId: atencionId }
  });

  // Validar que exista al menos un diagnóstico
  if (diagnosticos.length === 0) {
    errores.push({
      bloque: 'diagnosticos',
      campo: 'diagnosticos',
      mensaje: 'Debe existir al menos un diagnóstico CIE-10'
    });
    return { valido: false, errores };
  }

  // Validar que exista al menos un diagnóstico DEFINITIVO (excepto códigos Z)
  const tieneDefinitivo = diagnosticos.some(d => {
    const esCodigoZ = d.codigoCIE10.toUpperCase().startsWith('Z');
    return d.tipoDiagnostico === 'DEFINITIVO' && !esCodigoZ;
  });

  if (!tieneDefinitivo) {
    errores.push({
      bloque: 'diagnosticos',
      campo: 'diagnosticos',
      mensaje: 'Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z)'
    });
  }

  // Validar que todos los diagnósticos tengan código válido
  const diagnosticosInvalidos = diagnosticos.filter(d => !d.codigoCIE10 || d.codigoCIE10.trim() === '');
  if (diagnosticosInvalidos.length > 0) {
    errores.push({
      bloque: 'diagnosticos',
      campo: 'codigoCIE10',
      mensaje: `Hay ${diagnosticosInvalidos.length} diagnóstico(s) sin código CIE-10 válido`
    });
  }

  return {
    valido: errores.length === 0,
    errores,
    totalDiagnosticos: diagnosticos.length,
    tieneDefinitivo
  };
}

/**
 * Valida el Plan de Tratamiento
 * @param {object} atencion - Objeto de atención de emergencia
 * @returns {object} { valido: boolean, errores: Array }
 */
function validarPlanTratamiento(atencion) {
  const errores = [];

  // Verificar que existe planTratamiento
  if (!atencion.planTratamiento) {
    errores.push({
      bloque: 'planTratamiento',
      campo: 'planTratamiento',
      mensaje: 'El plan de tratamiento es obligatorio'
    });
    return { valido: false, errores };
  }

  // Parsear el JSON si es string
  let planTratamiento;
  try {
    planTratamiento = typeof atencion.planTratamiento === 'string' 
      ? JSON.parse(atencion.planTratamiento) 
      : atencion.planTratamiento;
  } catch (error) {
    errores.push({
      bloque: 'planTratamiento',
      campo: 'planTratamiento',
      mensaje: 'El plan de tratamiento tiene un formato inválido'
    });
    return { valido: false, errores };
  }

  // Validar que sea un array
  if (!Array.isArray(planTratamiento)) {
    errores.push({
      bloque: 'planTratamiento',
      campo: 'planTratamiento',
      mensaje: 'El plan de tratamiento debe ser una lista de prescripciones'
    });
    return { valido: false, errores };
  }

  // Validar que tenga al menos una prescripción
  if (planTratamiento.length === 0) {
    errores.push({
      bloque: 'planTratamiento',
      campo: 'planTratamiento',
      mensaje: 'Debe existir al menos una prescripción en el plan de tratamiento'
    });
    return { valido: false, errores };
  }

  // Validar que cada prescripción tenga los campos mínimos según su tipo
  planTratamiento.forEach((prescripcion, index) => {
    if (prescripcion.tipo === 'medicamento') {
      // Validar campos obligatorios para medicamento
      if (!prescripcion.concentracion || !prescripcion.formaFarmaceutica || 
          !prescripcion.dosis || !prescripcion.frecuencia || 
          !prescripcion.viaAdministracion || !prescripcion.duracion) {
        errores.push({
          bloque: 'planTratamiento',
          campo: `prescripcion_${index}`,
          mensaje: `La prescripción ${index + 1} (medicamento) está incompleta. Faltan campos obligatorios.`
        });
      }
    } else if (prescripcion.tipo === 'procedimiento_lab' || prescripcion.tipo === 'procedimiento_imagen') {
      // Validar campos obligatorios para procedimiento
      if (!prescripcion.tipoProcedimiento && !prescripcion.nombreProcedimiento) {
        errores.push({
          bloque: 'planTratamiento',
          campo: `prescripcion_${index}`,
          mensaje: `La prescripción ${index + 1} (procedimiento) debe tener un tipo o nombre de procedimiento.`
        });
      }
    }
  });

  return {
    valido: errores.length === 0,
    errores,
    totalPrescripciones: planTratamiento.length
  };
}

/**
 * Valida todos los bloques obligatorios para la firma del Formulario 008
 * @param {number} atencionId - ID de la atención
 * @returns {Promise<object>} { puedeFirmar: boolean, errores: Array, detalles: object }
 */
async function validarPreFirmaFormulario008(atencionId) {
  try {
    // Obtener la atención completa
    const atencion = await AtencionEmergencia.findByPk(atencionId);
    
    if (!atencion) {
      return {
        puedeFirmar: false,
        errores: [{
          bloque: 'general',
          mensaje: 'Atención no encontrada'
        }],
        detalles: {}
      };
    }

    // Verificar que no esté ya firmada
    if (atencion.estadoFirma === 'FIRMADO') {
      return {
        puedeFirmar: false,
        errores: [{
          bloque: 'general',
          mensaje: 'Esta atención ya ha sido firmada'
        }],
        detalles: {}
      };
    }

    const errores = [];
    const detalles = {};

    // 1. Validar Anamnesis
    const validacionAnamnesis = validarAnamnesis(atencion);
    if (!validacionAnamnesis.valido) {
      errores.push(...validacionAnamnesis.errores);
    }
    detalles.anamnesis = {
      valido: validacionAnamnesis.valido,
      tieneContenido: !!atencion.enfermedadProblemaActual,
      longitud: atencion.enfermedadProblemaActual ? atencion.enfermedadProblemaActual.trim().length : 0
    };

    // 2. Validar Diagnósticos
    const validacionDiagnosticos = await validarDiagnosticos(atencionId);
    if (!validacionDiagnosticos.valido) {
      errores.push(...validacionDiagnosticos.errores);
    }
    detalles.diagnosticos = {
      valido: validacionDiagnosticos.valido,
      totalDiagnosticos: validacionDiagnosticos.totalDiagnosticos,
      tieneDefinitivo: validacionDiagnosticos.tieneDefinitivo
    };

    // 3. Validar Plan de Tratamiento
    const validacionPlanTratamiento = validarPlanTratamiento(atencion);
    if (!validacionPlanTratamiento.valido) {
      errores.push(...validacionPlanTratamiento.errores);
    }
    detalles.planTratamiento = {
      valido: validacionPlanTratamiento.valido,
      totalPrescripciones: validacionPlanTratamiento.totalPrescripciones || 0,
      tienePrescripciones: (validacionPlanTratamiento.totalPrescripciones || 0) > 0
    };

    // Determinar si puede firmar (solo errores críticos, no advertencias)
    const erroresCriticos = errores.filter(e => e.tipo !== 'advertencia');
    const puedeFirmar = erroresCriticos.length === 0;

    return {
      puedeFirmar,
      errores,
      erroresCriticos,
      detalles,
      motivo: puedeFirmar 
        ? null 
        : erroresCriticos.map(e => e.mensaje).join('; ')
    };
  } catch (error) {
    console.error('Error en validación pre-firma:', error);
    return {
      puedeFirmar: false,
      errores: [{
        bloque: 'general',
        mensaje: 'Error al validar la atención: ' + error.message
      }],
      detalles: {}
    };
  }
}

module.exports = {
  validarPreFirmaFormulario008,
  validarAnamnesis,
  validarDiagnosticos,
  validarPlanTratamiento
};
