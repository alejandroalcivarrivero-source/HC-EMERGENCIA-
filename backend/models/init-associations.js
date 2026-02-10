const Pacientes = require('./pacientes');
const Residencias = require('./residencias');
const Provincias = require('./provincia');
const Cantones = require('./canton');
const Parroquias = require('./parroquia');
const DatosAdicionalesPaciente = require('./datos_adicionales_paciente');
const ContactoEmergencia = require('./contactos_emergencia');
const Representante = require('./representantes');
const Admision = require('./admisiones');
const SignosVitales = require('./signos_vitales');
const Form008 = require('./Form008');
const AtencionEmergencia = require('./atencionEmergencia');
const AtencionPacienteEstado = require('./atencionPacienteEstado');
const Usuario = require('./usuario');
const Rol = require('./rol');
const CatProcedimientosEmergencia = require('./cat_procedimientos_emergencia');
const CumplimientoProcedimientos = require('./cumplimientoProcedimientos');
const DetalleDiagnostico = require('./DetalleDiagnostico');
const CatCIE10 = require('./catCie10');
const LogReasignacionesMedicas = require('./logReasignacionesMedicas');
const CatEstadoPaciente = require('./cat_estado_paciente');

function initAssociations() {
  console.log("🚀 Iniciando asociaciones limpias...");

  // --- ASOCIACIONES BÁSICAS (Sin alias conflictivos) ---
  
  // Residencia
  if (!Residencias.associations.Paciente) {
    Residencias.belongsTo(Pacientes, { foreignKey: 'paciente_id' });
  }

  // Admisiones y Triage
// --- CORRECCIÓN QUIRÚRGICA PARA SIGNOS VITALES ---
if (!Admision.associations.DatosSignosVitales) {
    Admision.hasMany(SignosVitales, {
        foreignKey: 'admisionId',
        as: 'DatosSignosVitales'
    });
}
if (!SignosVitales.associations.Admision) {
    SignosVitales.belongsTo(Admision, {
        foreignKey: 'admisionId'
    });
}
  
  if (!Admision.associations.FormularioTriage) {
    Admision.hasOne(Form008, { foreignKey: 'admisionId', as: 'FormularioTriage' });
  }

  // Estados para la tarea CRON (Fundamental para el hospital)
  if (!Admision.associations.EstadosAtencion) {
    Admision.hasMany(AtencionPacienteEstado, { foreignKey: 'admisionId', as: 'EstadosAtencion' });
    AtencionPacienteEstado.belongsTo(Admision, { foreignKey: 'admisionId' });
    AtencionPacienteEstado.belongsTo(CatEstadoPaciente, { foreignKey: 'estado_id', as: 'Estado' });
  }

  // Atención Médica
  if (!AtencionEmergencia.associations.AdmisionDeAtencion) {
    AtencionEmergencia.belongsTo(Admision, { foreignKey: 'admisionId', as: 'AdmisionDeAtencion' });
  }

  // Roles
  if (!Usuario.associations.RolAsignado) {
    Usuario.belongsTo(Rol, { foreignKey: 'rol_id', as: 'RolAsignado' });
  }

  // Asociar CumplimientoProcedimientos con Admision
  if (!CumplimientoProcedimientos.associations.Admision) {
    CumplimientoProcedimientos.belongsTo(Admision, { foreignKey: 'admision_id' });
  }
  if (!Admision.associations.CumplimientoProcedimientos) {
    Admision.hasMany(CumplimientoProcedimientos, { foreignKey: 'admision_id' });
  }

  console.log("✅ Asociaciones finalizadas sin duplicados.");
}

module.exports = initAssociations;