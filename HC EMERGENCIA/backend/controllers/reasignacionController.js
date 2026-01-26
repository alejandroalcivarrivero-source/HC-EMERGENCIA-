const AtencionEmergencia = require('../models/atencionEmergencia');
const LogReasignacionesMedicas = require('../models/logReasignacionesMedicas');
const AtencionPacienteEstado = require('../models/atencionPacienteEstado');
const Usuario = require('../models/usuario');

/**
 * Reasignar una atención a otro médico
 */
exports.reasignarAtencion = async (req, res) => {
  try {
    const { atencionId } = req.params;
    const { medicoNuevoId, motivoReasignacion } = req.body;
    const usuarioReasignadorId = req.userId;

    // Verificar que la atención existe
    const atencion = await AtencionEmergencia.findByPk(atencionId);
    if (!atencion) {
      return res.status(404).json({ message: 'Atención no encontrada.' });
    }

    // Verificar que el nuevo médico existe
    const nuevoMedico = await Usuario.findByPk(medicoNuevoId);
    if (!nuevoMedico) {
      return res.status(404).json({ message: 'Médico no encontrado.' });
    }

    const medicoAnteriorId = atencion.usuarioResponsableId || atencion.usuarioId;

    // Registrar la reasignación en el log
    const logReasignacion = await LogReasignacionesMedicas.create({
      atencionEmergenciaId: atencionId,
      medicoAnteriorId,
      medicoNuevoId,
      motivoReasignacion,
      usuarioReasignadorId
    });

    // Actualizar la atención con el nuevo médico responsable
    await atencion.update({
      usuarioResponsableId: medicoNuevoId
    });

    // Actualizar el estado de atención del paciente
    const admision = await require('../models/admisiones').findByPk(atencion.admisionId);
    if (admision) {
      // Buscar el último estado de atención
      const ultimoEstado = await AtencionPacienteEstado.findOne({
        where: { admisionId: admision.id },
        order: [['createdAt', 'DESC']]
      });

      if (ultimoEstado) {
        // Actualizar el usuario responsable en el estado
        await ultimoEstado.update({
          usuarioResponsableId: medicoNuevoId
        });
      }
    }

    const logCompleto = await LogReasignacionesMedicas.findByPk(logReasignacion.id, {
      include: [
        {
          model: Usuario,
          as: 'MedicoAnterior',
          attributes: ['id', 'nombres', 'apellidos']
        },
        {
          model: Usuario,
          as: 'MedicoNuevo',
          attributes: ['id', 'nombres', 'apellidos']
        },
        {
          model: Usuario,
          as: 'UsuarioReasignador',
          attributes: ['id', 'nombres', 'apellidos']
        }
      ]
    });

    res.status(200).json({
      message: 'Atención reasignada exitosamente.',
      reasignacion: logCompleto,
      atencion: await AtencionEmergencia.findByPk(atencionId)
    });
  } catch (error) {
    console.error('Error al reasignar atención:', error);
    res.status(500).json({ message: 'Error al reasignar atención.', error: error.message });
  }
};

/**
 * Obtener historial de reasignaciones de una atención
 */
exports.getHistorialReasignaciones = async (req, res) => {
  try {
    const { atencionId } = req.params;

    const reasignaciones = await LogReasignacionesMedicas.findAll({
      where: { atencionEmergenciaId: atencionId },
      include: [
        {
          model: Usuario,
          as: 'MedicoAnterior',
          attributes: ['id', 'nombres', 'apellidos']
        },
        {
          model: Usuario,
          as: 'MedicoNuevo',
          attributes: ['id', 'nombres', 'apellidos']
        },
        {
          model: Usuario,
          as: 'UsuarioReasignador',
          attributes: ['id', 'nombres', 'apellidos']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(reasignaciones);
  } catch (error) {
    console.error('Error al obtener historial de reasignaciones:', error);
    res.status(500).json({ message: 'Error al obtener historial de reasignaciones.', error: error.message });
  }
};

/**
 * Obtener lista de médicos disponibles para reasignación
 */
exports.getMedicosDisponibles = async (req, res) => {
  try {
    // Obtener usuarios con rol de médico (ajustar según tu sistema de roles)
    // Asumimos que rol_id 1 es médico, ajustar según corresponda
    const Rol = require('../models/rol');
    const medicos = await Usuario.findAll({
      where: {
        activo: true,
        rol_id: 1 // Ajustar según tu sistema
      },
      attributes: ['id', 'nombres', 'apellidos', 'cedula'],
      order: [['nombres', 'ASC'], ['apellidos', 'ASC']]
    });

    res.status(200).json(medicos);
  } catch (error) {
    console.error('Error al obtener médicos disponibles:', error);
    res.status(500).json({ message: 'Error al obtener médicos disponibles.', error: error.message });
  }
};

module.exports = exports;
