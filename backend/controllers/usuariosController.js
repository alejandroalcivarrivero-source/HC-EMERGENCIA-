const CatTiposIdentificacion = require('../models/cat_tipos_identificacion'); // Cambiado el nombre del import
const EstadoCivil = require('../models/cat_estados_civiles');
const Sexo = require('../models/cat_sexos');
const Nacionalidad = require('../models/cat_nacionalidades');
const AutoidentificacionEtnica = require('../models/cat_autoidentificacion_etnica');
const NacionalidadPueblo = require('../models/cat_nacionalidades_pueblos');
const PuebloKichwa = require('../models/cat_pueblos_kichwa');
const NivelEducacion = require('../models/cat_niveles_educacion');
const GradoNivelEducacion = require('../models/cat_grados_niveles_educacion');
const TipoEmpresaTrabajo = require('../models/cat_tipos_empresa_trabajo');
const OcupacionProfesion = require('../models/cat_ocupaciones_profesiones');
const SeguroSalud = require('../models/cat_seguros_salud');
const TipoBono = require('../models/cat_tipos_bono');
const TieneDiscapacidad = require('../models/cat_tiene_discapacidad');
const TipoDiscapacidad = require('../models/cat_tipos_discapacidad');
const Parentesco = require('../models/cat_parentescos');
const FuenteInformacion = require('../models/cat_fuentes_informacion');
const CatFormasLlegada = require('../models/cat_formas_llegada'); // Mover la importación aquí
const Provincia = require('../models/provincia'); // Importar Provincia
const Canton = require('../models/canton');     // Importar Canton
const Parroquia = require('../models/parroquia');   // Importar Parroquia
const CatMotivoConsultaSintomas = require('../models/cat_motivo_consulta_sintomas'); // Nuevo import

// Importar modelos de pacientes y relacionados si son necesarios para buscarPacientePorIdentificacion
const Paciente = require('../models/pacientes');
const DatosAdicionalesPaciente = require('../models/datos_adicionales_paciente');
const ContactoEmergencia = require('../models/contactos_emergencia');
const Representante = require('../models/representantes');
const Residencia = require('../models/residencias');
const Admision = require('../models/admisiones'); // Asegurarse de que se importa como singular
const Parto = require('../models/partos');
const SignosVitales = require('../models/signos_vitales'); // Nuevo import
const CumplimientoProcedimientos = require('../models/cumplimientoProcedimientos'); // Reemplazar ProcedimientoEmergencia por CumplimientoProcedimientos
const { calculateTriaje } = require('./signosVitalesController'); // Importar la función de cálculo de triaje
const { Op } = require('sequelize'); // Necesario para operadores de Sequelize (ej. Op.gte)
const sequelize = require('../config/database'); // Importar la instancia de sequelize
const Rol = require('../models/rol'); // Importar el modelo Rol
const Usuario = require('../models/usuario'); // Importar el modelo Usuario
const moment = require('moment-timezone'); // Importar moment-timezone
const AtencionPacienteEstado = require('../models/atencionPacienteEstado'); // Importar el modelo AtencionPacienteEstado
const CatEstadoPaciente = require('../models/cat_estado_paciente'); // Importar el modelo CatEstadoPaciente
const CatTriaje = require('../models/cat_triaje'); // Importar el modelo CatTriaje
const AtencionEmergencia = require('../models/atencionEmergencia'); // Importar el modelo AtencionEmergencia
const { createOrUpdateAtencionPacienteEstado } = require('./atencionPacienteEstadoController'); // Importar la función unificada
const { validarCedula } = require('../utils/validador'); // Importar validador de cédula

// Controladores para catálogos
exports.obtenerRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll();
    res.json(roles);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerTiposIdentificacion = async (req, res) => {
  try {
    const tipos = await CatTiposIdentificacion.findAll(); // Usar el nuevo nombre del import
    res.json(tipos);
  } catch (error) {
    console.error('Error al obtener tipos de identificación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerEstadosCiviles = async (req, res) => {
  try {
    const estados = await EstadoCivil.findAll();
    res.json(estados);
  } catch (error) {
    console.error('Error al obtener estados civiles:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerSexos = async (req, res) => {
  try {
    const sexos = await Sexo.findAll();
    res.json(sexos);
  } catch (error) {
    console.error('Error al obtener sexos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerNacionalidades = async (req, res) => {
  try {
    const nacionalidades = await Nacionalidad.findAll();
    res.json(nacionalidades);
  } catch (error) {
    console.error('Error al obtener nacionalidades:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerAutoidentificacionesEtnicas = async (req, res) => {
  try {
    const autoidentificaciones = await AutoidentificacionEtnica.findAll();
    res.json(autoidentificaciones);
  } catch (error) {
    console.error('Error al obtener autoidentificaciones étnicas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerNacionalidadesPueblos = async (req, res) => {
  try {
    const nacionalidadesPueblos = await NacionalidadPueblo.findAll();
    res.json(nacionalidadesPueblos);
  } catch (error) {
    console.error('Error al obtener nacionalidades y pueblos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerPueblosKichwa = async (req, res) => {
  try {
    const pueblosKichwa = await PuebloKichwa.findAll();
    res.json(pueblosKichwa);
  } catch (error) {
    console.error('Error al obtener pueblos kichwa:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerNivelesEducacion = async (req, res) => {
  try {
    const niveles = await NivelEducacion.findAll();
    res.json(niveles);
  } catch (error) {
    console.error('Error al obtener niveles de educación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerGradosNivelesEducacion = async (req, res) => {
  try {
    const grados = await GradoNivelEducacion.findAll();
    res.json(grados);
  } catch (error) {
    console.error('Error al obtener grados de niveles de educación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerTiposEmpresaTrabajo = async (req, res) => {
  try {
    const tipos = await TipoEmpresaTrabajo.findAll();
    res.json(tipos);
  } catch (error) {
    console.error('Error al obtener tipos de empresa de trabajo:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerOcupacionesProfesiones = async (req, res) => {
  try {
    const ocupaciones = await OcupacionProfesion.findAll();
    res.json(ocupaciones);
  } catch (error) {
    console.error('Error al obtener ocupaciones y profesiones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerSegurosSalud = async (req, res) => {
  try {
    const seguros = await SeguroSalud.findAll();
    res.json(seguros);
  } catch (error) {
    console.error('Error al obtener seguros de salud:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerTiposBono = async (req, res) => {
  try {
    const bonos = await TipoBono.findAll();
    res.json(bonos);
  } catch (error) {
    console.error('Error al obtener tipos de bono:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerTieneDiscapacidades = async (req, res) => {
  try {
    const discapacidades = await TieneDiscapacidad.findAll();
    res.json(discapacidades);
  } catch (error) {
    console.error('Error al obtener si tiene discapacidades:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerTiposDiscapacidad = async (req, res) => {
  try {
    const tipos = await TipoDiscapacidad.findAll();
    res.json(tipos);
  } catch (error) {
    console.error('Error al obtener tipos de discapacidad:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerParentescosContacto = async (req, res) => {
  try {
    const parentescos = await Parentesco.findAll();
    res.json(parentescos);
  }  catch (error) {
    console.error('Error al obtener parentescos de contacto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Nueva función para obtener formas de llegada
exports.obtenerFormasLlegada = async (req, res) => {
  try {
    const formas = await CatFormasLlegada.findAll(); // Usar la importación global
    res.json(formas);
  } catch (error) {
    console.error('Error al obtener formas de llegada:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerFuentesInformacion = async (req, res) => {
  try {
    const fuentes = await FuenteInformacion.findAll();
    res.json(fuentes);
  } catch (error) {
    console.error('Error al obtener fuentes de información:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Función para buscar paciente por número de identificación
exports.buscarPacientePorIdentificacion = async (req, res) => {
  const { numeroIdentificacion } = req.params;
  try {
    const paciente = await Paciente.findOne({
      where: { numero_identificacion: numeroIdentificacion },
      include: [
        { model: CatTiposIdentificacion, as: 'TipoIdentificacion', attributes: ['nombre'] }, // Usar el nuevo nombre del import
        { model: Nacionalidad, as: 'Nacionalidad', attributes: ['nombre'] },
        { model: EstadoCivil, as: 'EstadoCivil', attributes: ['nombre'] },
        { model: Sexo, as: 'Sexo', attributes: ['nombre'] },
        { model: Provincia, as: 'ProvinciaNacimiento', attributes: ['nombre'] },
        { model: Canton, as: 'CantonNacimiento', attributes: ['nombre'] },
        { model: Parroquia, as: 'ParroquiaNacimiento', attributes: ['nombre'] },
        {
          model: DatosAdicionalesPaciente,
          as: 'DatosAdicionalesPaciente',
          attributes: [
            'celular',
            'telefono',
            'correo_electronico',
            'nacionalidadPuebloId',
            'puebloKichwaId',
            'nivelEducacionId',
            'gradoNivelEducacionId',
            'tipoBonoId',
            'tipoEmpresaTrabajoId',
            'tipoDiscapacidadId',
            'tieneDiscapacidadId',
            'autoidentificacionEtnicaId',
            'ocupacionProfesionId',
            'seguroSaludId'
          ],
          include: [
            { model: NacionalidadPueblo, as: 'NacionalidadPueblo', attributes: ['nombre'] },
            { model: PuebloKichwa, as: 'PuebloKichwa', attributes: ['nombre'] },
            { model: NivelEducacion, as: 'NivelEducacionPaciente', attributes: ['nombre'] },
            { model: GradoNivelEducacion, as: 'GradoNivelEducacion', attributes: ['nombre'] },
            { model: TipoEmpresaTrabajo, as: 'TipoEmpresaTrabajo', attributes: ['nombre'] },
            { model: OcupacionProfesion, as: 'OcupacionProfesion', attributes: ['nombre'] },
            { model: SeguroSalud, as: 'SeguroSalud', attributes: ['nombre'] },
            { model: TipoBono, as: 'TipoBono', attributes: ['nombre'] },
            { model: TieneDiscapacidad, as: 'TieneDiscapacidadPaciente', attributes: ['nombre'] },
            { model: TipoDiscapacidad, as: 'TipoDiscapacidad', attributes: ['nombre'] },
            { model: AutoidentificacionEtnica, as: 'AutoidentificacionEtnica', attributes: ['nombre'] }
          ]
        },
        {
          model: ContactoEmergencia,
          as: 'ContactoEmergencia',
          include: [
            { model: Parentesco, as: 'Parentesco', attributes: ['nombre'] }
          ]
        },
        {
          model: Representante,
          as: 'Representantes',
          attributes: ['id', 'cedula_representante', 'apellidos_nombres_representante', 'parentesco_id', 'parentesco_representante_id'],
          include: [
            { model: Parentesco, as: 'Parentesco', attributes: ['nombre'] }
          ]
        },
        {
          model: Residencia,
          as: 'Residencia',
          include: [
            { model: Provincia, as: 'Provincia', attributes: ['nombre'] },
            { model: Canton, as: 'Canton', attributes: ['nombre'] },
            { model: Parroquia, as: 'Parroquia', attributes: ['nombre'] }
          ]
        },
        { model: Parto, as: 'Partos', attributes: ['id', 'fecha_parto', 'hora_parto', 'atendido_en_centro_salud', 'edad_en_horas_al_ingreso', 'pacienteId'] }
      ]
    });

    console.log('Paciente encontrado (incluyendo asociaciones):', paciente ? paciente.toJSON() : 'No encontrado'); // Log para depuración

    if (paciente) {
      // Formatear la fecha de nacimiento antes de enviar la respuesta
      const pacienteFormateado = paciente.toJSON();
      // Asegurarse de que fecha_nacimiento sea una cadena YYYY-MM-DD
      if (pacienteFormateado.fecha_nacimiento instanceof Date) {
          // Convertir el objeto Date a una cadena YYYY-MM-DD
          pacienteFormateado.fecha_nacimiento = pacienteFormateado.fecha_nacimiento.toISOString().split('T')[0];
      }
      res.json({ message: 'El paciente ha sido encontrado en la base de datos', paciente: pacienteFormateado });
    } else {
      res.status(404).json({ message: 'Paciente no encontrado' });
    }
  } catch (error) {
    console.error('Error al buscar paciente por identificación:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message, stack: error.stack });
  }
};

// Función para crear un registro completo de admisión
exports.crearRegistroAdmision = async (req, res) => {
  console.log('Datos recibidos en crearRegistroAdmision:', req.body); // Log para depuración
  const {
    // Datos Personales
    tipoIdentificacion,
    numeroIdentificacion,
    primerApellido,
    segundoApellido,
    primerNombre,
    segundoNombre,
    estadoCivil,
    sexo,
    telefono,
    celular,
    correoElectronico,

    // Datos de Nacimiento
    nacionalidad,
    lugarNacimiento,
    provinciaNacimiento,
    cantonNacimiento,
    parroquiaNacimiento,
    fechaNacimiento,
    anioNacimiento,
    mesNacimiento,
    diaNacimiento,
    cedulaRepresentante,
    apellidosNombresRepresentante,
    parentescoRepresentanteNacimiento,

    // Datos de Residencia
    paisResidencia,
    provinciaResidencia,
    cantonResidencia,
    parroquiaResidencia,
    callePrincipal,
    calleSecundaria,
    barrioResidencia,
    referenciaResidencia,

    // Datos Adicionales
    autoidentificacionEtnica,
    nacionalidadPueblos,
    puebloKichwa,
    nivelEducacion,
    gradoNivelEducacion,
    tipoEmpresaTrabajo,
    ocupacionProfesionPrincipal,
    seguroSaludPrincipal,
    tipoBonoRecibe,
    tieneDiscapacidad,
    tipoDiscapacidad,

    // Datos de Contacto
    contactoEnCasoNecesario,
    parentescoContacto,
    telefonoContacto,
    direccionContacto,

    // Forma de Llegada
    formaLlegada,
    fuenteInformacion,
    institucionPersonaEntrega,
    telefonoEntrega,

    // Información adicional del frontend (no se mapea directamente a modelos)
    isUnderTwoYears,
    partoEnCentroSalud,
    fechaAdmision,
    horaAdmision,
    usuarioAdmisionId,
    fechaParto, // Extraer fechaParto del body
    horaParto, // Extraer horaParto del body
    calculatedAgeInHours, // Extraer calculatedAgeInHours del body
    motivoConsulta, // Nuevo campo: motivoConsulta (texto)
    motivoConsultaSintomaId // Mantener por si se envía directamente el ID

  } = req.body;

  // ** VALIDACIÓN DE CÉDULA **
  if (tipoIdentificacion === 'Cédula' && numeroIdentificacion && !validarCedula(numeroIdentificacion)) {
    console.log(`[crearRegistroAdmision] Cédula inválida detectada: ${numeroIdentificacion}`);
    return res.status(400).json({ mensaje: 'Cédula inválida' });
  }
  // ** FIN VALIDACIÓN DE CÉDULA **

  try {
    const sequelize = require('../config/database'); // Importar la instancia de sequelize localmente
    let pacienteExistente; // Declarar pacienteExistente aquí
    let paciente; // Declarar paciente aquí
    // Iniciar una transacción
    const result = await sequelize.transaction({
      retry: {
        max: 3, // Reintentar hasta 3 veces
        match: ['SequelizeDatabaseError: Lock wait timeout exceeded'] // Solo reintentar para este error específico
      }
    }, async (t) => {
      // Obtener el ID del triaje "Azul" (Sin Urgencia) para asignarlo por defecto
      const triajeAzul = await CatTriaje.findOne({ where: { nombre: 'SIN URGENCIA' }, transaction: t });
      if (!triajeAzul) {
        throw new Error('Categoría de triaje "SIN URGENCIA" no encontrada. Asegúrese de que la tabla CAT_TRIAJE esté poblada.');
      }

      // 1. Buscar o crear Paciente
      pacienteExistente = await Paciente.findOne({ where: { numero_identificacion: numeroIdentificacion }, transaction: t });
      

      if (pacienteExistente) {
        // Obtener la última admisión del paciente con su estado de atención más reciente y procedimientos
        const ultimaAdmision = await Admision.findOne({
            where: { pacienteId: pacienteExistente.id },
            order: [['fecha_hora_admision', 'DESC']],
            include: [
                {
                    model: AtencionPacienteEstado,
                    as: 'EstadosAtencion',
                    include: [{ model: CatEstadoPaciente, as: 'Estado' }],
                    limit: 1,
                    order: [['createdAt', 'DESC']]
                },
                {
                    model: CumplimientoProcedimientos,
                    as: 'CumplimientosProcedimientos', // Usar CumplimientosProcedimientos en lugar de ProcedimientosEmergencia
                    required: false
                }
            ],
            transaction: t
        });

        if (ultimaAdmision) {
            const ultimoEstadoAtencion = ultimaAdmision.EstadosAtencion && ultimaAdmision.EstadosAtencion.length > 0 ? ultimaAdmision.EstadosAtencion[0] : null;
            const estadoNombre = ultimoEstadoAtencion && ultimoEstadoAtencion.Estado ? ultimoEstadoAtencion.Estado.nombre : null;
            const tieneProcedimientos = ultimaAdmision.CumplimientosProcedimientos && ultimaAdmision.CumplimientosProcedimientos.length > 0;

            const isReadmissionAllowed = (
                estadoNombre === 'ATENDIDO' ||
                estadoNombre === 'ALTA_VOLUNTARIA' ||
                tieneProcedimientos
            );

            if (!isReadmissionAllowed) {
                throw new Error('El paciente tiene una admisión anterior activa o pendiente y no puede ser readmitido.');
            }
            console.log(`Readmisión permitida para paciente ${pacienteExistente.id}. Último estado: ${estadoNombre}, Tiene procedimientos: ${tieneProcedimientos}`);
        }
      }

      // 1. Buscar IDs de catálogos
      const tipoIdentificacionObj = await CatTiposIdentificacion.findOne({ where: { nombre: tipoIdentificacion }, transaction: t }); // Usar el nuevo nombre del import
      const estadoCivilObj = await EstadoCivil.findOne({ where: { nombre: estadoCivil }, transaction: t });
      const sexoObj = await Sexo.findOne({ where: { nombre: sexo }, transaction: t });
      const nacionalidadObj = await Nacionalidad.findOne({ where: { nombre: nacionalidad }, transaction: t });
      const autoidentificacionEtnicaObj = await AutoidentificacionEtnica.findOne({ where: { nombre: autoidentificacionEtnica }, transaction: t });
      const nivelEducacionObj = await NivelEducacion.findOne({ where: { nombre: nivelEducacion }, transaction: t }); // Nuevo
      console.log('nivelEducacionObj:', nivelEducacionObj ? nivelEducacionObj.toJSON() : 'No encontrado'); // Log de depuración
      const gradoNivelEducacionObj = await GradoNivelEducacion.findOne({ where: { nombre: gradoNivelEducacion }, transaction: t });
      const tipoEmpresaTrabajoObj = await TipoEmpresaTrabajo.findOne({ where: { nombre: tipoEmpresaTrabajo }, transaction: t });
      const ocupacionProfesionObj = await OcupacionProfesion.findOne({ where: { nombre: ocupacionProfesionPrincipal }, transaction: t });
      const seguroSaludObj = await SeguroSalud.findOne({ where: { nombre: seguroSaludPrincipal }, transaction: t });
      const tieneDiscapacidadObj = await TieneDiscapacidad.findOne({ where: { nombre: tieneDiscapacidad }, transaction: t });
      const tipoBonoObj = await TipoBono.findOne({ where: { nombre: tipoBonoRecibe }, transaction: t });
      const parentescoContactoObj = await Parentesco.findOne({ where: { nombre: parentescoContacto }, transaction: t });
      const fuenteInformacionObj = await FuenteInformacion.findOne({ where: { nombre: fuenteInformacion }, transaction: t });
      let motivoConsultaSintomaObj = null;
      let prioridadEnfermeria = 0;
      let observacionEscalamientoAuto = null;
      
      if (motivoConsulta) {
        motivoConsultaSintomaObj = await CatMotivoConsultaSintomas.findOne({
          where: { Motivo_Consulta_Sintoma: motivoConsulta },
          attributes: ['Codigo', 'Motivo_Consulta_Sintoma', 'Categoria', 'Codigo_Triaje'], // Especificar explícitamente los atributos
          transaction: t
        });
        if (!motivoConsultaSintomaObj) {
          console.warn(`Motivo de Consulta y Síntomas '${motivoConsulta}' no encontrado. Se guardará como texto libre.`);
        }
        
        // ESCALAMIENTO AUTOMÁTICO: Si el motivo tiene Codigo_Triaje = 1 (ROJO - RESUCITACIÓN)
        if (motivoConsultaSintomaObj && motivoConsultaSintomaObj.Codigo_Triaje === 1) {
          prioridadEnfermeria = 1;
          observacionEscalamientoAuto = `⚠️ ESCALAMIENTO AUTOMÁTICO: Motivo de consulta crítico - "${motivoConsultaSintomaObj.Motivo_Consulta_Sintoma}" (Categoría: ${motivoConsultaSintomaObj.Categoria}). Requiere valoración médica inmediata.`;
          console.log(`[crearRegistroAdmision] ⚠️ ESCALAMIENTO AUTOMÁTICO activado - Motivo: ${motivoConsultaSintomaObj.Motivo_Consulta_Sintoma}, Triaje ID: ${motivoConsultaSintomaObj.Codigo_Triaje}`);
        }
      } else {
         // Si no se encuentra en el catálogo, pero se envió texto, permitimos continuar
         // (Opcional: podrías decidir si es error o no. Asumiremos que si no está en catálogo, solo guardamos el texto si el modelo lo soporta)
         console.warn(`Motivo de Consulta '${motivoConsulta}' no encontrado en catálogo. Se guardará solo como texto si la columna existe.`);
      }

      console.log('IDs de catálogos obtenidos:'); // Log para depuración
      console.log({
        tipoIdentificacion: tipoIdentificacionObj ? tipoIdentificacionObj.id : 'No encontrado',
        estadoCivil: estadoCivilObj ? estadoCivilObj.id : 'No encontrado',
        sexo: sexoObj ? sexoObj.id : 'No encontrado',
        nacionalidad: nacionalidadObj ? nacionalidadObj.id : 'No encontrado',
        autoidentificacionEtnica: autoidentificacionEtnicaObj ? autoidentificacionEtnicaObj.id : 'No encontrado',
        nivelEducacion: nivelEducacionObj ? nivelEducacionObj.id : 'No encontrado', // Nuevo
        gradoNivelEducacion: gradoNivelEducacionObj ? gradoNivelEducacionObj.id : 'No encontrado',
        tipoEmpresaTrabajo: tipoEmpresaTrabajoObj ? tipoEmpresaTrabajoObj.id : 'No encontrado',
        ocupacionProfesion: ocupacionProfesionObj ? ocupacionProfesionObj.id : 'No encontrado',
        seguroSalud: seguroSaludObj ? seguroSaludObj.id : 'No encontrado',
        tieneDiscapacidad: tieneDiscapacidadObj ? tieneDiscapacidadObj.id : 'No encontrado',
        tipoBono: tipoBonoObj ? tipoBonoObj.id : 'No encontrado',
        parentescoContacto: parentescoContactoObj ? parentescoContactoObj.id : 'No encontrado',
        // formaLlegada: formaLlegada, // Ya no es necesario loguear el nombre aquí
        fuenteInformacion: fuenteInformacionObj ? fuenteInformacionObj.id : 'No encontrado',
      });

      // Obtener el ID de la forma de llegada
      const formaLlegadaObj = await CatFormasLlegada.findOne({ where: { nombre: formaLlegada }, transaction: t });
      if (!formaLlegadaObj) {
        throw new Error(`Forma de Llegada '${formaLlegada}' no encontrada.`);
      }
      console.log('Forma de Llegada ID:', formaLlegadaObj.id);

      // Añadir formaLlegada a la validación de catálogos
      if (!formaLlegadaObj) {
          const missingCatalogs = [];
          missingCatalogs.push('Forma de Llegada');
          throw new Error(`Uno o más catálogos no encontrados: ${missingCatalogs.join(', ')}`);
      }

      let tipoDiscapacidadObj = null;
      if (tieneDiscapacidad === 'Sí' && tipoDiscapacidad) {
        tipoDiscapacidadObj = await TipoDiscapacidad.findOne({ where: { nombre: tipoDiscapacidad }, transaction: t });
        console.log('Tipo Discapacidad ID:', tipoDiscapacidadObj ? tipoDiscapacidadObj.id : 'No encontrado');
      }

      let nacionalidadPuebloObj = null;
      if (autoidentificacionEtnica === 'Indígena' && nacionalidadPueblos) {
        nacionalidadPuebloObj = await NacionalidadPueblo.findOne({ where: { nombre: nacionalidadPueblos }, transaction: t });
        console.log('Nacionalidad Pueblo ID:', nacionalidadPuebloObj ? nacionalidadPuebloObj.id : 'No encontrado');
      }

      let puebloKichwaObj = null;
      if (nacionalidadPueblos === 'Kichwa' && puebloKichwa) {
        puebloKichwaObj = await PuebloKichwa.findOne({ where: { nombre: puebloKichwa }, transaction: t });
        console.log('Pueblo Kichwa ID:', puebloKichwaObj ? puebloKichwaObj.id : 'No encontrado');
      }

      let parentescoRepresentanteObj = null;
      if (isUnderTwoYears && parentescoRepresentanteNacimiento) {
         parentescoRepresentanteObj = await Parentesco.findOne({ where: { nombre: parentescoRepresentanteNacimiento }, transaction: t });
         console.log('Parentesco Representante ID:', parentescoRepresentanteObj ? parentescoRepresentanteObj.id : 'No encontrado');
      }

      // Validar que se encontraron todos los catálogos requeridos
      if (!tipoIdentificacionObj || !estadoCivilObj || !sexoObj || !nacionalidadObj || !autoidentificacionEtnicaObj || !gradoNivelEducacionObj || !tipoEmpresaTrabajoObj || !ocupacionProfesionObj || !seguroSaludObj || !tieneDiscapacidadObj || !tipoBonoObj || !parentescoContactoObj || !fuenteInformacionObj || (tieneDiscapacidad === 'Sí' && !tipoDiscapacidadObj) || (autoidentificacionEtnica === 'Indígena' && !nacionalidadPuebloObj) || (nacionalidadPueblos === 'Kichwa' && !puebloKichwaObj) || (isUnderTwoYears && !parentescoRepresentanteObj)) {
          const missingCatalogs = [];
          if (!tipoIdentificacionObj) missingCatalogs.push('Tipo de Identificación');
          if (!estadoCivilObj) missingCatalogs.push('Estado Civil');
          if (!sexoObj) missingCatalogs.push('Sexo');
          if (!nacionalidadObj) missingCatalogs.push('Nacionalidad');
          if (!autoidentificacionEtnicaObj) missingCatalogs.push('Autoidentificación Étnica');
          if (!nivelEducacionObj) missingCatalogs.push('Nivel Educación'); // Nuevo
          if (!gradoNivelEducacionObj) missingCatalogs.push('Grado Nivel Educación');
          if (!tipoEmpresaTrabajoObj) missingCatalogs.push('Tipo Empresa Trabajo');
          if (!ocupacionProfesionObj) missingCatalogs.push('Ocupación Profesión');
          if (!seguroSaludObj) missingCatalogs.push('Seguro Salud');
          if (!tieneDiscapacidadObj) missingCatalogs.push('Tiene Discapacidad');
          if (!tipoBonoObj) missingCatalogs.push('Tipo Bono');
          if (!parentescoContactoObj) missingCatalogs.push('Parentesco Contacto');
          if (!fuenteInformacionObj) missingCatalogs.push('Fuente Información');
          if (tieneDiscapacidad === 'Sí' && !tipoDiscapacidadObj) missingCatalogs.push('Tipo Discapacidad');
          if (autoidentificacionEtnica === 'Indígena' && !nacionalidadPuebloObj) missingCatalogs.push('Nacionalidad Pueblo');
          if (nacionalidadPueblos === 'Kichwa' && !puebloKichwaObj) missingCatalogs.push('Pueblo Kichwa');
          if (isUnderTwoYears && !parentescoRepresentanteObj) missingCatalogs.push('Parentesco Representante');
          throw new Error(`Uno o más catálogos no encontrados: ${missingCatalogs.join(', ')}`);
      }

      // Buscar IDs de provincia, canton, parroquia de nacimiento si es Ecuador
      let provinciaNacimientoObj = null;
      let cantonNacimientoObj = null;
      let parroquiaNacimientoObj = null;

      // Asumimos que si la nacionalidad es Ecuatoriana, el lugar de nacimiento es en Ecuador
      if (nacionalidad === 'Ecuatoriana') {
          provinciaNacimientoObj = await Provincia.findOne({ where: { nombre: provinciaNacimiento }, transaction: t });
          cantonNacimientoObj = await Canton.findOne({ where: { nombre: cantonNacimiento, provincia_id: provinciaNacimientoObj ? provinciaNacimientoObj.id : null }, transaction: t });
          parroquiaNacimientoObj = await Parroquia.findOne({ where: { nombre: parroquiaNacimiento, canton_id: cantonNacimientoObj ? cantonNacimientoObj.id : null }, transaction: t });

          if (!provinciaNacimientoObj || !cantonNacimientoObj || !parroquiaNacimientoObj) {
              const missingUbicaciones = [];
              if (!provinciaNacimientoObj) missingUbicaciones.push('Provincia de Nacimiento');
              if (!cantonNacimientoObj) missingUbicaciones.push('Cantón de Nacimiento');
              if (!parroquiaNacimientoObj) missingUbicaciones.push('Parroquia de Nacimiento');
              throw new Error(`Ubicación de nacimiento no encontrada: ${missingUbicaciones.join(', ')}`);
          }
      }

      // Buscar IDs de provincia, canton, parroquia de residencia
      let provinciaResidenciaObj = null;
      let cantonResidenciaObj = null;
      let parroquiaResidenciaObj = null;

      if (paisResidencia === 'Ecuador') { // Asumimos que si el país de residencia es Ecuador, se buscan las ubicaciones
          console.log('Buscando ubicaciones de residencia para Ecuador:');
          console.log(`Provincia: ${provinciaResidencia}, Cantón: ${cantonResidencia}, Parroquia: ${parroquiaResidencia}`);
          provinciaResidenciaObj = await Provincia.findOne({ where: { nombre: provinciaResidencia }, transaction: t });
          console.log('Provincia Residencia Obj:', provinciaResidenciaObj ? provinciaResidenciaObj.toJSON() : 'No encontrada');
          cantonResidenciaObj = await Canton.findOne({ where: { nombre: cantonResidencia, provincia_id: provinciaResidenciaObj ? provinciaResidenciaObj.id : null }, transaction: t });
          console.log('Cantón Residencia Obj:', cantonResidenciaObj ? cantonResidenciaObj.toJSON() : 'No encontrado');
          parroquiaResidenciaObj = await Parroquia.findOne({ where: { nombre: parroquiaResidencia, canton_id: cantonResidenciaObj ? cantonResidenciaObj.id : null }, transaction: t });
          console.log('Parroquia Residencia Obj:', parroquiaResidenciaObj ? parroquiaResidenciaObj.toJSON() : 'No encontrada');

          // Si alguna ubicación de residencia no se encuentra, se asigna null a su ID
          // Esto permite que la residencia se cree incluso si la ubicación no está en la base de datos
          // siempre y cuando el modelo de Residencia permita valores nulos para estos campos.
          if (!provinciaResidenciaObj) {
              console.warn(`Provincia de Residencia '${provinciaResidencia}' no encontrada. Se asignará null.`);
              provinciaResidenciaObj = { id: null };
          }
          if (!cantonResidenciaObj) {
              console.warn(`Cantón de Residencia '${cantonResidencia}' no encontrado. Se asignará null.`);
              cantonResidenciaObj = { id: null };
          }
          if (!parroquiaResidenciaObj) {
              console.warn(`Parroquia de Residencia '${parroquiaResidencia}' no encontrada. Se asignará null.`);
              parroquiaResidenciaObj = { id: null };
          }
      }

      // 2. Buscar o crear Paciente
      // Eliminada la redeclaración
      // let paciente; // Esta línea se elimina o se comenta

      if (pacienteExistente) {
        console.log('Paciente existente encontrado con ID:', pacienteExistente.id);
        paciente = pacienteExistente;

        // Actualizar datos del paciente existente
        await paciente.update({
          primer_apellido: primerApellido,
          segundo_apellido: segundoApellido,
          primer_nombre: primerNombre,
          segundo_nombre: segundoNombre,
          tipoIdentificacionId: tipoIdentificacionObj.id,
          nacionalidadId: nacionalidadObj.id,
          estadoCivilId: estadoCivilObj.id,
          sexoId: sexoObj.id,
          fecha_nacimiento: fechaNacimiento.split('T')[0],
          provincia_nacimiento_id: provinciaNacimientoObj ? provinciaNacimientoObj.id : null,
          canton_nacimiento_id: cantonNacimientoObj ? cantonNacimientoObj.id : null,
          parroquia_nacimiento_id: parroquiaNacimientoObj ? parroquiaNacimientoObj.id : null,
        }, { transaction: t });
        console.log('Paciente existente actualizado con ID:', paciente.id);

        // Actualizar Residencia
        let residencia = await Residencia.findOne({ where: { paciente_id: paciente.id }, transaction: t });
        if (residencia) {
          await residencia.update({
            pais_residencia: paisResidencia,
            calle_principal: callePrincipal,
            calle_secundaria: calleSecundaria,
            barrio_residencia: barrioResidencia,
            referencia_residencia: referenciaResidencia,
            provincia_residencia_id: provinciaResidenciaObj ? provinciaResidenciaObj.id : null,
            canton_residencia_id: cantonResidenciaObj ? cantonResidenciaObj.id : null,
            parroquia_residencia_id: parroquiaResidenciaObj ? parroquiaResidenciaObj.id : null,
          }, { transaction: t });
          console.log('Residencia existente actualizada para paciente ID:', paciente.id);
        } else {
          // Si no existe residencia, crear una nueva
          const nuevaResidencia = await Residencia.create({
            paciente_id: paciente.id,
            pais_residencia: paisResidencia,
            calle_principal: callePrincipal,
            calle_secundaria: calleSecundaria,
            barrio_residencia: barrioResidencia,
            referencia_residencia: referenciaResidencia,
            provincia_residencia_id: provinciaResidenciaObj ? provinciaResidenciaObj.id : null,
            canton_residencia_id: cantonResidenciaObj ? cantonResidenciaObj.id : null,
            parroquia_residencia_id: parroquiaResidenciaObj ? parroquiaResidenciaObj.id : null,
          }, { transaction: t });
          await paciente.update({ residencia_id: nuevaResidencia.id }, { transaction: t });
          console.log('Nueva Residencia creada y asociada a paciente ID:', paciente.id);
        }

        // Actualizar Datos Adicionales Paciente
        let datosAdicionales = await DatosAdicionalesPaciente.findOne({ where: { pacienteId: paciente.id }, transaction: t });
        if (datosAdicionales) {
          await datosAdicionales.update({
            telefono: telefono,
            celular: celular,
            correo_electronico: correoElectronico,
            nacionalidadPuebloId: nacionalidadPuebloObj ? nacionalidadPuebloObj.id : null,
            puebloKichwaId: puebloKichwaObj ? puebloKichwaObj.id : null,
            nivelEducacionId: nivelEducacionObj.id,
            gradoNivelEducacionId: gradoNivelEducacionObj.id,
            tipoBonoId: tipoBonoObj.id,
            tipoEmpresaTrabajoId: tipoEmpresaTrabajoObj.id,
            tipoDiscapacidadId: tipoDiscapacidadObj ? tipoDiscapacidadObj.id : null,
            tieneDiscapacidadId: tieneDiscapacidadObj.id,
            autoidentificacionEtnicaId: autoidentificacionEtnicaObj.id,
            ocupacionProfesionId: ocupacionProfesionObj.id,
            seguroSaludId: seguroSaludObj.id,
          }, { transaction: t });
          console.log('Datos Adicionales Paciente existentes actualizados para paciente ID:', paciente.id);
        } else {
          await DatosAdicionalesPaciente.create({
            pacienteId: paciente.id,
            telefono: telefono,
            celular: celular,
            correo_electronico: correoElectronico,
            nacionalidadPuebloId: nacionalidadPuebloObj ? nacionalidadPuebloObj.id : null,
            puebloKichwaId: puebloKichwaObj ? puebloKichwaObj.id : null,
            nivelEducacionId: nivelEducacionObj.id,
            gradoNivelEducacionId: gradoNivelEducacionObj.id,
            tipoBonoId: tipoBonoObj.id,
            tipoEmpresaTrabajoId: tipoEmpresaTrabajoObj.id,
            tipoDiscapacidadId: tipoDiscapacidadObj ? tipoDiscapacidadObj.id : null,
            tieneDiscapacidadId: tieneDiscapacidadObj.id,
            autoidentificacionEtnicaId: autoidentificacionEtnicaObj.id,
            ocupacionProfesionId: ocupacionProfesionObj.id,
            seguroSaludId: seguroSaludObj.id,
          }, { transaction: t });
          console.log('Nuevos Datos Adicionales Paciente creados para paciente ID:', paciente.id);
        }

        // Actualizar Contacto de Emergencia
        let contactoEmergencia = await ContactoEmergencia.findOne({ where: { pacienteId: paciente.id }, transaction: t });
        if (contactoEmergencia) {
          await contactoEmergencia.update({
            nombre_contacto: contactoEnCasoNecesario,
            parentescoId: parentescoContactoObj.id,
            telefono: telefonoContacto,
            direccion: direccionContacto,
          }, { transaction: t });
          console.log('Contacto de Emergencia existente actualizado para paciente ID:', paciente.id);
        } else {
          await ContactoEmergencia.create({
            pacienteId: paciente.id,
            nombre_contacto: contactoEnCasoNecesario,
            parentescoId: parentescoContactoObj.id,
            telefono: telefonoContacto,
            direccion: direccionContacto,
          }, { transaction: t });
          console.log('Nuevo Contacto de Emergencia creado para paciente ID:', paciente.id);
        }

        // Actualizar Representante (si aplica)
        let representante = await Representante.findOne({ where: { paciente_id: paciente.id }, transaction: t });
        if (isUnderTwoYears) {
          if (representante) {
            await representante.update({
              cedula_representante: cedulaRepresentante,
              apellidos_nombres_representante: apellidosNombresRepresentante,
              parentesco_id: parentescoRepresentanteObj ? parentescoRepresentanteObj.id : null,
              parentesco_representante_id: parentescoRepresentanteObj ? parentescoRepresentanteObj.id : null,
            }, { transaction: t });
            console.log('Representante existente actualizado para paciente ID:', paciente.id);
          } else {
            await Representante.create({
              paciente_id: paciente.id,
              cedula_representante: cedulaRepresentante,
              apellidos_nombres_representante: apellidosNombresRepresentante,
              parentesco_id: parentescoRepresentanteObj ? parentescoRepresentanteObj.id : null,
              parentesco_representante_id: parentescoRepresentanteObj ? parentescoRepresentanteObj.id : null,
            }, { transaction: t });
            console.log('Nuevo Representante creado para paciente ID:', paciente.id);
          }
        } else if (representante) {
          await representante.destroy({ transaction: t });
          console.log('Representante eliminado para paciente ID:', paciente.id);
        }

        // Actualizar Parto (si aplica)
        let parto = await Parto.findOne({ where: { pacienteId: paciente.id }, transaction: t });
        if (partoEnCentroSalud) {
          if (parto) {
            await parto.update({
              fecha_parto: fechaParto,
              hora_parto: horaParto,
              atendido_en_centro_salud: partoEnCentroSalud,
              edad_en_horas_al_ingreso: calculatedAgeInHours
            }, { transaction: t });
            console.log('Parto existente actualizado para paciente ID:', paciente.id);
          } else {
            await Parto.create({
              pacienteId: paciente.id,
              fecha_parto: fechaParto,
              hora_parto: horaParto,
              atendido_en_centro_salud: partoEnCentroSalud,
              edad_en_horas_al_ingreso: calculatedAgeInHours
            }, { transaction: t });
            console.log('Nuevo Parto creado para paciente ID:', paciente.id);
          }
        } else if (parto) {
          await parto.destroy({ transaction: t });
          console.log('Parto eliminado para paciente ID:', paciente.id);
        }

      } else {
        // Si el paciente no existe, crear uno nuevo y sus datos relacionados
        console.log('Paciente no encontrado. Creando nuevo paciente y datos relacionados...');
        paciente = await Paciente.create({
          primer_apellido: primerApellido,
          segundo_apellido: segundoApellido,
          primer_nombre: primerNombre,
          segundo_nombre: segundoNombre,
          numero_identificacion: numeroIdentificacion,
          tipoIdentificacionId: tipoIdentificacionObj.id,
          nacionalidadId: nacionalidadObj.id,
          estadoCivilId: estadoCivilObj.id,
          sexoId: sexoObj.id,
          fecha_nacimiento: fechaNacimiento.split('T')[0],
          provincia_nacimiento_id: provinciaNacimientoObj ? provinciaNacimientoObj.id : null,
          canton_nacimiento_id: cantonNacimientoObj ? cantonNacimientoObj.id : null,
          parroquia_nacimiento_id: parroquiaNacimientoObj ? parroquiaNacimientoObj.id : null,
        }, { transaction: t });
        console.log('Nuevo Paciente creado con ID:', paciente.id);

        const nuevaResidencia = await Residencia.create({
          paciente_id: paciente.id,
          pais_residencia: paisResidencia,
          calle_principal: callePrincipal,
          calle_secundaria: calleSecundaria,
          barrio_residencia: barrioResidencia,
          referencia_residencia: referenciaResidencia,
          provincia_residencia_id: provinciaResidenciaObj ? provinciaResidenciaObj.id : null,
          canton_residencia_id: cantonResidenciaObj ? cantonResidenciaObj.id : null,
          parroquia_residencia_id: parroquiaResidenciaObj ? parroquiaResidenciaObj.id : null,
        }, { transaction: t });
        await paciente.update({ residencia_id: nuevaResidencia.id }, { transaction: t });
        console.log('Nueva Residencia creada y asociada a paciente ID:', paciente.id);

        await DatosAdicionalesPaciente.create({
          pacienteId: paciente.id,
          telefono: telefono,
          celular: celular,
          correo_electronico: correoElectronico,
          nacionalidadPuebloId: nacionalidadPuebloObj ? nacionalidadPuebloObj.id : null,
          puebloKichwaId: puebloKichwaObj ? puebloKichwaObj.id : null,
          nivelEducacionId: nivelEducacionObj.id,
          gradoNivelEducacionId: gradoNivelEducacionObj.id,
          tipoBonoId: tipoBonoObj.id,
          tipoEmpresaTrabajoId: tipoEmpresaTrabajoObj.id,
          tipoDiscapacidadId: tipoDiscapacidadObj ? tipoDiscapacidadObj.id : null,
          tieneDiscapacidadId: tieneDiscapacidadObj.id,
          autoidentificacionEtnicaId: autoidentificacionEtnicaObj.id,
          ocupacionProfesionId: ocupacionProfesionObj.id,
          seguroSaludId: seguroSaludObj.id,
        }, { transaction: t });
        console.log('Nuevos Datos Adicionales Paciente creados para paciente ID:', paciente.id);

        await ContactoEmergencia.create({
          pacienteId: paciente.id,
          nombre_contacto: contactoEnCasoNecesario,
          parentescoId: parentescoContactoObj.id,
          telefono: telefonoContacto,
          direccion: direccionContacto,
        }, { transaction: t });
        console.log('Nuevo Contacto de Emergencia creado para paciente ID:', paciente.id);

        if (isUnderTwoYears) {
          await Representante.create({
            paciente_id: paciente.id,
            cedula_representante: cedulaRepresentante,
            apellidos_nombres_representante: apellidosNombresRepresentante,
            parentesco_id: parentescoRepresentanteObj ? parentescoRepresentanteObj.id : null,
            parentesco_representante_id: parentescoRepresentanteObj ? parentescoRepresentanteObj.id : null,
          }, { transaction: t });
          console.log('Nuevo Representante creado para paciente ID:', paciente.id);
        }

        if (partoEnCentroSalud) {
          await Parto.create({
            pacienteId: paciente.id,
            fecha_parto: fechaParto,
            hora_parto: horaParto,
            atendido_en_centro_salud: partoEnCentroSalud,
            edad_en_horas_al_ingreso: calculatedAgeInHours
          }, { transaction: t });
          console.log('Nuevo Parto creado para paciente ID:', paciente.id);
        }
      }

      // 7. Crear Admision (siempre se crea una nueva admisión)
      const fechaHoraAdmisionMoment = moment.tz(`${fechaAdmision} ${horaAdmision}`, 'DD/MM/YYYY HH:mm', 'America/Guayaquil');

      if (!fechaHoraAdmisionMoment.isValid()) {
        throw new Error(`Fecha u hora de admisión inválida: ${fechaAdmision} ${horaAdmision}`);
      }
      const fechaHoraAdmisionDate = fechaHoraAdmisionMoment.toDate();

      const usuarioAdmisionIdParsed = parseInt(usuarioAdmisionId, 10);
      if (isNaN(usuarioAdmisionIdParsed)) {
        throw new Error(`ID de usuario de admisión inválido: ${usuarioAdmisionId}`);
      }

      // Verificar si el usuarioAdmisionId existe en la tabla de Usuarios
      const usuarioExistente = await Usuario.findByPk(usuarioAdmisionIdParsed, {
        include: [{ model: Rol, as: 'Rol' }],
        transaction: t
      });
      if (!usuarioExistente) {
        throw new Error(`El usuario con ID ${usuarioAdmisionIdParsed} no existe en la base de datos.`);
      }

      console.log('Datos para crear Admision:', {
          pacienteId: paciente.id, // Usar el ID del paciente (existente o nuevo)
          fecha_hora_admision: fechaHoraAdmisionDate,
          forma_llegada_id: formaLlegadaObj.id,
          fuenteInformacionId: fuenteInformacionObj.id,
          institucion_persona_entrega: institucionPersonaEntrega || '',
          telefono_entrega: telefonoEntrega || '',
          usuarioAdmisionId: usuarioAdmisionIdParsed,
      });
      const admisionData = {
          pacienteId: paciente.id, // Usar el ID del paciente (existente o nuevo)
          fecha_hora_admision: fechaHoraAdmisionDate,
          forma_llegada_id: formaLlegadaObj.id,
          fuenteInformacionId: fuenteInformacionObj.id,
          institucion_persona_entrega: institucionPersonaEntrega || '', // Asegurar que no sea null
          telefono_entrega: telefonoEntrega || '', // Asegurar que no sea null
          usuarioAdmisionId: usuarioAdmisionIdParsed, // Asegurarse de que sea un número
          alerta_triaje_activa: false, // Asegurar que este campo siempre se envíe
          triajePreliminarId: triajeAzul.id, // Asignar el ID del triaje "Azul" por defecto
          fecha_hora_ultima_alerta_triaje: null, // Asegurar que este campo se envíe como null si no hay valor
          motivo_consulta_sintoma_id: motivoConsultaSintomaObj ? motivoConsultaSintomaObj.Codigo : null, // Nuevo campo
                  // motivo_consulta: motivoConsulta, // COMENTADO: La columna no existe en BD. Se usa solo motivo_consulta_sintoma_id
                  prioridad_enfermeria: prioridadEnfermeria, // Escalamiento automático si triaje es ROJO
          observacion_escalamiento: observacionEscalamientoAuto, // Observación automática del escalamiento
          // fecha_creacion y fecha_actualizacion son manejados automaticamente por Sequelize si timestamps: true,
          // pero en el modelo timestamps: false, asi que los manejamos nosotros o dejamos que la BD use default values
          fecha_creacion: new Date(),
          fecha_actualizacion: new Date()
      };

      // Validación explícita de campos requeridos antes de crear la Admision
      const requiredAdmisionFields = [
          { name: 'pacienteId', value: admisionData.pacienteId },
          { name: 'fecha_hora_admision', value: admisionData.fecha_hora_admision },
          { name: 'forma_llegada_id', value: admisionData.forma_llegada_id },
          { name: 'fuenteInformacionId', value: admisionData.fuenteInformacionId },
          { name: 'institucion_persona_entrega', value: admisionData.institucion_persona_entrega },
          { name: 'telefono_entrega', value: admisionData.telefono_entrega },
          { name: 'usuarioAdmisionId', value: admisionData.usuarioAdmisionId },
          { name: 'alerta_triaje_activa', value: admisionData.alerta_triaje_activa },
          { name: 'triajePreliminarId', value: admisionData.triajePreliminarId }, // Añadir validación para triajePreliminarId
      ];

      for (const field of requiredAdmisionFields) {
          if (field.value === null || field.value === undefined || (typeof field.value === 'string' && field.value.trim() === '')) {
              throw new Error(`Error de validación: El campo requerido '${field.name}' es nulo, indefinido o vacío.`);
          }
      }

      console.log('Objeto final para Admision.create() (detallado):', admisionData); // Log detallado
      const nuevaAdmision = await Admision.create(admisionData, { transaction: t });
      console.log('Admision creada con ID:', nuevaAdmision.id);

      // 8. Inicializar el estado de atención del paciente
        try {
          let estadoInicial = 'ADMITIDO';
          const motivoId = motivoConsultaSintomaObj ? motivoConsultaSintomaObj.id : null;
  
          // Lógica de bloqueo/excepción
          if (motivoId === 1516 || motivoId === 1517) {
            estadoInicial = 'PROCEDIMIENTOS';
            console.log(`[crearRegistroAdmision] Regla de bloqueo: Estado inicial ${estadoInicial} (Motivo ${motivoId})`);
          } else {
            console.log(`[crearRegistroAdmision] Flujo normal: Estado inicial ${estadoInicial}`);
          }
  
          await createOrUpdateAtencionPacienteEstado(nuevaAdmision, estadoInicial, usuarioAdmisionIdParsed, usuarioExistente.Rol.id, null, null, t);
          console.log(`Estado de atención del paciente ${nuevaAdmision.id} inicializado a ${estadoInicial}.`);
        } catch (estadoError) {
        console.error(`Error al inicializar estado de atención (pero admisión creada):`, estadoError);
        // No lanzar el error aquí para que la admisión se guarde aunque falle el estado
        // El estado se puede crear después manualmente si es necesario
      }

      // Si todo fue exitoso, retornar la nueva admisión
      return nuevaAdmision;
    });

    // Serializar la respuesta de forma segura
    let responseData;
    try {
      responseData = result.toJSON ? result.toJSON() : result;
    } catch (serializeError) {
      console.error('Error al serializar respuesta:', serializeError);
      // Si falla la serialización, enviar solo los datos básicos
      responseData = {
        id: result.id,
        pacienteId: result.pacienteId,
        fecha_hora_admision: result.fecha_hora_admision,
        message: 'Admisión creada exitosamente'
      };
    }

    console.log('[crearRegistroAdmision] Admisión creada exitosamente. ID:', result.id);
    res.status(201).json(responseData);

  } catch (error) {
    console.error('Error detallado al crear registro de admisión:', error.message); // Mensaje de error más detallado
    console.error('Stack trace:', error.stack); // Stack trace para depuración

    if (error.name === 'SequelizeDatabaseError') {
      console.error('Error de Base de Datos Sequelize (SQL):', error.parent);
      console.error('Consulta SQL fallida:', error.sql);
    }

    if (error.message.includes('El paciente tiene admisiones activas')) {
      return res.status(400).json({ message: error.message });
    } else if (error.name === 'SequelizeValidationError') {
      console.error('Errores de validación de Sequelize:', error.errors.map(err => err.message));
      return res.status(400).json({
        message: 'Error de validación al crear registro de admisión',
        errors: error.errors.map(err => err.message)
      });
    } else {
      console.error('Objeto de error completo:', error); // Log del objeto de error completo
      return res.status(500).json({ message: 'Error al crear registro de admisión', error: error.message });
    }
  }
};

// Función para actualizar un paciente y sus datos relacionados
exports.actualizarPaciente = async (req, res) => {
  const { id } = req.params;
  const {
    // Datos Personales
    tipoIdentificacion,
    numeroIdentificacion,
    primerApellido,
    segundoApellido,
    primerNombre,
    segundoNombre,
    estadoCivil,
    sexo,
    telefono,
    celular,
    correoElectronico,

    // Datos de Nacimiento
    nacionalidad,
    provinciaNacimiento,
    cantonNacimiento,
    parroquiaNacimiento,
    fechaNacimiento,
    cedulaRepresentante,
    apellidosNombresRepresentante,
    parentescoRepresentanteNacimiento,

    // Datos de Residencia
    paisResidencia,
    provinciaResidencia,
    cantonResidencia,
    parroquiaResidencia,
    callePrincipal,
    calleSecundaria,
    barrioResidencia,
    referenciaResidencia,

    // Datos Adicionales
    autoidentificacionEtnica,
    nacionalidadPueblos,
    puebloKichwa,
    nivelEducacion,
    gradoNivelEducacion,
    tipoEmpresaTrabajo,
    ocupacionProfesionPrincipal,
    seguroSaludPrincipal,
    tipoBonoRecibe,
    tieneDiscapacidad,
    tipoDiscapacidad,

    // Datos de Contacto
    contactoEnCasoNecesario,
    parentescoContacto,
    telefonoContacto,
    direccionContacto,

    // Información adicional del frontend (no se mapea directamente a modelos)
    isUnderTwoYears,
  } = req.body;

  // ** VALIDACIÓN DE CÉDULA **
  if (tipoIdentificacion === 'Cédula' && numeroIdentificacion && !validarCedula(numeroIdentificacion)) {
    console.log(`[actualizarPaciente] Cédula inválida detectada: ${numeroIdentificacion}`);
    return res.status(400).json({ mensaje: 'Cédula inválida' });
  }
  // ** FIN VALIDACIÓN DE CÉDULA **

  try {
    const sequelize = require('../config/database');
    const result = await sequelize.transaction(async (t) => {
      const paciente = await Paciente.findByPk(id, { transaction: t });
      if (!paciente) {
        return res.status(404).json({ message: 'Paciente no encontrado.' });
      }

      // 1. Buscar IDs de catálogos (similar a crearRegistroAdmision)
      const tipoIdentificacionObj = await CatTiposIdentificacion.findOne({ where: { nombre: tipoIdentificacion }, transaction: t }); // Usar el nuevo nombre del import
      const estadoCivilObj = await EstadoCivil.findOne({ where: { nombre: estadoCivil }, transaction: t });
      const sexoObj = await Sexo.findOne({ where: { nombre: sexo }, transaction: t });
      const nacionalidadObj = await Nacionalidad.findOne({ where: { nombre: nacionalidad }, transaction: t });
      const autoidentificacionEtnicaObj = await AutoidentificacionEtnica.findOne({ where: { nombre: autoidentificacionEtnica }, transaction: t });
      const nivelEducacionObj = await NivelEducacion.findOne({ where: { nombre: nivelEducacion }, transaction: t });
      const gradoNivelEducacionObj = await GradoNivelEducacion.findOne({ where: { nombre: gradoNivelEducacion }, transaction: t });
      const tipoEmpresaTrabajoObj = await TipoEmpresaTrabajo.findOne({ where: { nombre: tipoEmpresaTrabajo }, transaction: t });
      const ocupacionProfesionObj = await OcupacionProfesion.findOne({ where: { nombre: ocupacionProfesionPrincipal }, transaction: t });
      const seguroSaludObj = await SeguroSalud.findOne({ where: { nombre: seguroSaludPrincipal }, transaction: t });
      const tieneDiscapacidadObj = await TieneDiscapacidad.findOne({ where: { nombre: tieneDiscapacidad }, transaction: t });
      const tipoBonoObj = await TipoBono.findOne({ where: { nombre: tipoBonoRecibe }, transaction: t });
      const parentescoContactoObj = await Parentesco.findOne({ where: { nombre: parentescoContacto }, transaction: t });

      let tipoDiscapacidadObj = null;
      if (tieneDiscapacidad === 'Sí' && tipoDiscapacidad) {
        tipoDiscapacidadObj = await TipoDiscapacidad.findOne({ where: { nombre: tipoDiscapacidad }, transaction: t });
      }

      let nacionalidadPuebloObj = null;
      if (autoidentificacionEtnica === 'Indígena' && nacionalidadPueblos) {
        nacionalidadPuebloObj = await NacionalidadPueblo.findOne({ where: { nombre: nacionalidadPueblos }, transaction: t });
      }

      let puebloKichwaObj = null;
      if (nacionalidadPueblos === 'Kichwa' && puebloKichwa) {
        puebloKichwaObj = await PuebloKichwa.findOne({ where: { nombre: puebloKichwa }, transaction: t });
      }

      let parentescoRepresentanteObj = null;
      if (isUnderTwoYears && parentescoRepresentanteNacimiento) {
        parentescoRepresentanteObj = await Parentesco.findOne({ where: { nombre: parentescoRepresentanteNacimiento }, transaction: t });
      }

      // Validar que se encontraron todos los catálogos requeridos
      if (!tipoIdentificacionObj || !estadoCivilObj || !sexoObj || !nacionalidadObj || !autoidentificacionEtnicaObj || !nivelEducacionObj || !gradoNivelEducacionObj || !tipoEmpresaTrabajoObj || !ocupacionProfesionObj || !seguroSaludObj || !tieneDiscapacidadObj || !tipoBonoObj || !parentescoContactoObj || (tieneDiscapacidad === 'Sí' && !tipoDiscapacidadObj) || (autoidentificacionEtnica === 'Indígena' && !nacionalidadPuebloObj) || (nacionalidadPueblos === 'Kichwa' && !puebloKichwaObj) || (isUnderTwoYears && !parentescoRepresentanteObj)) {
        const missingCatalogs = [];
        if (!tipoIdentificacionObj) missingCatalogs.push('Tipo de Identificación');
        if (!estadoCivilObj) missingCatalogs.push('Estado Civil');
        if (!sexoObj) missingCatalogs.push('Sexo');
        if (!nacionalidadObj) missingCatalogs.push('Nacionalidad');
        if (!autoidentificacionEtnicaObj) missingCatalogs.push('Autoidentificación Étnica');
        if (!nivelEducacionObj) missingCatalogs.push('Nivel Educación');
        if (!gradoNivelEducacionObj) missingCatalogs.push('Grado Nivel Educación');
        if (!tipoEmpresaTrabajoObj) missingCatalogs.push('Tipo Empresa Trabajo');
        if (!ocupacionProfesionObj) missingCatalogs.push('Ocupación Profesión');
        if (!seguroSaludObj) missingCatalogs.push('Seguro Salud');
        if (!tieneDiscapacidadObj) missingCatalogs.push('Tiene Discapacidad');
        if (!tipoBonoObj) missingCatalogs.push('Tipo Bono');
        if (!parentescoContactoObj) missingCatalogs.push('Parentesco Contacto');
        if (tieneDiscapacidad === 'Sí' && !tipoDiscapacidadObj) missingCatalogs.push('Tipo Discapacidad');
        if (autoidentificacionEtnica === 'Indígena' && !nacionalidadPuebloObj) missingCatalogs.push('Nacionalidad Pueblo');
        if (nacionalidadPueblos === 'Kichwa' && !puebloKichwaObj) missingCatalogs.push('Pueblo Kichwa');
        if (isUnderTwoYears && !parentescoRepresentanteObj) missingCatalogs.push('Parentesco Representante');
        throw new Error(`Uno o más catálogos no encontrados: ${missingCatalogs.join(', ')}`);
      }

      // Buscar IDs de provincia, canton, parroquia de nacimiento si es Ecuador
      let provinciaNacimientoObj = null;
      let cantonNacimientoObj = null;
      let parroquiaNacimientoObj = null;

      if (nacionalidad === 'Ecuatoriana') {
        provinciaNacimientoObj = await Provincia.findOne({ where: { nombre: provinciaNacimiento }, transaction: t });
        cantonNacimientoObj = await Canton.findOne({ where: { nombre: cantonNacimiento, provincia_id: provinciaNacimientoObj ? provinciaNacimientoObj.id : null }, transaction: t });
        parroquiaNacimientoObj = await Parroquia.findOne({ where: { nombre: parroquiaNacimiento, canton_id: cantonNacimientoObj ? cantonNacimientoObj.id : null }, transaction: t });

        if (!provinciaNacimientoObj || !cantonNacimientoObj || !parroquiaNacimientoObj) {
          const missingUbicaciones = [];
          if (!provinciaNacimientoObj) missingUbicaciones.push('Provincia de Nacimiento');
          if (!cantonNacimientoObj) missingUbicaciones.push('Cantón de Nacimiento');
          if (!parroquiaNacimientoObj) missingUbicaciones.push('Parroquia de Nacimiento');
          throw new Error(`Ubicación de nacimiento no encontrada: ${missingUbicaciones.join(', ')}`);
        }
      }

      // Buscar IDs de provincia, canton, parroquia de residencia
      let provinciaResidenciaObj = null;
      let cantonResidenciaObj = null;
      let parroquiaResidenciaObj = null;

      if (paisResidencia === 'Ecuador') {
        provinciaResidenciaObj = await Provincia.findOne({ where: { nombre: provinciaResidencia }, transaction: t });
        cantonResidenciaObj = await Canton.findOne({ where: { nombre: cantonResidencia, provincia_id: provinciaResidenciaObj ? provinciaResidenciaObj.id : null }, transaction: t });
        parroquiaResidenciaObj = await Parroquia.findOne({ where: { nombre: parroquiaResidencia, canton_id: cantonResidenciaObj ? cantonResidenciaObj.id : null }, transaction: t });

        if (!provinciaResidenciaObj) {
          provinciaResidenciaObj = { id: null };
        }
        if (!cantonResidenciaObj) {
          cantonResidenciaObj = { id: null };
        }
        if (!parroquiaResidenciaObj) {
          parroquiaResidenciaObj = { id: null };
        }
      }

      // 2. Actualizar Residencia
      let residencia = await Residencia.findOne({ where: { paciente_id: paciente.id }, transaction: t });
      if (residencia) {
        await residencia.update({
          pais_residencia: paisResidencia,
          calle_principal: callePrincipal,
          calle_secundaria: calleSecundaria,
          barrio_residencia: barrioResidencia,
          referencia_residencia: referenciaResidencia,
          provincia_residencia_id: provinciaResidenciaObj ? provinciaResidenciaObj.id : null,
          canton_residencia_id: cantonResidenciaObj ? cantonResidenciaObj.id : null,
          parroquia_residencia_id: parroquiaResidenciaObj ? parroquiaResidenciaObj.id : null,
        }, { transaction: t });
      } else {
        // Si no existe residencia, crear una nueva
        residencia = await Residencia.create({
          paciente_id: paciente.id,
          pais_residencia: paisResidencia,
          calle_principal: callePrincipal,
          calle_secundaria: calleSecundaria,
          barrio_residencia: barrioResidencia,
          referencia_residencia: referenciaResidencia,
          provincia_residencia_id: provinciaResidenciaObj ? provinciaResidenciaObj.id : null,
          canton_residencia_id: cantonResidenciaObj ? cantonResidenciaObj.id : null,
          parroquia_residencia_id: parroquiaResidenciaObj ? parroquiaResidenciaObj.id : null,
        }, { transaction: t });
      }

      // 3. Actualizar Paciente
      await paciente.update({
        primer_apellido: primerApellido,
        segundo_apellido: segundoApellido,
        primer_nombre: primerNombre,
        segundo_nombre: segundoNombre,
        numero_identificacion: numeroIdentificacion,
        tipoIdentificacionId: tipoIdentificacionObj.id,
        nacionalidadId: nacionalidadObj.id,
        estadoCivilId: estadoCivilObj.id,
        sexoId: sexoObj.id,
        fecha_nacimiento: fechaNacimiento.split('T')[0],
        provincia_nacimiento_id: provinciaNacimientoObj ? provinciaNacimientoObj.id : null,
        canton_nacimiento_id: cantonNacimientoObj ? cantonNacimientoObj.id : null,
        parroquia_nacimiento_id: parroquiaNacimientoObj ? parroquiaNacimientoObj.id : null,
      }, { transaction: t });

      // 4. Actualizar Datos Adicionales Paciente
      let datosAdicionales = await DatosAdicionalesPaciente.findOne({ where: { pacienteId: paciente.id }, transaction: t });
      if (datosAdicionales) {
        await datosAdicionales.update({
          telefono: telefono,
          celular: celular,
          correo_electronico: correoElectronico,
          nacionalidadPuebloId: nacionalidadPuebloObj ? nacionalidadPuebloObj.id : null,
          puebloKichwaId: puebloKichwaObj ? puebloKichwaObj.id : null,
          nivelEducacionId: nivelEducacionObj.id,
          gradoNivelEducacionId: gradoNivelEducacionObj.id,
          tipoBonoId: tipoBonoObj.id,
          tipoEmpresaTrabajoId: tipoEmpresaTrabajoObj.id,
          tipoDiscapacidadId: tipoDiscapacidadObj ? tipoDiscapacidadObj.id : null,
          tieneDiscapacidadId: tieneDiscapacidadObj.id,
          autoidentificacionEtnicaId: autoidentificacionEtnicaObj.id,
          ocupacionProfesionId: ocupacionProfesionObj.id,
          seguroSaludId: seguroSaludObj.id,
        }, { transaction: t });
      } else {
        // Si no existe, crear nuevos datos adicionales
        await DatosAdicionalesPaciente.create({
          pacienteId: paciente.id,
          telefono: telefono,
          celular: celular,
          correo_electronico: correoElectronico,
          nacionalidadPuebloId: nacionalidadPuebloObj ? nacionalidadPuebloObj.id : null,
          puebloKichwaId: puebloKichwaObj ? puebloKichwaObj.id : null,
          nivelEducacionId: nivelEducacionObj.id,
          gradoNivelEducacionId: gradoNivelEducacionObj.id,
          tipoBonoId: tipoBonoObj.id,
          tipoEmpresaTrabajoId: tipoEmpresaTrabajoObj.id,
          tieneDiscapacidadId: tieneDiscapacidadObj.id,
          autoidentificacionEtnicaId: autoidentificacionEtnicaObj.id,
          ocupacionProfesionId: ocupacionProfesionObj.id,
          seguroSaludId: seguroSaludObj.id,
        }, { transaction: t });
      }

      // 5. Actualizar Contacto de Emergencia
      let contactoEmergencia = await ContactoEmergencia.findOne({ where: { pacienteId: paciente.id }, transaction: t });
      if (contactoEmergencia) {
        await contactoEmergencia.update({
          nombre_contacto: contactoEnCasoNecesario,
          parentescoId: parentescoContactoObj.id,
          telefono: telefonoContacto,
          direccion: direccionContacto,
        }, { transaction: t });
      } else {
        // Si no existe, crear nuevo contacto de emergencia
        await ContactoEmergencia.create({
          pacienteId: paciente.id,
          nombre_contacto: contactoEnCasoNecesario,
          parentescoId: parentescoContactoObj.id,
          telefono: telefonoContacto,
          direccion: direccionContacto,
        }, { transaction: t });
      }

      // 6. Actualizar Representante (si aplica)
      let representante = await Representante.findOne({ where: { paciente_id: paciente.id }, transaction: t });
      if (isUnderTwoYears) {
        if (representante) {
          await representante.update({
            cedula_representante: cedulaRepresentante,
            apellidos_nombres_representante: apellidosNombresRepresentante,
            parentesco_id: parentescoRepresentanteObj ? parentescoRepresentanteObj.id : null,
            parentesco_representante_id: parentescoRepresentanteObj ? parentescoRepresentanteObj.id : null,
          }, { transaction: t });
        } else {
          await Representante.create({
            paciente_id: paciente.id,
            cedula_representante: cedulaRepresentante,
            apellidos_nombres_representante: apellidosNombresRepresentante,
            parentesco_id: parentescoRepresentanteObj ? parentescoRepresentanteObj.id : null,
            parentesco_representante_id: parentescoRepresentanteObj ? parentescoRepresentanteObj.id : null,
          }, { transaction: t });
        }
      } else if (representante) {
        // Si ya no aplica y existe, eliminar el representante
        await representante.destroy({ transaction: t });
      }

      res.status(200).json({ message: 'Paciente y datos relacionados actualizados correctamente.' });
    });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar paciente.', error: error.message });
  }
};

// Función para eliminar un paciente y sus datos relacionados
exports.eliminarPaciente = async (req, res) => {
  const { id } = req.params;

  try {
    const sequelize = require('../config/database');
    await sequelize.transaction(async (t) => {
      const paciente = await Paciente.findByPk(id, { transaction: t });
      if (!paciente) {
        return res.status(404).json({ message: 'Paciente no encontrado.' });
      }

      // Eliminar registros relacionados primero para evitar errores de clave externa
      await Admision.destroy({ where: { pacienteId: id }, transaction: t });
      await DatosAdicionalesPaciente.destroy({ where: { pacienteId: id }, transaction: t });
      await ContactoEmergencia.destroy({ where: { pacienteId: id }, transaction: t });
      await Representante.destroy({ where: { pacienteId: id }, transaction: t });
      await Residencia.destroy({ where: { paciente_id: id }, transaction: t }); // Usar paciente_id para Residencia
      await Parto.destroy({ where: { pacienteId: id }, transaction: t });

      // Finalmente, eliminar el paciente
      await paciente.destroy({ transaction: t });

      res.status(200).json({ message: 'Paciente y todos sus datos relacionados eliminados correctamente.' });
    });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar paciente.', error: error.message });
  }
};

// Función para obtener todas las admisiones activas
exports.obtenerAdmisionesActivas = async (req, res) => {
  try {
    const { rolId, userId } = req; // Obtener rolId y userId del token decodificado
    console.log(`[obtenerAdmisionesActivas] ==========================================`);
    console.log(`[obtenerAdmisionesActivas] Usuario ID: ${userId}, Rol ID: ${rolId}`);
    console.log(`[obtenerAdmisionesActivas] ==========================================`);

    if (!userId || !rolId) {
      return res.status(400).json({ message: 'Usuario no autenticado correctamente.' });
    }

    let estadosExcluidosIds = [];
    const estadosFinalizados = await CatEstadoPaciente.findAll({
      where: { nombre: ['ALTA_VOLUNTARIA', 'DADO_ALTA', 'FALLECIDO', 'EGRESADO'] },
      attributes: ['id']
    });
    estadosExcluidosIds = estadosFinalizados.map(estado => estado.id);

    if (estadosExcluidosIds.length === 0) {
      return res.status(500).json({ message: 'Estados de paciente finalizados no encontrados en el catálogo.' });
    }

    let whereClause = {
      '$EstadosAtencion.estado_id$': {
        [Op.notIn]: estadosExcluidosIds // Excluir estados finalizados
      }
    };

    // Lógica condicional basada en el rol
    if (rolId === 1) { // Rol de Médico (id: 1 según tabla ROLES)
      // Médicos ven:
      // 1. Pacientes en estado 'SIGNOS_VITALES' (disponibles para atender)
      // 2. Pacientes en 'ATENDIDO'/'EN_ATENCION' que les están asignados (usuarioResponsableId)
      // 3. Pacientes en 'EN_ATENCION' que tienen una atención pendiente asignada a este médico
      const estadosMedico = await CatEstadoPaciente.findAll({
        where: { nombre: ['SIGNOS_VITALES', 'ATENDIDO', 'EN_ATENCION'] },
        attributes: ['id', 'nombre']
      });
      const signosVitalesId = estadosMedico.find(e => e.nombre === 'SIGNOS_VITALES')?.id;
      const atendidoId = estadosMedico.find(e => e.nombre === 'ATENDIDO')?.id;
      const enAtencionId = estadosMedico.find(e => e.nombre === 'EN_ATENCION')?.id;

      console.log(`[obtenerAdmisionesActivas] Médico ID: ${userId}, Estados encontrados:`, {
        signosVitalesId,
        atendidoId,
        enAtencionId
      });

      // Validar que los estados existen
      if (!signosVitalesId || !atendidoId || !enAtencionId) {
        console.error('[obtenerAdmisionesActivas] Error: No se encontraron todos los estados necesarios');
        return res.status(500).json({ message: 'Error al obtener estados de paciente necesarios.' });
      }

      // Obtener admisiones con atención pendiente asignada a este médico
      const atencionesPendientes = await AtencionEmergencia.findAll({
        where: {
          estadoFirma: { [Op.in]: ['BORRADOR', 'PENDIENTE_FIRMA'] },
          esValida: true,
          [Op.or]: [
            { usuarioResponsableId: userId },
            { 
              usuarioId: userId,
              usuarioResponsableId: null
            }
          ]
        },
        attributes: ['admisionId']
      });
      const admisionIdsConAtencionPendiente = atencionesPendientes.map(a => a.admisionId);

      console.log(`[obtenerAdmisionesActivas] Admisiones con atención pendiente para médico ${userId}:`, admisionIdsConAtencionPendiente);

      // Construir condiciones OR
      const condicionesOR = [
        // Condición 1: Pacientes en SIGNOS_VITALES (disponibles para todos los médicos)
        { '$EstadosAtencion.estado_id$': signosVitalesId },
        // Condición 2: Pacientes en ATENDIDO o EN_ATENCION asignados a este médico
        {
          [Op.and]: [
            { '$EstadosAtencion.estado_id$': { [Op.in]: [atendidoId, enAtencionId] } },
            { '$EstadosAtencion.usuarioResponsableId$': userId }
          ]
        }
      ];

      // Condición 3: Pacientes en EN_ATENCION con atención pendiente asignada a este médico
      // Esta condición es independiente de la asignación en el estado
      // Incluye pacientes que tienen una atención pendiente creada por este médico
      if (admisionIdsConAtencionPendiente.length > 0) {
        condicionesOR.push({
          [Op.and]: [
            { '$EstadosAtencion.estado_id$': enAtencionId },
            { id: { [Op.in]: admisionIdsConAtencionPendiente } }
          ]
        });
      }

      console.log(`[obtenerAdmisionesActivas] Condiciones OR para médico (${condicionesOR.length} condiciones):`, JSON.stringify(condicionesOR, null, 2));
      console.log(`[obtenerAdmisionesActivas] Médico buscando con userId: ${userId}, Buscará pacientes con usuario_responsable_id = ${userId} en el estado`);

      whereClause = {
        [Op.and]: [
          {
            '$EstadosAtencion.estado_id$': {
              [Op.notIn]: estadosExcluidosIds
            }
          },
          {
            [Op.or]: condicionesOR
          }
        ]
      };
    } else if (rolId === 3) { // Rol de Enfermero
      // Enfermeros ven todas las admisiones activas (no finalizadas)
      // La cláusula whereClause por defecto ya excluye los estados finalizados.
      // No se necesita un filtro adicional por usuarioResponsableId para enfermeros.
      console.log(`[obtenerAdmisionesActivas] Enfermero ID: ${userId}, WhereClause por defecto:`, JSON.stringify(whereClause, null, 2));
    } else if (rolId === 5) { // Rol de Administrador (id: 5 según tabla ROLES)
      // Administradores ven todas las admisiones activas (no finalizadas)
      // La cláusula whereClause por defecto ya excluye los estados finalizados.
    } else {
      // Para otros roles o roles no definidos, no se muestran admisiones activas
      return res.status(403).json({ message: 'Acceso denegado. Su rol no tiene permisos para ver admisiones activas.' });
    }

    const admisiones = await Admision.findAll({
      include: [
        {
          model: Paciente,
          as: 'Paciente',
          attributes: ['id', 'numero_identificacion', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido'],
          include: [] // Aseguramos que no traiga nada anidado innecesario
        },
        {
          model: SignosVitales,
          as: 'DatosSignosVitales',
          attributes: ['id', 'temperatura', 'presion_arterial', 'frecuencia_cardiaca', 'frecuencia_respiratoria', 'saturacion_oxigeno', 'fecha_hora_registro'],
          required: false,
          order: [['fecha_hora_registro', 'DESC']],
          limit: 1, // OPTIMIZACIÓN: Solo obtener el último registro de signos vitales
        },
        {
          model: CatFormasLlegada,
          as: 'FormaLlegada',
          attributes: ['nombre'],
          required: true,
        },
        {
          model: CatTriaje,
          as: 'TriajePreliminar',
          attributes: ['nombre', 'color'],
          required: false,
        },
        {
          model: CatTriaje,
          as: 'TriajeDefinitivo',
          attributes: ['nombre', 'color'],
          required: false,
        },
        {
          model: CatMotivoConsultaSintomas,
          as: 'MotivoConsultaSintoma',
          attributes: ['Codigo', 'Motivo_Consulta_Sintoma', 'Categoria', 'Codigo_Triaje'],
          required: false,
        },
        {
          model: AtencionPacienteEstado,
          as: 'EstadosAtencion',
          attributes: ['estado_id', 'createdAt', 'usuarioResponsableId'],
          include: [{
            model: CatEstadoPaciente,
            as: 'Estado',
            attributes: ['nombre']
          }],
          where: {
            createdAt: {
              [Op.eq]: sequelize.literal(`(
                SELECT MAX(T2.createdAt)
                FROM ATENCION_PACIENTE_ESTADO AS T2
                WHERE T2.admisionId = Admision.id
              )`)
            }
          },
          required: true,
        },
        {
          model: AtencionEmergencia,
          as: 'AtencionEmergencia',
          // No especificar attributes para que Sequelize use el mapeo del modelo automáticamente
          required: false, // LEFT JOIN
        },
      ],
      where: whereClause,
      order: [['fecha_hora_admision', 'DESC']],
    });

    console.log(`[obtenerAdmisionesActivas] Query ejecutada para rol ${rolId}. Admisiones encontradas: ${admisiones.length}`);
    if (rolId === 1) { // Médico
      console.log(`[obtenerAdmisionesActivas] WhereClause para médico:`, JSON.stringify(whereClause, null, 2));
      // Log adicional: verificar qué estados tienen las admisiones encontradas
      if (admisiones.length > 0) {
        const estadosEncontrados = admisiones.map(a => {
          const estado = a.EstadosAtencion && a.EstadosAtencion[0] && a.EstadosAtencion[0].Estado 
            ? a.EstadosAtencion[0].Estado.nombre 
            : 'SIN ESTADO';
          return {
            admisionId: a.id,
            estado: estado,
            tieneAtencionPendiente: a.AtencionEmergencia ? ['BORRADOR','PENDIENTE_FIRMA'].includes(a.AtencionEmergencia.estadoFirma) : false
          };
        });
        console.log(`[obtenerAdmisionesActivas] Estados de las admisiones encontradas:`, estadosEncontrados);
      } else {
        console.log(`[obtenerAdmisionesActivas] No se encontraron admisiones para el médico ${userId}`);
      }
    }

    const admisionesFormateadas = await Promise.all(admisiones.map(async admision => {
      let triajeNombre = 'Azul';
      let triajeColor = 'Azul';

      const estadosOrdenados = admision.EstadosAtencion.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const ultimoEstadoAtencion = estadosOrdenados[0];
      const estadoActualNombre = ultimoEstadoAtencion && ultimoEstadoAtencion.Estado ? ultimoEstadoAtencion.Estado.nombre : null;

      if (estadoActualNombre === 'FALLECIDO') {
        triajeNombre = 'Gris';
        triajeColor = 'Gris';
      } else if (admision.TriajeDefinitivo) {
        triajeNombre = admision.TriajeDefinitivo.nombre;
        triajeColor = admision.TriajeDefinitivo.color;
      } else if (admision.TriajePreliminar) {
        triajeNombre = admision.TriajePreliminar.nombre;
        triajeColor = admision.TriajePreliminar.color;
      } else if (admision.DatosSignosVitales && admision.DatosSignosVitales.length > 0) {
        const signosOrdenados = admision.DatosSignosVitales.sort((a, b) => new Date(b.fecha_hora_registro) - new Date(a.fecha_hora_registro));
        const ultimoSignoVital = signosOrdenados[0];

        const triajeCalculadoObj = await calculateTriaje({
          temperatura: ultimoSignoVital.temperatura,
          presion_arterial: ultimoSignoVital.presion_arterial,
          frecuencia_cardiaca: ultimoSignoVital.frecuencia_cardiaca,
          frecuencia_respiratoria: ultimoSignoVital.frecuencia_respiratoria,
          saturacion_oxigeno: ultimoSignoVital.saturacion_oxigeno,
        }, admision.MotivoConsultaSintoma ? admision.MotivoConsultaSintoma.Codigo_Triaje : null);

        if (triajeCalculadoObj) {
          triajeNombre = triajeCalculadoObj.nombre;
          triajeColor = triajeCalculadoObj.color;
        }
      }

      // Verificar si tiene atención pendiente
      const tieneAtencionPendiente = admision.AtencionEmergencia && 
        ['BORRADOR','PENDIENTE_FIRMA'].includes(admision.AtencionEmergencia.estadoFirma);
      const atencionId = tieneAtencionPendiente ? admision.AtencionEmergencia.id : null;

      return {
        id: admision.Paciente.id,
        admisionId: admision.id,
        cedula: admision.Paciente.numero_identificacion,
        nombre: `${admision.Paciente.primer_nombre} ${admision.Paciente.segundo_nombre || ''} ${admision.Paciente.primer_apellido} ${admision.Paciente.segundo_apellido || ''}`.trim(),
        fechaAdmision: moment.utc(admision.fecha_hora_admision).tz('America/Guayaquil').format('DD/MM/YYYY'),
        horaAdmision: moment.utc(admision.fecha_hora_admision).tz('America/Guayaquil').format('HH:mm'),
        estadoPaciente: estadoActualNombre,
        usuarioResponsableId: ultimoEstadoAtencion ? ultimoEstadoAtencion.usuarioResponsableId : null,
        triajeDefinitivoNombre: triajeNombre,
        triajeDefinitivoColor: triajeColor,
        formaLlegadaNombre: admision.FormaLlegada ? admision.FormaLlegada.nombre : 'Desconocido',
        motivoConsulta: admision.MotivoConsultaSintoma ? admision.MotivoConsultaSintoma.Motivo_Consulta_Sintoma : 'N/A',
        motivoId: admision.MotivoConsultaSintoma ? admision.MotivoConsultaSintoma.Codigo : null,
        ultimoSignoVital: admision.DatosSignosVitales && admision.DatosSignosVitales.length > 0 ? {
          temperatura: admision.DatosSignosVitales[0].temperatura,
          presionArterial: admision.DatosSignosVitales[0].presion_arterial,
          frecuenciaCardiaca: admision.DatosSignosVitales[0].frecuencia_cardiaca,
          saturacionOxigeno: admision.DatosSignosVitales[0].saturacion_oxigeno,
          fechaHoraRegistro: admision.DatosSignosVitales[0].fecha_hora_registro,
        } : null,
        intentos_llamado: admision.intentos_llamado || 0,
        fecha_ultima_actividad: admision.fecha_ultima_actividad || admision.fecha_actualizacion || null,
        prioridad_enfermeria: admision.prioridad_enfermeria || 0,
        observacion_escalamiento: admision.observacion_escalamiento || null,
        tieneAtencionPendiente: tieneAtencionPendiente,
        atencionId: atencionId,
      };
    }));

    console.log('[obtenerAdmisionesActivas] Admisiones formateadas enviadas al frontend:', JSON.stringify(admisionesFormateadas, null, 2));
    res.json(admisionesFormateadas);
  } catch (error) {
    console.error('Error al obtener admisiones activas:', error);
    console.error('Stack trace completo:', error.stack);
    if (error.name === 'SequelizeDatabaseError') {
      console.error('Detalle del error de base de datos:', error.parent);
      console.error('SQL generado:', error.sql);
    }
    res.status(500).json({ 
      message: 'Error interno del servidor al obtener admisiones activas.', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Función para obtener un paciente por su ID
exports.obtenerPacientePorId = async (req, res) => {
  const { id } = req.params;
  try {
    const paciente = await Paciente.findByPk(id, {
      attributes: [
        'id',
        'numero_identificacion',
        'primer_nombre',
        'segundo_nombre',
        'primer_apellido',
        'segundo_apellido',
        // Incluir los campos virtuales
        [sequelize.literal("CONCAT(primer_nombre, ' ', IFNULL(segundo_nombre, ''))"), 'nombres'],
        [sequelize.literal("CONCAT(primer_apellido, ' ', IFNULL(segundo_apellido, ''))"), 'apellidos']
      ],
    });

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado.' });
    }

    res.json(paciente);
  } catch (error) {
    console.error('Error al obtener paciente por ID:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Error interno del servidor al obtener paciente.', error: error.message });
  }
};

// Función para obtener una admisión por su ID, incluyendo los datos del paciente
exports.obtenerAdmisionPorId = async (req, res) => {
  const { admisionId } = req.params;
  try {
    const admision = await Admision.findByPk(admisionId, {
      include: [
        {
          model: Paciente,
          as: 'Paciente', // Descomentado para usar la asociación con alias
          attributes: ['id', 'numero_identificacion', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'fecha_nacimiento'],
        },
        {
          model: AtencionPacienteEstado,
          as: 'EstadosAtencion',
          attributes: ['estado_id'], // Incluir estado_id
          include: [{
            model: CatEstadoPaciente,
            as: 'Estado', // Alias para el modelo CatEstadoPaciente
            attributes: ['nombre']
          }],
          required: true
        },
        {
          model: CatMotivoConsultaSintomas,
          as: 'MotivoConsultaSintoma',
          attributes: ['Motivo_Consulta_Sintoma'],
          required: false
        }
      ],
    });

    if (!admision) {
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }

    // Obtener el último estado de atención para la admisión
    const ultimoAtencionEstado = await AtencionPacienteEstado.findOne({
      where: { admisionId: admision.id },
      order: [['createdAt', 'DESC']],
      include: [{ model: CatEstadoPaciente, as: 'Estado', attributes: ['nombre'] }]
    });

    const estadoActualNombre = ultimoAtencionEstado && ultimoAtencionEstado.Estado ? ultimoAtencionEstado.Estado.nombre : 'Desconocido';

    res.json({
      admisionId: admision.id,
      fechaAdmision: moment.utc(admision.fecha_hora_admision).tz('America/Guayaquil').format('DD/MM/YYYY'),
      horaAdmision: moment.utc(admision.fecha_hora_admision).tz('America/Guayaquil').format('HH:mm'),
      estadoPaciente: estadoActualNombre, // Usar el nombre del estado de la relación
      MotivoConsultaSintoma: admision.MotivoConsultaSintoma, // Incluir el motivo de consulta
      paciente: { // Anidar los datos del paciente
        id: admision.Paciente.id,
        cedula: admision.Paciente.numero_identificacion,
        nombre: `${admision.Paciente.primer_nombre} ${admision.Paciente.segundo_nombre || ''} ${admision.Paciente.primer_apellido} ${admision.Paciente.segundo_apellido || ''}`.trim(),
        fecha_nacimiento: admision.Paciente.fecha_nacimiento
      }
    });

  } catch (error) {
    console.error('Error al obtener admisión por ID:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Error interno del servidor al obtener admisión.', error: error.message });
  }
};

// Función para actualizar el estado de un paciente
exports.actualizarEstadoPaciente = async (req, res) => {
  const { admisionId } = req.params;
  const { estado_paciente, fecha_hora_retiro, fecha_hora_fallecimiento } = req.body;
  const usuarioId = req.userId; // Obtener el ID del usuario autenticado
  const rolId = req.rolId; // Obtener el ID del rol del usuario autenticado

  try {
    // Verificar si la admisión existe
    const admision = await Admision.findByPk(admisionId);
    if (!admision) {
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }
 
    // Actualizar el estado en ATENCION_PACIENTE_ESTADO
    await createOrUpdateAtencionPacienteEstado(admision, estado_paciente, usuarioId, rolId, null); // Usar la función unificada

    // Actualizar las fechas de retiro o fallecimiento en la tabla Admisiones si aplica
    const updateData = {};
    if (estado_paciente === 'ALTA_VOLUNTARIA') { // Cambiado de RETIRADO a ALTA_VOLUNTARIA
      updateData.fecha_hora_retiro = fecha_hora_retiro ? new Date(fecha_hora_retiro) : new Date();
      updateData.fecha_hora_fallecimiento = null; // Limpiar si se cambia a RETIRADO
    } else if (estado_paciente === 'FALLECIDO') {
      updateData.fecha_hora_fallecimiento = fecha_hora_fallecimiento ? new Date(fecha_hora_fallecimiento) : new Date();
      updateData.fecha_hora_retiro = null; // Limpiar si se cambia a FALLECIDO
    } else {
      // Para otros estados como 'ADMITIDO', 'ATENDIDO', 'HOSPITALIZADO', etc.
      updateData.fecha_hora_retiro = null;
      updateData.fecha_hora_fallecimiento = null;
    }

    // Solo actualizar la admisión si hay datos para actualizar (fechas de retiro/fallecimiento)
    if (Object.keys(updateData).length > 0) {
      await admision.update(updateData);
    }

    res.status(200).json({ message: `Estado del paciente actualizado a ${estado_paciente} correctamente.`, admision });
  } catch (error) {
    console.error('Error al actualizar el estado del paciente:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Error interno del servidor al actualizar el estado del paciente.', error: error.message });
  }
};
