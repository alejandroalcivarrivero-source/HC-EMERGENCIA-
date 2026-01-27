/**
 * Reglas de Validación para el Formulario 008 - Emergencia
 * Basadas en la Norma Técnica del MSP Ecuador
 */

export const formulario008Rules = {
  // Bloque C: Inicio de Atención
  inicioAtencion: {
    fechaAtencion: {
      required: true,
      type: 'string',
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      message: 'La fecha de atención es obligatoria y debe estar en formato YYYY-MM-DD'
    },
    horaAtencion: {
      required: true,
      type: 'string',
      pattern: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
      message: 'La hora de atención es obligatoria y debe estar en formato HH:mm'
    },
    condicionLlegada: {
      required: true,
      enum: ['ESTABLE', 'INESTABLE', 'FALLECIDO'],
      message: 'La condición de llegada es obligatoria'
    },
    motivoAtencion: {
      required: false, // Se pre-llena desde ADMISIONES, pero puede ser editado
      type: 'string',
      maxLength: 1000,
      message: 'El motivo de atención no puede exceder 1000 caracteres'
    }
  },

  // Bloque F: Anamnesis (Enfermedad o Problema Actual)
  anamnesis: {
    enfermedadProblemaActual: {
      required: true,
      type: 'string',
      minLength: 10,
      message: 'La anamnesis (enfermedad o problema actual) es obligatoria y debe tener al menos 10 caracteres'
    }
  },

  // Bloque E: Antecedentes Patológicos
  antecedentes: {
    // Los antecedentes son opcionales, pero si se completa alguno, debe tener contenido válido
    antecedentesPatologicos: {
      required: false,
      type: 'object',
      validator: (valor) => {
        if (!valor || typeof valor !== 'object') {
          return true; // Es opcional
        }
        // Si se completa algún campo, debe tener al menos 3 caracteres
        const campos = Object.values(valor);
        for (const campo of campos) {
          if (campo && typeof campo === 'string' && campo.trim().length > 0 && campo.trim().length < 3) {
            return 'Cada antecedente debe tener al menos 3 caracteres si se completa';
          }
        }
        return true;
      }
    }
  },

  // Bloque H: Examen Físico
  examenFisico: {
    examenFisico: {
      required: true,
      type: 'object',
      message: 'El examen físico es obligatorio'
    },
    // Validación condicional para Glasgow
    glasgow_ocular: {
      required: false,
      type: 'number',
      conditional: (datos) => {
        // Si condiciónLlegada es INESTABLE, Glasgow es obligatorio
        if (datos.condicionLlegada === 'INESTABLE') {
          return {
            required: true,
            message: 'El Glasgow es obligatorio para pacientes inestables'
          };
        }
        return { required: false };
      },
      validator: (valor, datos) => {
        if (datos.condicionLlegada === 'INESTABLE' && (!valor || valor < 1 || valor > 4)) {
          return 'El Glasgow ocular debe estar entre 1 y 4';
        }
        return true;
      }
    },
    glasgow_verbal: {
      required: false,
      type: 'number',
      conditional: (datos) => {
        if (datos.condicionLlegada === 'INESTABLE') {
          return {
            required: true,
            message: 'El Glasgow verbal es obligatorio para pacientes inestables'
          };
        }
        return { required: false };
      },
      validator: (valor, datos) => {
        if (datos.condicionLlegada === 'INESTABLE' && (!valor || valor < 1 || valor > 5)) {
          return 'El Glasgow verbal debe estar entre 1 y 5';
        }
        return true;
      }
    },
    glasgow_motora: {
      required: false,
      type: 'number',
      conditional: (datos) => {
        if (datos.condicionLlegada === 'INESTABLE') {
          return {
            required: true,
            message: 'El Glasgow motora es obligatorio para pacientes inestables'
          };
        }
        return { required: false };
      },
      validator: (valor, datos) => {
        if (datos.condicionLlegada === 'INESTABLE' && (!valor || valor < 1 || valor > 6)) {
          return 'El Glasgow motora debe estar entre 1 y 6';
        }
        return true;
      }
    }
  },

  // Bloque I: Examen Traumatológico (Opcional, pero si hay evento traumático, es recomendado)
  examenTrauma: {
    examenFisicoTraumaCritico: {
      required: false,
      type: 'string',
      conditional: (datos) => {
        // Si hay evento traumático, es recomendado completar
        if (datos.tipoAccidenteViolenciaIntoxicacion && 
            Array.isArray(datos.tipoAccidenteViolenciaIntoxicacion) &&
            datos.tipoAccidenteViolenciaIntoxicacion.length > 0) {
          return {
            required: false, // Recomendado pero no obligatorio
            message: 'Se recomienda completar el examen traumatológico cuando hay evento traumático'
          };
        }
        return { required: false };
      }
    }
  },

  // Bloque L/M: Diagnósticos CIE-10
  diagnosticos: {
    // Esta validación se hace a nivel de servicio, no de campo individual
    // Se valida que exista al menos un diagnóstico DEFINITIVO (excepto códigos Z)
    diagnosticos: {
      required: true,
      type: 'array',
      validator: async (valor, datos) => {
        // Esta validación requiere consultar la tabla DETALLE_DIAGNOSTICOS
        // Se implementará en el servicio de validación pre-firma
        if (!valor || !Array.isArray(valor) || valor.length === 0) {
          return 'Debe existir al menos un diagnóstico';
        }
        return true;
      }
    }
  },

  // Bloque N: Plan de Tratamiento
  planTratamiento: {
    planTratamiento: {
      required: false,
      type: 'array',
      conditional: (datos) => {
        // Si hay diagnósticos, el plan de tratamiento es recomendado
        // Esta validación se complementa con la validación de diagnósticos
        return {
          required: false, // Se valida en validación pre-firma
          message: 'Se recomienda completar el plan de tratamiento cuando hay diagnósticos'
        };
      }
    },
    observacionesPlanTratamiento: {
      required: false,
      type: 'string',
      maxLength: 2000,
      message: 'Las observaciones no pueden exceder 2000 caracteres'
    }
  },

  // Bloque O: Condición al Egreso
  condicionEgreso: {
    condicionEgreso: {
      required: true,
      enum: ['HOSPITALIZACION', 'ALTA', 'ESTABLE', 'INESTABLE', 'FALLECIDO', 'ALTA_DEFINITIVA', 'CONSULTA_EXTERNA', 'OBSERVACION_EMERGENCIA'],
      message: 'La condición al egreso es obligatoria'
    },
    referenciaEgreso: {
      required: false,
      type: 'string',
      conditional: (datos) => {
        // Si la condición es HOSPITALIZACION o REFERENCIA, el establecimiento es obligatorio
        if (datos.condicionEgreso === 'HOSPITALIZACION' || datos.condicionEgreso === 'ALTA') {
          return {
            required: false, // Se valida en validación pre-firma si aplica
            message: 'Se recomienda especificar el establecimiento de referencia'
          };
        }
        return { required: false };
      },
      maxLength: 255,
      message: 'El establecimiento de referencia no puede exceder 255 caracteres'
    },
    establecimientoEgreso: {
      required: false,
      type: 'string',
      conditional: (datos) => {
        if (datos.condicionEgreso === 'HOSPITALIZACION' || datos.condicionEgreso === 'ALTA') {
          return {
            required: false,
            message: 'Se recomienda especificar el establecimiento de egreso'
          };
        }
        return { required: false };
      },
      maxLength: 255,
      message: 'El establecimiento de egreso no puede exceder 255 caracteres'
    }
  }
};

/**
 * Validación especial pre-firma del Formulario 008
 * Estas validaciones se ejecutan antes de permitir la firma electrónica
 */
export const validacionPreFirma008 = {
  /**
   * Valida que exista al menos un diagnóstico DEFINITIVO (excepto códigos Z)
   * @param {Array} diagnosticos - Array de diagnósticos desde DETALLE_DIAGNOSTICOS
   * @returns {object} { valido: boolean, mensaje: string }
   */
  validarDiagnosticos: (diagnosticos) => {
    if (!diagnosticos || diagnosticos.length === 0) {
      return {
        valido: false,
        mensaje: 'Debe existir al menos un diagnóstico CIE-10'
      };
    }

    const tieneDefinitivo = diagnosticos.some(d => 
      d.tipo_diagnostico === 'DEFINITIVO' && 
      !d.codigo_cie10.toUpperCase().startsWith('Z')
    );

    if (!tieneDefinitivo) {
      return {
        valido: false,
        mensaje: 'Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z)'
      };
    }

    return {
      valido: true,
      mensaje: null
    };
  },

  /**
   * Valida que si hay diagnósticos, exista plan de tratamiento
   * @param {Array} diagnosticos - Array de diagnósticos
   * @param {Array|object} planTratamiento - Plan de tratamiento
   * @returns {object} { valido: boolean, mensaje: string }
   */
  validarPlanTratamiento: (diagnosticos, planTratamiento) => {
    if (diagnosticos && diagnosticos.length > 0) {
      const tienePlan = (
        (Array.isArray(planTratamiento) && planTratamiento.length > 0) ||
        (typeof planTratamiento === 'object' && Object.keys(planTratamiento).length > 0) ||
        (typeof planTratamiento === 'string' && planTratamiento.trim().length > 0)
      );

      if (!tienePlan) {
        return {
          valido: false,
          mensaje: 'El plan de tratamiento es obligatorio cuando hay diagnósticos'
        };
      }
    }

    return {
      valido: true,
      mensaje: null
    };
  }
};

export default formulario008Rules;
