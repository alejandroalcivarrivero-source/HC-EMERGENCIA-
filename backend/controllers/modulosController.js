const { UsuarioModulo, Modulo, Usuario } = require('../models');

exports.getModulosPorUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const usuario = await Usuario.findByPk(usuario_id, {
            include: [{ model: Modulo, through: { attributes: ['activo'] } }],
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const todosLosModulos = await Modulo.findAll();
        const modulosActivos = usuario.Modulos.reduce((acc, modulo) => {
            acc[modulo.modulo_id] = modulo.UsuarioModulo.activo;
            return acc;
        }, {});

        const resultado = todosLosModulos.map(modulo => ({
            modulo_id: modulo.modulo_id,
            nombre_modulo: modulo.nombre_modulo,
            descripcion: modulo.descripcion,
            activo: modulosActivos[modulo.modulo_id] || false,
        }));

        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error al obtener los módulos del usuario:', error);
        res.status(500).json({ message: 'Error al obtener los módulos del usuario.' });
    }
};

exports.actualizarModulosUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const { modulos } = req.body; // Se espera un array de objetos: [{ modulo_id: 1, activo: true }, ...]

        for (const moduloData of modulos) {
            const { modulo_id, activo } = moduloData;

            let usuarioModulo = await UsuarioModulo.findOne({
                where: { usuario_id, modulo_id },
            });

            if (usuarioModulo) {
                usuarioModulo.activo = activo;
                await usuarioModulo.save();
            } else if (activo) {
                await UsuarioModulo.create({
                    usuario_id,
                    modulo_id,
                    activo: true,
                });
            }
        }

        res.status(200).json({ message: 'Módulos del usuario actualizados correctamente.' });
    } catch (error) {
        console.error('Error al actualizar los módulos del usuario:', error);
        res.status(500).json({ message: 'Error al actualizar los módulos del usuario.' });
    }
};