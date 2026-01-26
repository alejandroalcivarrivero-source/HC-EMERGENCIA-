// ========================================================
// FUNCIONES PARA GESTIÓN DE INTENTOS DE LLAMADO
// ========================================================
// Fecha: 2026-01-23
// Descripción: Funciones para incrementar y gestionar intentos de llamado a pacientes
// ========================================================

const Admision = require('../models/admisiones');
const { Op } = require('sequelize');

/**
 * Incrementa el contador de intentos de llamado para una admisión
 * @param {number} admisionId - ID de la admisión
 * @param {object} transaction - Transacción de Sequelize (opcional)
 * @returns {Promise<object>} - Admisión actualizada
 */
exports.incrementarIntentosLlamado = async (admisionId, transaction = null) => {
  try {
    const admision = await Admision.findByPk(admisionId, { transaction });
    
    if (!admision) {
      throw new Error(`Admisión ${admisionId} no encontrada.`);
    }
    
    const nuevosIntentos = (admision.intentos_llamado || 0) + 1;
    
    await admision.update({
      intentos_llamado: nuevosIntentos,
      fecha_ultima_actividad: new Date()
    }, { transaction });
    
    console.log(`[incrementarIntentosLlamado] Admisión ${admisionId}: Intentos incrementados a ${nuevosIntentos}`);
    
    return admision.reload({ transaction });
  } catch (error) {
    console.error(`[incrementarIntentosLlamado] Error al incrementar intentos de llamado:`, error);
    throw error;
  }
};

/**
 * Obtiene admisiones con 3 o más intentos de llamado (pacientes que no responden)
 * @param {object} options - Opciones de búsqueda
 * @param {number} options.minIntentos - Número mínimo de intentos (default: 3)
 * @param {object} options.transaction - Transacción de Sequelize (opcional)
 * @returns {Promise<Array>} - Array de admisiones
 */
exports.getPacientesNoResponden = async (options = {}) => {
  const { minIntentos = 3, transaction = null } = options;
  
  try {
    const admisiones = await Admision.findAll({
      where: {
        intentos_llamado: {
          [Op.gte]: minIntentos
        }
      },
      include: [
        {
          model: require('../models/pacientes'),
          as: 'Paciente',
          attributes: ['id', 'numero_identificacion', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido']
        },
        {
          model: require('../models/cat_estado_paciente'),
          as: 'EstadoPaciente',
          attributes: ['id', 'nombre']
        }
      ],
      transaction
    });
    
    console.log(`[getPacientesNoResponden] Encontradas ${admisiones.length} admisiones con ${minIntentos}+ intentos de llamado`);
    
    return admisiones;
  } catch (error) {
    console.error(`[getPacientesNoResponden] Error al obtener pacientes que no responden:`, error);
    throw error;
  }
};

/**
 * Resetea el contador de intentos de llamado para una admisión
 * @param {number} admisionId - ID de la admisión
 * @param {object} transaction - Transacción de Sequelize (opcional)
 * @returns {Promise<object>} - Admisión actualizada
 */
exports.resetearIntentosLlamado = async (admisionId, transaction = null) => {
  try {
    const admision = await Admision.findByPk(admisionId, { transaction });
    
    if (!admision) {
      throw new Error(`Admisión ${admisionId} no encontrada.`);
    }
    
    await admision.update({
      intentos_llamado: 0
    }, { transaction });
    
    console.log(`[resetearIntentosLlamado] Admisión ${admisionId}: Intentos de llamado reseteados a 0`);
    
    return admision.reload({ transaction });
  } catch (error) {
    console.error(`[resetearIntentosLlamado] Error al resetear intentos de llamado:`, error);
    throw error;
  }
};
