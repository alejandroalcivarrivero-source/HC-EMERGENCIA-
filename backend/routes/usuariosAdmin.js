const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validarToken = require('../middlewares/validarToken');
const verifyRole = require('../middlewares/verifyRole');
const Usuario = require('../models/usuario');
const Rol = require('../models/rol');
const LogCorreo = require('../models/LogCorreo');
const transporter = require('../config/mailer');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Todas las rutas requieren token y ser Soporte TI (Rol 6)
router.use(validarToken);

// Endpoint para contar administradores/soporte (Roles 5 y 6)
router.get('/count', verifyRole([5, 6]), async (req, res) => {
    try {
        const count = await Usuario.count({
            where: { rol_id: [5, 6] }
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al contar administradores', error: error.message });
    }
});

router.use(verifyRole(6));

// Listar todos los usuarios con sus roles
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        console.log(`GET /api/usuarios-admin - Búsqueda: "${search || 'NINGUNA'}"`);

        const whereClause = {};
        if (search) {
            whereClause[Op.or] = [
                { nombres: { [Op.like]: `%${search}%` } },
                { apellidos: { [Op.like]: `%${search}%` } },
                { cedula: { [Op.like]: `%${search}%` } },
                { correo: { [Op.like]: `%${search}%` } },
            ];
        }

        const usuarios = await Usuario.findAll({
            where: whereClause,
            include: [{ model: Rol }],
            attributes: { exclude: ['contrasena', 'password'] },
        });
        
        console.log(`GET /api/usuarios-admin - ${usuarios.length} usuarios encontrados`);
        res.json(usuarios);
    } catch (error) {
        console.error('ERROR en GET /api/usuarios-admin:', error);
        res.status(500).json({
            mensaje: 'Error al obtener usuarios',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});

// Resetear contraseña
router.post('/reset-password/:id', async (req, res) => {
    try {
        const { nuevaContrasena } = req.body;
        if (!nuevaContrasena) return res.status(400).json({ mensaje: 'Nueva contraseña requerida' });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nuevaContrasena, salt);
        
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

        // El campo en el modelo es 'contrasena', no 'password'
        await usuario.update({ contrasena: hashedPassword, estado_cuenta: 'ACTIVO', intentos_fallidos: 0 });

        // Intentar enviar correo informativo
        try {
            await transporter.sendMail({
                from: `"Soporte SIGEMECH" <sistema@sigemech.local>`,
                to: usuario.correo,
                subject: 'Restablecimiento de Contraseña - SIGEMECH',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #2563eb;">Su contraseña ha sido restablecida</h2>
                        <p>Hola <b>${usuario.nombres}</b>,</p>
                        <p>Un administrador ha restablecido su contraseña de acceso al sistema SIGEMECH.</p>
                        <p>Su nueva contraseña temporal es: <b style="font-size: 18px; color: #1e40af;">${nuevaContrasena}</b></p>
                        <p>Se recomienda cambiar esta contraseña al iniciar sesión.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #6b7280;">Si usted no solicitó este cambio, por favor contacte a Soporte TI inmediatamente.</p>
                    </div>
                `
            });

            // Registrar log de correo enviado
            await LogCorreo.create({
                correo_destino: usuario.correo,
                tipo: 'RESET_PASSWORD_ADMIN',
                estado: 'ENVIADO',
                cedula_asociada: usuario.cedula
            });
        } catch (mailError) {
            console.error('Error al enviar correo de reset:', mailError);
            // Registrar log de correo fallido
            await LogCorreo.create({
                correo_destino: usuario.correo,
                tipo: 'RESET_PASSWORD_ADMIN',
                estado: 'FALLIDO',
                error_mensaje: mailError.message,
                cedula_asociada: usuario.cedula
            });
        }

        res.json({ mensaje: 'Contraseña actualizada y correo enviado correctamente' });
    } catch (error) {
        console.error('ERROR en POST /reset-password:', error);
        res.status(500).json({ mensaje: 'Error al resetear contraseña', error: error.message });
    }
});

// Cambiar rol
router.put('/cambiar-rol/:id', async (req, res) => {
    try {
        const { id_rol } = req.body;
        // El campo en el modelo es 'rol_id', no 'id_rol'
        await Usuario.update({ rol_id: id_rol }, { where: { id: req.params.id } });
        res.json({ mensaje: 'Rol actualizado correctamente' });
    } catch (error) {
        console.error('ERROR en PUT /cambiar-rol:', error);
        res.status(500).json({ mensaje: 'Error al cambiar rol', error: error.message });
    }
});

// Editar correo electrónico específicamente
router.put('/editar-correo/:id', async (req, res) => {
    try {
        const { correo } = req.body;
        if (!correo) return res.status(400).json({ mensaje: 'Correo electrónico es requerido' });
        
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

        await usuario.update({ correo });
        res.json({ mensaje: 'Correo electrónico actualizado correctamente' });
    } catch (error) {
        console.error('ERROR en PUT /editar-correo:', error);
        res.status(500).json({ mensaje: 'Error al actualizar correo', error: error.message });
    }
});

// Bloquear/Activar cuenta
router.put('/estado/:id', async (req, res) => {
    try {
        const { activo } = req.body;
        await Usuario.update({ activo }, { where: { id: req.params.id } });
        res.json({ mensaje: `Usuario ${activo ? 'activado' : 'bloqueado'} correctamente` });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cambiar estado', error: error.message });
    }
});

module.exports = router;
