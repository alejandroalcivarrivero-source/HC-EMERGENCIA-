/**
 * Validador Genérico de Formularios Médicos
 * Implementa validaciones según normas técnicas del MSP Ecuador
 */

export class FormValidator {
  /**
   * Valida un bloque completo del formulario
   * @param {string} tipoFormulario - Tipo de formulario (008, 005, etc.)
   * @param {string} bloqueId - ID del bloque a validar
   * @param {object} datos - Datos del formulario
   * @returns {object} { valido: boolean, errores: Array }
   */
  static validarBloque(tipoFormulario, bloqueId, datos) {
    const rules = this.getRules(tipoFormulario);
    const bloqueRules = rules[bloqueId];
    
    if (!bloqueRules) {
      return { valido: true, errores: [] };
    }

    const errores = [];
    
    for (const [campo, regla] of Object.entries(bloqueRules)) {
      const valor = datos[campo];
      
      // Validación condicional (depende de otros campos)
      if (regla.conditional) {
        const reglaCondicional = regla.conditional(datos);
        if (reglaCondicional.required && !this.tieneValor(valor)) {
          errores.push({
            campo,
            mensaje: reglaCondicional.message || `El campo ${campo} es obligatorio`
          });
          continue;
        }
      }
      
      // Validación requerida
      if (regla.required && !this.tieneValor(valor)) {
        errores.push({
          campo,
          mensaje: regla.message || `El campo ${campo} es obligatorio`
        });
        continue;
      }
      
      // Si el campo está vacío y no es requerido, saltar otras validaciones
      if (!this.tieneValor(valor) && !regla.required) {
        continue;
      }
      
      // Validación de longitud mínima
      if (regla.minLength && valor && valor.length < regla.minLength) {
        errores.push({
          campo,
          mensaje: regla.message || `El campo ${campo} debe tener al menos ${regla.minLength} caracteres`
        });
        continue;
      }
      
      // Validación de longitud máxima
      if (regla.maxLength && valor && valor.length > regla.maxLength) {
        errores.push({
          campo,
          mensaje: regla.message || `El campo ${campo} no puede exceder ${regla.maxLength} caracteres`
        });
        continue;
      }
      
      // Validación de patrón (regex)
      if (regla.pattern && valor && !regla.pattern.test(valor)) {
        errores.push({
          campo,
          mensaje: regla.message || `El formato del campo ${campo} no es válido`
        });
        continue;
      }
      
      // Validación de enum (valores permitidos)
      if (regla.enum && valor && !regla.enum.includes(valor)) {
        errores.push({
          campo,
          mensaje: regla.message || `El valor del campo ${campo} no es válido`
        });
        continue;
      }
      
      // Validación custom (función)
      if (regla.validator && typeof regla.validator === 'function') {
        const resultado = regla.validator(valor, datos);
        if (resultado !== true) {
          errores.push({
            campo,
            mensaje: typeof resultado === 'string' ? resultado : `Error en la validación del campo ${campo}`
          });
          continue;
        }
      }
      
      // Validación de tipo
      if (regla.type) {
        const tipoValido = this.validarTipo(valor, regla.type);
        if (!tipoValido) {
          errores.push({
            campo,
            mensaje: regla.message || `El campo ${campo} debe ser de tipo ${regla.type}`
          });
        }
      }
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Valida todos los bloques obligatorios de un formulario
   * @param {string} tipoFormulario - Tipo de formulario
   * @param {object} datos - Datos completos del formulario
   * @param {Array} bloquesObligatorios - Lista de IDs de bloques obligatorios
   * @returns {object} { valido: boolean, errores: Array, bloquesIncompletos: Array }
   */
  static validarFormularioCompleto(tipoFormulario, datos, bloquesObligatorios) {
    const errores = [];
    const bloquesIncompletos = [];

    for (const bloqueId of bloquesObligatorios) {
      const validacion = this.validarBloque(tipoFormulario, bloqueId, datos);
      if (!validacion.valido) {
        bloquesIncompletos.push(bloqueId);
        errores.push({
          bloque: bloqueId,
          errores: validacion.errores
        });
      }
    }

    return {
      valido: errores.length === 0,
      errores,
      bloquesIncompletos
    };
  }

  /**
   * Obtiene las reglas de validación para un tipo de formulario
   * @param {string} tipoFormulario - Tipo de formulario
   * @returns {object} Reglas de validación
   */
  static getRules(tipoFormulario) {
    // Importación dinámica de reglas
    try {
      const rulesMap = {
        '008': require('../formulario008/validations/formulario008Rules').formulario008Rules,
        // '005': require('../formulario005/validations/formulario005Rules').formulario005Rules,
        // Agregar más formularios aquí
      };
      
      return rulesMap[tipoFormulario] || {};
    } catch (error) {
      console.error(`Error al cargar reglas para formulario ${tipoFormulario}:`, error);
      return {};
    }
  }

  /**
   * Verifica si un valor tiene contenido
   * @param {any} valor - Valor a verificar
   * @returns {boolean}
   */
  static tieneValor(valor) {
    if (valor === null || valor === undefined) {
      return false;
    }
    if (typeof valor === 'string') {
      return valor.trim().length > 0;
    }
    if (Array.isArray(valor)) {
      return valor.length > 0;
    }
    if (typeof valor === 'object') {
      return Object.keys(valor).length > 0;
    }
    return true;
  }

  /**
   * Valida el tipo de dato
   * @param {any} valor - Valor a validar
   * @param {string} tipo - Tipo esperado
   * @returns {boolean}
   */
  static validarTipo(valor, tipo) {
    switch (tipo) {
      case 'string':
        return typeof valor === 'string';
      case 'number':
        return typeof valor === 'number' && !isNaN(valor);
      case 'boolean':
        return typeof valor === 'boolean';
      case 'date':
        return valor instanceof Date || !isNaN(Date.parse(valor));
      case 'array':
        return Array.isArray(valor);
      case 'object':
        return typeof valor === 'object' && !Array.isArray(valor) && valor !== null;
      default:
        return true;
    }
  }

  /**
   * Valida formato de hora (HH:mm)
   * @param {string} hora - Hora a validar
   * @returns {boolean}
   */
  static validarHora(hora) {
    const pattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return pattern.test(hora);
  }

  /**
   * Valida formato de fecha (YYYY-MM-DD)
   * @param {string} fecha - Fecha a validar
   * @returns {boolean}
   */
  static validarFecha(fecha) {
    const pattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!pattern.test(fecha)) {
      return false;
    }
    const date = new Date(fecha);
    return date instanceof Date && !isNaN(date);
  }
}

export default FormValidator;
