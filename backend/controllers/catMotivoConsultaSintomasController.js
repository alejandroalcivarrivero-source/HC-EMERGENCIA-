const CatMotivoConsultaSintomas = require('../models/cat_motivo_consulta_sintomas');
const { Op, Sequelize } = require('sequelize'); // Importar Sequelize
const sequelize = require('../config/database'); // Importar la instancia de sequelize

exports.getAllMotivosConsulta = async (req, res) => {
  try {
    const motivos = await CatMotivoConsultaSintomas.findAll();
    res.status(200).json(motivos);
  } catch (error) {
    console.error('Error al obtener motivos de consulta:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener motivos de consulta.' });
  }
};

exports.searchMotivosConsulta = async (req, res) => {
  const { query } = req.query;
  console.log('[catMotivoConsultaSintomasController] searchMotivosConsulta - query recibida:', query);
  
  try {
    if (!query || query.trim().length < 2) {
      console.log('[catMotivoConsultaSintomasController] Query muy corta, retornando array vacío');
      return res.status(200).json([]);
    }
    
    const searchTerm = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    console.log('[catMotivoConsultaSintomasController] Término de búsqueda procesado:', searchTerm);
    
    const motivos = await CatMotivoConsultaSintomas.findAll({
      attributes: ['Codigo', 'Motivo_Consulta_Sintoma', 'Categoria', 'Codigo_Triaje'], // Incluir 'Codigo' que es el ID
      where: {
        [Op.and]: [
          sequelize.where(
            sequelize.fn('lower', sequelize.col('Motivo_Consulta_Sintoma')),
            {
              [Op.like]: `%${searchTerm}%`
            }
          )
        ]
      },
      limit: 50, // Limitar resultados para mejor rendimiento
      order: [['Motivo_Consulta_Sintoma', 'ASC']] // Ordenar alfabéticamente
    });
    
    console.log('[catMotivoConsultaSintomasController] Motivos encontrados:', motivos.length);
    
    // Mapear Codigo a id para compatibilidad con el frontend
    const motivosFormateados = motivos.map(motivo => ({
      id: motivo.Codigo,
      Codigo: motivo.Codigo,
      Motivo_Consulta_Sintoma: motivo.Motivo_Consulta_Sintoma,
      Categoria: motivo.Categoria,
      Codigo_Triaje: motivo.Codigo_Triaje
    }));
    
    console.log('[catMotivoConsultaSintomasController] Enviando respuesta con', motivosFormateados.length, 'motivos');
    res.status(200).json(motivosFormateados);
  } catch (error) {
    console.error('[catMotivoConsultaSintomasController] Error al buscar motivos de consulta:', error);
    console.error('[catMotivoConsultaSintomasController] Stack trace:', error.stack);
    res.status(500).json({ message: 'Error interno del servidor al buscar motivos de consulta.', error: error.message });
  }
};