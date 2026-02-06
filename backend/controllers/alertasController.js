const Admision = require('../models/admisiones');
const Paciente = require('../models/pacientes');
const CatFormasLlegada = require('../models/cat_formas_llegada'); // Importar CatFormasLlegada
const CatTriaje = require('../models/cat_triaje'); // Importar CatTriaje
const CatEstadoPaciente = require('../models/cat_estado_paciente'); // Importar CatEstadoPaciente
const AtencionPacienteEstado = require('../models/atencionPacienteEstado'); // Importar AtencionPacienteEstado
const moment = require('moment-timezone');

const getAdmisionesConAlertaTriaje = async (req, res) => {
  try {
    // Consulta a la tabla ADMISIONES (SISA_EC)
    // Se mantiene el uso de ADMISIONES ya que contiene la información de triaje y estado
    const admisionesConAlerta = await Admision.findAll({
      where: {
        alerta_triaje_activa: true,
      },
      include: [
        {
          model: Paciente,
          as: 'Paciente',
          attributes: ['nombres', 'apellidos', 'numero_identificacion', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido']
        },
        {
          model: CatFormasLlegada, // Incluir el modelo CatFormasLlegada
          as: 'FormaLlegada', // Usar el alias definido en init-associations.js
          attributes: ['nombre'], // Obtener solo el nombre
          required: true, // INNER JOIN para asegurar que siempre haya una forma de llegada
        },
        {
          model: CatTriaje,
          as: 'TriajeDefinitivo', // Cambiar a TriajeDefinitivo
          attributes: ['nombre', 'color', 'id'], // Incluir id para comparación de prioridad
          required: false, // LEFT JOIN para incluir el triaje si existe
        },
        {
          model: AtencionPacienteEstado,
          as: 'EstadosAtencion',
          attributes: ['estado_id', 'createdAt'],
          include: [{
            model: CatEstadoPaciente,
            as: 'Estado',
            attributes: ['nombre'],
            where: { nombre: 'SIGNOS_VITALES' }
          }],
          required: true,
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ],
      order: [['fecha_hora_ultima_alerta_triaje', 'DESC']],
    });

    // Asegurarse de que el triaje se incluya en los datos de la admisión
    // No es necesario un mapeo separado si se incluye en la consulta principal

    const admisionesFormateadas = admisionesConAlerta.map(admision => {
      const fechaHoraAdmisionLocal = moment.utc(admision.fecha_hora_admision).tz('America/Guayaquil').format('YYYY-MM-DD HH:mm:ss');
      const fechaHoraUltimaAlertaTriajeLocal = admision.fecha_hora_ultima_alerta_triaje
        ? moment.utc(admision.fecha_hora_ultima_alerta_triaje).tz('America/Guayaquil').format('YYYY-MM-DD HH:mm:ss')
        : null;

      return {
        ...admision.toJSON(),
        fecha_hora_admision: fechaHoraAdmisionLocal,
        fecha_hora_ultima_alerta_triaje: fechaHoraUltimaAlertaTriajeLocal,
        formaLlegadaNombre: admision.FormaLlegada ? admision.FormaLlegada.nombre : 'Desconocido', // Obtener el nombre de la forma de llegada
        triaje: admision.TriajeDefinitivo ? admision.TriajeDefinitivo.nombre : 'Desconocido', // Obtener el nombre del triaje definitivo
        triajeColor: admision.TriajeDefinitivo ? admision.TriajeDefinitivo.color : 'gray', // Obtener el color del triaje definitivo
      };
    });

    res.status(200).json(admisionesFormateadas);
  } catch (error) {
    console.error('Error al obtener admisiones con alerta de triaje:', error);
    if (error.name === 'SequelizeDatabaseError') {
      console.error('Detalle del error de base de datos:', error.parent);
      console.error('SQL generado:', error.sql);
    }
    res.status(500).json({ message: 'Error al obtener admisiones con alerta de triaje.', error: error.message });
  }
};

module.exports = {
  getAdmisionesConAlertaTriaje
};