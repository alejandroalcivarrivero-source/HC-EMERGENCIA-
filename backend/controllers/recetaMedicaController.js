const RecetaMedica = require('../models/recetaMedica');
const Admision = require('../models/admisiones');
const Usuario = require('../models/usuario');
const bcrypt = require('bcryptjs'); // Para verificar la firma electrónica (contraseña)

exports.createRecetaMedica = async (req, res) => {
  const { admisionId, medicamentos, observaciones, firmaElectronica } = req.body;
  const usuarioId = req.userId; // El ID del usuario se adjunta a req.userId en el middleware validarToken

  try {
    // Verificar si la admisión existe
    const admision = await Admision.findByPk(admisionId);
    if (!admision) {
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }

    // Verificar la firma electrónica
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(firmaElectronica, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Firma electrónica inválida.' });
    }

    // Generar correlativo: REC-[admisionId]-[count+1]
    const count = await RecetaMedica.count({ where: { admisionId } });
    const correlativo = `REC-${admisionId}-${count + 1}`;

    const recetaMedica = await RecetaMedica.create({
      admisionId,
      usuarioId,
      correlativo,
      medicamentos: JSON.stringify(medicamentos), // Guardar como JSON string
      observaciones,
      firmaElectronica: 'VALIDADA' // O un hash de la firma real si se implementa un sistema más robusto
    });

    res.status(201).json(recetaMedica);
  } catch (error) {
    console.error('Error al crear la receta médica:', error);
    res.status(500).json({ message: 'Error al crear la receta médica.', error: error.message });
  }
};

exports.getRecetasMedicasByAdmision = async (req, res) => {
  const { admisionId } = req.params;

  try {
    const recetasMedicas = await RecetaMedica.findAll({
      where: { admisionId },
      include: [
        { model: Admision, as: 'Admision', attributes: ['id', 'fecha_hora_admision'] },
        { model: Usuario, as: 'Usuario', attributes: ['nombre_completo', 'rolId'] }
      ],
      order: [['fechaEmision', 'DESC']]
    });

    // Parsear los campos JSON antes de enviar la respuesta
    const parsedRecetas = recetasMedicas.map(receta => ({
      ...receta.toJSON(),
      medicamentos: JSON.parse(receta.medicamentos)
    }));

    res.status(200).json(parsedRecetas);
  } catch (error) {
    console.error('Error al obtener las recetas médicas:', error);
    res.status(500).json({ message: 'Error al obtener las recetas médicas.', error: error.message });
  }
};

exports.updateRecetaMedica = async (req, res) => {
  const { id } = req.params;
  const { medicamentos, observaciones, firmaElectronica } = req.body;
  const usuarioId = req.userId;

  try {
    const recetaMedica = await RecetaMedica.findByPk(id);
    if (!recetaMedica) {
      return res.status(404).json({ message: 'Receta médica no encontrada.' });
    }

    // Verificar la firma electrónica para la actualización
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(firmaElectronica, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Firma electrónica inválida.' });
    }

    recetaMedica.medicamentos = medicamentos !== undefined ? JSON.stringify(medicamentos) : recetaMedica.medicamentos;
    recetaMedica.observaciones = observaciones !== undefined ? observaciones : recetaMedica.observaciones;
    recetaMedica.firmaElectronica = 'VALIDADA'; // Actualizar la firma al validar

    await recetaMedica.save();
    res.status(200).json(recetaMedica);
  } catch (error) {
    console.error('Error al actualizar la receta médica:', error);
    res.status(500).json({ message: 'Error al actualizar la receta médica.', error: error.message });
  }
};

exports.deleteRecetaMedica = async (req, res) => {
  const { id } = req.params;
  const { firmaElectronica } = req.body; // Se requiere firma para eliminar
  const usuarioId = req.userId;

  try {
    const recetaMedica = await RecetaMedica.findByPk(id);
    if (!recetaMedica) {
      return res.status(404).json({ message: 'Receta médica no encontrada.' });
    }

    // Verificar la firma electrónica para la eliminación
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(firmaElectronica, usuario.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Firma electrónica inválida.' });
    }

    await recetaMedica.destroy();
    res.status(204).json({ message: 'Receta médica eliminada exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar la receta médica:', error);
    res.status(500).json({ message: 'Error al eliminar la receta médica.', error: error.message });
  }
};