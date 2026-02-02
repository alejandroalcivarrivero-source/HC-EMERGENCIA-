const Pacientes = require('./pacientes');
const Residencias = require('./residencias');
const Provincias = require('./provincia');
const Cantones = require('./canton');
const Parroquias = require('./parroquia');
const DatosAdicionalesPaciente = require('./datos_adicionales_paciente');
const ContactoEmergencia = require('./contactos_emergencia');
const Representante = require('./representantes');
const Admision = require('./admisiones'); // Ya está en singular, no necesita cambio
const Parto = require('./partos');
const SignosVitales = require('./signos_vitales'); // Nuevo import
// const ProcedimientoEmergencia = require('./procedimientoEmergencia'); // DEPRECADO - Ya no se usa, se reemplazó por CumplimientoProcedimientos
const AtencionEmergencia = require('./atencionEmergencia'); // Nuevo import
const AtencionPacienteEstado = require('./atencionPacienteEstado'); // Nuevo import
const Usuario = require('./usuario'); // Importar el modelo Usuario
const Rol = require('./rol'); // Importar el modelo Rol
const RecetaMedica = require('./recetaMedica'); // Nuevo import
const OrdenExamen = require('./ordenExamen'); // Nuevo import
const OrdenImagen = require('./ordenImagen'); // Nuevo import
const FormaLlegada = require('./cat_formas_llegada');
const FuenteInformacion = require('./cat_fuentes_informacion'); // Añadir esta línea
const CatTiposIdentificacion = require('./cat_tipos_identificacion'); // Cambiado el nombre del import
const CatMotivoConsultaSintomas = require('./cat_motivo_consulta_sintomas'); // Nuevo import
const CatTriaje = require('./cat_triaje'); // Importar el modelo CatTriaje
const Nacionalidad = require('./cat_nacionalidades');
const EstadoCivil = require('./cat_estados_civiles');
const Sexo = require('./cat_sexos');
const GradoNivelEducacion = require('./cat_grados_niveles_educacion');
const NivelEducacion = require('./cat_niveles_educacion');
const OcupacionProfesion = require('./cat_ocupaciones_profesiones');
const SeguroSalud = require('./cat_seguros_salud');
const TipoDiscapacidad = require('./cat_tipos_discapacidad');
const TieneDiscapacidad = require('./cat_tiene_discapacidad');
const AutoidentificacionEtnica = require('./cat_autoidentificacion_etnica');
const TipoBono = require('./cat_tipos_bono');
const TipoEmpresaTrabajo = require('./cat_tipos_empresa_trabajo');
const NacionalidadPueblo = require('./cat_nacionalidades_pueblos');
const PuebloKichwa = require('./cat_pueblos_kichwa');
const Parentesco = require('./cat_parentescos');
const CumplimientoProcedimientos = require('./cumplimientoProcedimientos'); // Nuevo import
const CatProcedimientosEmergencia = require('./cat_procedimientos_emergencia'); // Nuevo import
const DetalleDiagnosticos = require('./detalleDiagnosticos'); // Nuevo import
const CatCIE10 = require('./catCie10'); // Nuevo import
const LogReasignacionesMedicas = require('./logReasignacionesMedicas'); // Nuevo import

function initAssociations() {
  // Asociaciones de Residencias
  Residencias.belongsTo(Provincias, { foreignKey: 'provincia_residencia_id', as: 'ResidenciaProvincia' });
  Residencias.belongsTo(Cantones, { foreignKey: 'canton_residencia_id', as: 'CantonResidencia' });
  Residencias.belongsTo(Parroquias, { foreignKey: 'parroquia_residencia_id', as: 'ParroquiaResidencia' });
  Residencias.belongsTo(Pacientes, { foreignKey: 'paciente_id' });

  // Asociaciones de Pacientes
  Pacientes.hasOne(DatosAdicionalesPaciente, { foreignKey: 'paciente_id', as: 'DatosAdicionalesPaciente' });
  DatosAdicionalesPaciente.belongsTo(Pacientes, { foreignKey: 'paciente_id' });

  Pacientes.hasOne(ContactoEmergencia, { foreignKey: 'paciente_id', as: 'ContactoEmergencia' }); // Cambiado a hasOne
  ContactoEmergencia.belongsTo(Pacientes, { foreignKey: 'paciente_id' });

  Pacientes.hasMany(Representante, { foreignKey: 'paciente_id', as: 'Representantes' });
  Representante.belongsTo(Pacientes, { foreignKey: 'paciente_id' });


  Pacientes.hasMany(Admision, { foreignKey: 'paciente_id', as: 'Admisiones' }); // El alias 'Admisiones' se mantiene para la relación hasMany
  Admision.belongsTo(Pacientes, { foreignKey: 'paciente_id', as: 'Paciente' }); // Añadir alias explícito

  Pacientes.hasMany(Parto, { foreignKey: 'paciente_id', as: 'Partos' });
  Parto.belongsTo(Pacientes, { foreignKey: 'paciente_id' });

  // Asociaciones con catálogos para Pacientes
  Pacientes.belongsTo(CatTiposIdentificacion, { foreignKey: 'tipoIdentificacionId', as: 'TipoIdentificacion' }); // Usar el nuevo nombre del import
  Pacientes.belongsTo(Nacionalidad, { foreignKey: 'nacionalidadId', as: 'Nacionalidad' });
  Pacientes.belongsTo(EstadoCivil, { foreignKey: 'estadoCivilId', as: 'EstadoCivil' });
  Pacientes.belongsTo(Sexo, { foreignKey: 'sexoId', as: 'Sexo' });
  Pacientes.belongsTo(Provincias, { foreignKey: 'provincia_nacimiento_id', as: 'ProvinciaNacimiento' });
  Pacientes.belongsTo(Cantones, { foreignKey: 'canton_nacimiento_id', as: 'CantonNacimiento' });
  Pacientes.belongsTo(Parroquias, { foreignKey: 'parroquia_nacimiento_id', as: 'ParroquiaNacimiento' });
  Pacientes.hasOne(Residencias, { foreignKey: 'paciente_id', as: 'PacienteResidencia' }); // Añadido el alias para Residencia

  // Asociaciones para DatosAdicionalesPaciente
  DatosAdicionalesPaciente.belongsTo(TipoBono, { foreignKey: 'tipoBonoId', as: 'TipoBono' });
  DatosAdicionalesPaciente.belongsTo(TipoEmpresaTrabajo, { foreignKey: 'tipoEmpresaTrabajoId', as: 'TipoEmpresaTrabajo' });
  DatosAdicionalesPaciente.belongsTo(NacionalidadPueblo, { foreignKey: 'nacionalidadPuebloId', as: 'NacionalidadPueblo' });
  DatosAdicionalesPaciente.belongsTo(PuebloKichwa, { foreignKey: 'puebloKichwaId', as: 'PuebloKichwa' });
  DatosAdicionalesPaciente.belongsTo(TipoDiscapacidad, { foreignKey: 'tipoDiscapacidadId', as: 'TipoDiscapacidad' });
  DatosAdicionalesPaciente.belongsTo(OcupacionProfesion, { foreignKey: 'ocupacionProfesionId', as: 'OcupacionProfesion' });
  DatosAdicionalesPaciente.belongsTo(SeguroSalud, { foreignKey: 'seguroSaludId', as: 'SeguroSalud' });
  DatosAdicionalesPaciente.belongsTo(AutoidentificacionEtnica, { foreignKey: 'autoidentificacionEtnicaId', as: 'AutoidentificacionEtnica' });
  DatosAdicionalesPaciente.belongsTo(NivelEducacion, { foreignKey: 'nivelEducacionId', as: 'NivelEducacionPaciente' }); // Coincide con el alias en el controlador
  DatosAdicionalesPaciente.belongsTo(GradoNivelEducacion, { foreignKey: 'gradoNivelEducacionId', as: 'GradoNivelEducacion' });
  DatosAdicionalesPaciente.belongsTo(TieneDiscapacidad, { foreignKey: 'tieneDiscapacidadId', as: 'TieneDiscapacidadPaciente' }); // Coincide con el alias en el controlador

  // Asociaciones para ContactoEmergencia
  ContactoEmergencia.belongsTo(Parentesco, { foreignKey: 'parentescoId', as: 'Parentesco' });

  // Asociaciones para Representante
  Representante.belongsTo(Parentesco, { foreignKey: 'parentesco_id', as: 'ParentescoRepresentante' });

  // Asociaciones para Admision
  Admision.belongsTo(FormaLlegada, { foreignKey: 'forma_llegada_id', as: 'FormaLlegada' });
  Admision.belongsTo(FuenteInformacion, { foreignKey: 'fuenteInformacionId', as: 'FuenteInformacion' });
  Admision.belongsTo(CatTriaje, { foreignKey: 'triajePreliminarId', as: 'TriajePreliminar' });
  Admision.belongsTo(CatTriaje, { foreignKey: 'triajeDefinitivoId', as: 'TriajeDefinitivo' });
  // Admision.belongsTo(Usuario, { foreignKey: 'usuarioAdmisionId', as: 'UsuarioAdmision' }); // Esta línea ya no es necesaria aquí, se define en admisiones.js

  // Asociaciones para SignosVitales
  Admision.hasMany(SignosVitales, { foreignKey: 'admisionId', as: 'DatosSignosVitales', tableName: 'SIGNOS_VITALES' });
  SignosVitales.belongsTo(Admision, { foreignKey: 'admisionId', as: 'AdmisionSignosVitales', tableName: 'SIGNOS_VITALES' }); // Añadir alias explícito
  SignosVitales.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'UsuarioRegistro' }); // Nueva asociación para el usuario que registra los signos vitales

  // Asociaciones para ProcedimientoEmergencia (DEPRECADO - Ya no se usa, se reemplazó por CumplimientoProcedimientos)
  // ProcedimientoEmergencia.belongsTo(Pacientes, { foreignKey: 'pacienteId', as: 'Paciente' });
  // ProcedimientoEmergencia.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'Usuario' });
  // Admision.hasMany(ProcedimientoEmergencia, { foreignKey: 'admisionId', as: 'ProcedimientosEmergencia' });
  // ProcedimientoEmergencia.belongsTo(Admision, { foreignKey: 'admisionId', as: 'AdmisionParaProcedimiento' });

  // Asociaciones para CumplimientoProcedimientos
  CumplimientoProcedimientos.belongsTo(Admision, { foreignKey: 'admision_id', as: 'Admision' });
  CumplimientoProcedimientos.belongsTo(CatProcedimientosEmergencia, { foreignKey: 'procedimiento_cat_id', as: 'Procedimiento' });
  CumplimientoProcedimientos.belongsTo(Usuario, { foreignKey: 'usuario_enfermeria_id', as: 'UsuarioEnfermeria' });
  Admision.hasMany(CumplimientoProcedimientos, { foreignKey: 'admision_id', as: 'CumplimientosProcedimientos' });

  // Asociaciones para AtencionEmergencia
  AtencionEmergencia.belongsTo(Pacientes, { foreignKey: 'pacienteId', as: 'Paciente' });
  AtencionEmergencia.belongsTo(Admision, { foreignKey: 'admisionId', as: 'AdmisionAtencion' });
  AtencionEmergencia.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'Usuario' });
  AtencionEmergencia.belongsTo(Usuario, { foreignKey: 'usuarioResponsableId', as: 'UsuarioResponsable' });
  Admision.hasOne(AtencionEmergencia, { foreignKey: 'admisionId', as: 'AtencionEmergencia' }); // Una admisión puede tener una atención de emergencia

  // Asociaciones para DetalleDiagnosticos
  DetalleDiagnosticos.belongsTo(AtencionEmergencia, { foreignKey: 'atencionEmergenciaId', as: 'AtencionEmergencia' });
  DetalleDiagnosticos.belongsTo(CatCIE10, { foreignKey: 'codigoCIE10', targetKey: 'codigo', as: 'CIE10' });
  AtencionEmergencia.hasMany(DetalleDiagnosticos, { foreignKey: 'atencionEmergenciaId', as: 'DetalleDiagnosticos' });

  // Asociaciones para LogReasignacionesMedicas
  LogReasignacionesMedicas.belongsTo(AtencionEmergencia, { foreignKey: 'atencionEmergenciaId', as: 'AtencionEmergencia' });
  LogReasignacionesMedicas.belongsTo(Usuario, { foreignKey: 'medicoAnteriorId', as: 'MedicoAnterior' });
  LogReasignacionesMedicas.belongsTo(Usuario, { foreignKey: 'medicoNuevoId', as: 'MedicoNuevo' });
  LogReasignacionesMedicas.belongsTo(Usuario, { foreignKey: 'usuarioReasignadorId', as: 'UsuarioReasignador' });
  AtencionEmergencia.hasMany(LogReasignacionesMedicas, { foreignKey: 'atencionEmergenciaId', as: 'Reasignaciones' });

  // Asociaciones para AtencionPacienteEstado
  Admision.hasMany(AtencionPacienteEstado, { foreignKey: 'admisionId', as: 'EstadosAtencion' }); // Cambiado a hasMany y alias a plural
  AtencionPacienteEstado.belongsTo(Admision, { foreignKey: 'admisionId', as: 'AdmisionEstado' });
  AtencionPacienteEstado.belongsTo(Usuario, { foreignKey: 'usuarioResponsableId', as: 'UsuarioResponsableAtencion' });
  AtencionPacienteEstado.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'UsuarioRegistroEstado' }); // Usuario que registra el estado
  AtencionPacienteEstado.belongsTo(Rol, { foreignKey: 'rolId', as: 'RolRegistroEstado' }); // Rol del usuario que registra el estado

  console.log('Asociaciones inicializadas. Modelos y sus alias:');
  console.log('Admision:', Admision.associations);
  // console.log('ProcedimientoEmergencia:', ProcedimientoEmergencia.associations); // DEPRECADO
  console.log('CumplimientoProcedimientos:', CumplimientoProcedimientos.associations);
  console.log('AtencionEmergencia:', AtencionEmergencia.associations);
  console.log('AtencionPacienteEstado:', AtencionPacienteEstado.associations);
 
   // Asociaciones para RecetaMedica
   RecetaMedica.belongsTo(Admision, { foreignKey: 'admisionId', as: 'AdmisionReceta' });
   RecetaMedica.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'Usuario' });
   Admision.hasMany(RecetaMedica, { foreignKey: 'admisionId', as: 'RecetasMedicas' });
   console.log('RecetaMedica:', RecetaMedica.associations);
 
   // Asociaciones para OrdenExamen
   OrdenExamen.belongsTo(Admision, { foreignKey: 'admisionId', as: 'AdmisionExamen' });
   OrdenExamen.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'Usuario' });
   Admision.hasMany(OrdenExamen, { foreignKey: 'admisionId', as: 'OrdenesExamen' });
   console.log('OrdenExamen:', OrdenExamen.associations);
 
   // Asociaciones para OrdenImagen
   OrdenImagen.belongsTo(Admision, { foreignKey: 'admisionId', as: 'AdmisionImagen' });
   OrdenImagen.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'Usuario' });
   Admision.hasMany(OrdenImagen, { foreignKey: 'admisionId', as: 'OrdenesImagen' });
   console.log('OrdenImagen:', OrdenImagen.associations);
}

module.exports = initAssociations;