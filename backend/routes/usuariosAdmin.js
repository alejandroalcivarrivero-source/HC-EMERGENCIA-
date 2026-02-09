const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validarToken = require('../middlewares/validarToken');
const verifyRole = require('../middlewares/verifyRole');
const Usuario = require('../models/usuario');
const Rol = require('../models/rol');
const bcrypt = require('bcryptjs');

// Todas las rutas requieren token y ser Soporte TI (Rol 6)
router.use(validarToken);
router.use(verifyRole(6));

// Listar todos los usuarios con sus roles
router.get('/', async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            include: [{ model: Rol, as: 'rol_usuario' }],
            attributes: { exclude: ['password'] }
        });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios', error: error.message });
    }
});

// Resetear contraseña
router.post('/reset-password/:id', async (req, res) => {
    try {
        const { nuevaContrasena } = req.body;
        if (!nuevaContrasena) return res.status(400).json({ mensaje: 'Nueva contraseña requerida' });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nuevaContrasena, salt);
        
        await Usuario.update({ password: hashedPassword }, { where: { id: req.params.id } });
        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al resetear contraseña', error: error.message });
    }
});

// Cambiar rol
router.put('/cambiar-rol/:id', async (req, res) => {
    try {
        const { id_rol } = req.body;
        await Usuario.update({ id_rol }, { where: { id: req.params.id } });
        res.json({ mensaje: 'Rol actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cambiar rol', error: error.message });
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
