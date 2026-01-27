const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');
const Rol = require('../models/rol');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Generar token JWT
function generarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      cedula: usuario.cedula,
      nombres: usuario.nombres, // Añadir nombres
      apellidos: usuario.apellidos, // Añadir apellidos
      rol_id: usuario.rol_id
    },
    JWT_SECRET,
    { expiresIn: '4h' }
  );
}

// LOGIN
exports.login = async (req, res) => {
  const { cedula, contrasena } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { cedula } });
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    if (!usuario.activo) {
      return res.status(403).json({ mensaje: 'Cuenta pendiente de aprobación por el administrador' });
    }

    const valida = await usuario.validarContrasena(contrasena);
    if (!valida) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

    const token = generarToken(usuario);
    // Enviar el objeto usuario junto con el token
    res.json({
      token,
      user: {
        id: usuario.id,
        cedula: usuario.cedula,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        rol_id: usuario.rol_id
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// REGISTRO
exports.registro = async (req, res) => {
  try {
    const usuario = await Usuario.create(req.body);
    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ mensaje: 'Error al registrar usuario', error });
  }
};

// RECUPERAR CONTRASEÑA (envía email con link)
exports.recuperar = async (req, res) => {
  const { cedula, correo } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { cedula, correo } });
    if (!usuario) return res.status(404).json({ mensaje: 'Datos incorrectos' });

    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '30m' });
    const enlace = `${FRONTEND_URL}/restablecer/${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.CORREO_APP,
        pass: process.env.CORREO_PASS
      }
    });

    await transporter.sendMail({
      from: `"Sistema HC" <${process.env.CORREO_APP}>`,
      to: correo,
      subject: 'Recuperación de contraseña',
      html: `
        <p>Hola ${usuario.nombres},</p>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña. El enlace expira en 30 minutos:</p>
        <a href="${enlace}">${enlace}</a>
      `
    });

    res.status(200).json({ mensaje: 'Correo enviado correctamente' });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(500).json({ mensaje: 'Error al enviar el correo' });
  }
};

// RESTABLECER CONTRASEÑA
exports.restablecer = async (req, res) => {
  const { token } = req.params;
  const { nuevaContrasena } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = await Usuario.findByPk(decoded.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const salt = await bcrypt.genSalt(10);
    usuario.contrasena = await bcrypt.hash(nuevaContrasena, salt);
    await usuario.save();

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(400).json({ mensaje: 'Token inválido o expirado' });
  }
};
// Listar usuarios pendientes
exports.usuariosPendientes = async (req, res) => {
  try {
    const pendientes = await Usuario.findAll({ where: { activo: false } });
    res.json(pendientes);
  } catch (error) {
    console.error('Error al obtener usuarios pendientes:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios pendientes' });
  }
};

// Aprobar un usuario
exports.aprobarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    usuario.activo = req.body.activo;
    await usuario.save();

    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al aprobar usuario:', error);
    res.status(500).json({ mensaje: 'Error al aprobar usuario' });
  }
};

// Crear usuario administrador
exports.crearAdmin = async (req, res) => {
  try {
    const usuario = await Usuario.create({
      ...req.body,
      rol_id: 1, // Rol de administrador
      activo: true
    });
    res.status(201).json({ mensaje: 'Usuario administrador creado correctamente' });
  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
    res.status(500).json({ mensaje: 'Error al crear usuario administrador', error });
  }
};

exports.buscarPacientePorIdentificacion = async (req, res) => {
  const { numeroIdentificacion } = req.params;
  try {
    const paciente = await Usuario.findOne({
      where: { cedula: numeroIdentificacion },
      attributes: ['nombres', 'apellidos', 'sexo', 'correo', 'fecha_nacimiento']
    });

    if (paciente) {
      return res.status(200).json(paciente);
    } else {
      return res.status(404).json({ message: 'Paciente no encontrado.' });
    }
  } catch (error) {
    console.error('Error al buscar paciente por identificación:', error);
    return res.status(500).json({ message: 'Error interno del servidor al buscar paciente.' });
  }
};

// Asignar rol de administrador
exports.asignarAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    
    usuario.rol_id = req.body.rol_id;
    await usuario.save();
  
    res.json({ mensaje: 'Rol de administrador asignado correctamente' });
  } catch (error) {
    console.error('Error al asignar rol de administrador:', error);
    res.status(500).json({ mensaje: 'Error al asignar rol de administrador', error });
  }
};

// Obtener todos los usuarios
exports.getAllUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener todos los usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener todos los usuarios', error });
  }
};

// Obtener todos los roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll();
    res.json(roles);
  } catch (error) {
    console.error('Error al obtener todos los roles:', error);
    res.status(500).json({ mensaje: 'Error al obtener todos los roles', error });
  }
};

// CAMBIAR CONTRASEÑA (para usuario logueado)
exports.cambiarContrasena = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId; // Obtenido del token validado

  try {
    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Verificar la contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, usuario.contrasena);
    if (!isMatch) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    usuario.contrasena = await bcrypt.hash(newPassword, salt);
    await usuario.save();

    res.status(200).json({ message: 'Contraseña cambiada exitosamente.' });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor al cambiar la contraseña.' });
  }
};
