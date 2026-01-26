const AtencionPacienteEstado = require('../models/atencionPacienteEstado');
const CatEstadoPaciente = require('../models/cat_estado_paciente');
const { Op } = require('sequelize');

exports.getProduccionPorEstado = async (req, res) => {
  try {
    const produccion = await AtencionPacienteEstado.findAll({
      attributes: [
        'estado_id',
        [AtencionPacienteEstado.sequelize.fn('COUNT', AtencionPacienteEstado.sequelize.col('admisionId')), 'cantidad']
      ],
      include: [
        {
          model: CatEstadoPaciente,
          as: 'Estado',
          attributes: ['nombre']
        }
      ],
      group: ['estado_id', 'Estado.nombre'],
      order: [[AtencionPacienteEstado.sequelize.col('cantidad'), 'DESC']]
    });

    const formattedProduccion = produccion.map(item => ({
      estado: item.Estado.nombre,
      cantidad: item.dataValues.cantidad
    }));

    res.status(200).json(formattedProduccion);
  } catch (error) {
    console.error('Error al obtener la producción por estado:', error);
    res.status(500).json({ message: 'Error al obtener la producción por estado.', error: error.message });
  }
};