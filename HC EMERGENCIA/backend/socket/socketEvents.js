const { getIO } = require('./socketServer');

/**
 * Emitir evento cuando un paciente cambia de estado
 * @param {Object} data - Datos del paciente y su nuevo estado
 * @param {number} data.admisionId - ID de la admisión
 * @param {number} data.pacienteId - ID del paciente
 * @param {string} data.nombrePaciente - Nombre completo del paciente
 * @param {string} data.estadoAnterior - Estado anterior del paciente
 * @param {string} data.estadoNuevo - Nuevo estado del paciente
 * @param {string} data.areaConsultorio - Área o consultorio asignado
 */
const emitEstadoCambiado = (data) => {
  const io = getIO();
  
  // Solo emitir si el estado es EN_ATENCION o SIGNOS_VITALES
  if (data.estadoNuevo === 'EN_ATENCION' || data.estadoNuevo === 'SIGNOS_VITALES') {
    io.to('turnero-digital').emit('paciente-estado-cambiado', {
      admisionId: data.admisionId,
      pacienteId: data.pacienteId,
      nombrePaciente: data.nombrePaciente,
      estadoAnterior: data.estadoAnterior,
      estadoNuevo: data.estadoNuevo,
      areaConsultorio: data.areaConsultorio || 'Emergencia',
      timestamp: new Date().toISOString()
    });
    
    console.log(`📢 Evento emitido: paciente-estado-cambiado - ${data.nombrePaciente} -> ${data.estadoNuevo}`);
  }
};

/**
 * Emitir evento cuando se llama a un paciente
 * @param {Object} data - Datos del llamado
 * @param {number} data.admisionId - ID de la admisión
 * @param {number} data.pacienteId - ID del paciente
 * @param {string} data.nombrePaciente - Nombre completo del paciente
 * @param {number} data.intentosLlamado - Número de intentos de llamado
 * @param {string} data.areaConsultorio - Área o consultorio asignado
 */
const emitPacienteLlamado = (data) => {
  const io = getIO();
  
  io.to('turnero-digital').emit('paciente-llamado', {
    admisionId: data.admisionId,
    pacienteId: data.pacienteId,
    nombrePaciente: data.nombrePaciente,
    intentosLlamado: data.intentosLlamado,
    areaConsultorio: data.areaConsultorio || 'Emergencia',
    timestamp: new Date().toISOString()
  });
  
  console.log(`📢 Evento emitido: paciente-llamado - ${data.nombrePaciente} (Intento ${data.intentosLlamado})`);
};

module.exports = {
  emitEstadoCambiado,
  emitPacienteLlamado
};
