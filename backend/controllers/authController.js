const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');
const Rol = require('../models/rol');
const LogCorreo = require('../models/LogCorreo');
const LogIntentoCedula = require('../models/LogIntentoCedula');
const { extraerMetadatos, validarCertificadoBuffer } = require('../utils/p12Metadatos');
const { encrypt, decrypt } = require('../utils/cryptoFirma');
const bcrypt = require('bcryptjs');
const transporter = require('../config/mailer');
const { validarCedulaEcuador } = require('../utils/validaciones');

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
    if (!usuario) {
      // Registrar intento con cédula no encontrada
      await LogIntentoCedula.create({
        cedula: cedula,
        tipo_accion: 'LOGIN_FALLIDO',
        exitoso: false,
        ip_address: req.ip
      });
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Verificar si la cuenta está bloqueada
    if (usuario.estado_cuenta === 'BLOQUEADO') {
      return res.status(403).json({
        mensaje: 'Tu cuenta ha sido bloqueada por seguridad debido a múltiples intentos fallidos. Contacta al administrador.'
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({ mensaje: 'Cuenta pendiente de aprobación por el administrador' });
    }

    const valida = await usuario.validarContrasena(contrasena);
    
    if (!valida) {
      // Incrementar intentos fallidos
      const nuevosIntentos = usuario.intentos_fallidos + 1;
      let updateData = { intentos_fallidos: nuevosIntentos };

      // Bloquear si llega a 5
      if (nuevosIntentos >= 5) {
        updateData.estado_cuenta = 'BLOQUEADO';
        updateData.ultimo_bloqueo = new Date();
      }

      // Registrar intento fallido
      await LogIntentoCedula.create({
        cedula: usuario.cedula,
        tipo_accion: 'LOGIN_FALLIDO',
        exitoso: false,
        ip_address: req.ip
      });

      await usuario.update(updateData);

      if (nuevosIntentos >= 5) {
        return res.status(403).json({
          mensaje: 'Has alcanzado el límite de intentos. Tu cuenta ha sido bloqueada.'
        });
      }

      return res.status(401).json({
        mensaje: `Contraseña incorrecta. Intentos restantes: ${5 - nuevosIntentos}`
      });
    }

    // Login exitoso: Resetear intentos fallidos
    if (usuario.intentos_fallidos > 0) {
      await usuario.update({ intentos_fallidos: 0 });
    }

    // Login exitoso: Resetear intentos fallidos
    if (usuario.intentos_fallidos > 0) {
      await usuario.update({ intentos_fallidos: 0 });
    }

    // Registrar login exitoso
    await LogIntentoCedula.create({
      cedula: usuario.cedula,
      tipo_accion: 'LOGIN_EXITOSO',
      exitoso: true,
      ip_address: req.ip
    });

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
    let userData = { ...req.body };

    // Validar cédula ecuatoriana
    if (!validarCedulaEcuador(userData.cedula)) {
      return res.status(400).json({ message: 'El número de cédula ingresado no es válido para Ecuador.' });
    }

    // Validar sexo (Estandarización)
    if (!userData.sexo || !['Hombre', 'Mujer'].includes(userData.sexo)) {
      return res.status(400).json({ message: 'El campo sexo debe ser "Hombre" o "Mujer".' });
    }

    // Validar y concatenar dominio institucional al correo/usuario
    const dominioInstitucional = '@13d07.mspz4.gob.ec';
    if (!userData.correo) {
      return res.status(400).json({ message: 'El correo electrónico es obligatorio.' });
    }

    // Si el usuario ya ingresó el dominio, lo limpiamos para evitar duplicados y luego lo concatenamos
    let correoLimpio = userData.correo.split('@')[0];
    userData.correo = `${correoLimpio}${dominioInstitucional}`;

    // 1. Verificar duplicados (Validación explícita)
    const existingUser = await Usuario.findOne({ where: { cedula: userData.cedula } });
    if (existingUser) {
      return res.status(400).json({ message: 'El número de cédula ya se encuentra registrado en el sistema.' });
    }

    // Validación y procesamiento de archivo .p12 (si se envió)
    if (req.file) {
      const passwordFirma = req.body.password_firma;
      if (!passwordFirma) {
        return res.status(400).json({ message: 'Debe proporcionar la contraseña del certificado para validarlo.' });
      }

      try {
        // 2. Validar y extraer metadatos
        const meta = extraerMetadatos(req.file.buffer, passwordFirma);
        
        // 3. Validar consistencia (si el usuario ingresó cédula manual)
        if (userData.cedula && userData.cedula !== meta.ci) {
          return res.status(400).json({
            message: `La cédula ingresada (${userData.cedula}) no coincide con la del certificado (${meta.ci}).`
          });
        }
        
        // Forzar la cédula del certificado para evitar errores humanos
        userData.cedula = meta.ci;

        // Intentar autocompletar nombres/apellidos si están vacíos
        if (!userData.nombres || !userData.apellidos) {
            const partes = meta.nombre.split(' ');
            if (partes.length >= 4) {
                if (!userData.nombres) userData.nombres = partes.slice(0, 2).join(' ');
                if (!userData.apellidos) userData.apellidos = partes.slice(2).join(' ');
            } else if (partes.length >= 2) {
                if (!userData.nombres) userData.nombres = partes[0];
                if (!userData.apellidos) userData.apellidos = partes.slice(1).join(' ');
            }
        }

        // 4. Cifrar archivo y preparar datos para USUARIOS_SISTEMA
        // NOTA: Guardamos el archivo cifrado completo en firma_p12
        const { cipher, iv } = encrypt(req.file.buffer);
        
        // Concatenamos IV + Ciphertext (que ya incluye el AuthTag) para almacenamiento único
        const p12Blob = Buffer.concat([iv, cipher]);
        
        userData.firma_p12 = p12Blob;
        userData.firma_configurada = true;
        userData.firma_vencimiento = meta.fechaExpiracion;
        userData.firma_serial = meta.serialNumber || 'SN-NO-DISPONIBLE'; // Asegurar valor

      } catch (err) {
        return res.status(400).json({ message: 'Error al procesar el archivo de firma: ' + err.message });
      }
    }

    // Crear Usuario con los datos de firma integrados
    const usuario = await Usuario.create(userData);

    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ mensaje: 'Error al registrar usuario', error: error.message || error });
  }
};

// Validar firma para registro (Autocompletado)
exports.validarFirmaRegistro = async (req, res) => {
  try {
    if (!req.file || !req.body.password_firma) {
      return res.status(400).json({ message: 'Debe enviar el archivo .p12 y la contraseña.' });
    }
    
    const meta = extraerMetadatos(req.file.buffer, req.body.password_firma);
    
    // Intentar separar nombres y apellidos de la cadena completa "APELLIDOS NOMBRES"
    const partes = meta.nombre.trim().split(/\s+/);
    let nombres = '';
    let apellidos = '';
    
    // CORRECCIÓN SOLICITADA: El formato es NOMBRE1 NOMBRE2 APELLIDO1 APELLIDO2
    // Asegurar que ANDRES ALEJANDRO vaya a Nombres y ALCIVAR RIVERO a Apellidos
    if (partes.length >= 4) {
        nombres = partes.slice(0, 2).join(' ');
        apellidos = partes.slice(2).join(' ');
    } else if (partes.length === 3) {
        // Caso ambiguo: Nombre Apellido1 Apellido2 ó Nombre1 Nombre2 Apellido
        // Asumiremos Nombre Apellido1 Apellido2 por ser más común en registros
        nombres = partes[0];
        apellidos = partes.slice(1).join(' ');
    } else if (partes.length === 2) {
        nombres = partes[0];
        apellidos = partes[1];
    } else {
        nombres = meta.nombre; // Fallback
    }

    // Mapeo y validación estricta de sexo
    let sexoFinal = '';
    if (meta.sexo) {
        if (['Hombre', 'Mujer'].includes(meta.sexo)) {
            sexoFinal = meta.sexo;
        } else {
            // Si viene algo raro del certificado, lanzamos error para corrección manual
            return res.status(400).json({
                message: 'El sexo detectado en el certificado no es válido. Por favor, realice el registro de forma manual o corrija su certificado.',
                error: 'Validación de Sexo fallida'
            });
        }
    }

    res.json({
      cedula: meta.ci,
      nombres: nombres.toUpperCase(),
      apellidos: apellidos.toUpperCase(),
      nombreCompleto: meta.nombre,
      sexo: sexoFinal
    });

  } catch (error) {
    res.status(400).json({ message: 'Error al leer el certificado: ' + error.message });
  }
};

// RECUPERAR CONTRASEÑA (envía email con link y código OTP para desbloqueo)
exports.recuperar = async (req, res) => {
  const { cedula, correo } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { cedula, correo } });
    if (!usuario) {
      // Registrar intento fallido de recuperación
      await LogIntentoCedula.create({
        cedula: cedula,
        tipo_accion: 'RECUPERACION_FALLIDA',
        exitoso: false,
        ip_address: req.ip
      });
      return res.status(404).json({ mensaje: 'Datos incorrectos' });
    }

    // Generar OTP de 6 dígitos para desbloqueo
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // El token contendrá el OTP para validación posterior sin guardarlo en DB
    const token = jwt.sign({ id: usuario.id, otp }, JWT_SECRET, { expiresIn: '30m' });
    const enlace = `${FRONTEND_URL}/restablecer/${token}`;

    try {
      await transporter.sendMail({
      from: `"Sistema HC" <sistema@sigemech.local>`,
      to: correo,
      subject: 'Recuperación de contraseña y Desbloqueo de Cuenta',
      html: `
        <p>Hola ${usuario.nombres},</p>
        <p>Tu código de desbloqueo de 6 dígitos es: <b>${otp}</b></p>
        <p>O si prefieres restablecer tu contraseña, haz clic en el siguiente enlace (expira en 30 minutos):</p>
        <a href="${enlace}">${enlace}</a>
      `
      });

      // Registrar log de correo enviado
      await LogCorreo.create({
        correo_destino: correo,
        tipo: 'OTP_RECUPERACION',
        estado: 'ENVIADO',
        cedula_asociada: usuario.cedula
      });
    } catch (mailError) {
      console.error('Error al enviar correo (nodemailer):', mailError);
      // Registrar log de correo fallido
      await LogCorreo.create({
        correo_destino: correo,
        tipo: 'OTP_RECUPERACION',
        estado: 'FALLIDO',
        error_mensaje: mailError.message,
        cedula_asociada: usuario.cedula
      });
      throw mailError; // Re-lanzar para el catch general
    }

    // Devolvemos el token_otp para que el frontend lo use en el endpoint de desbloqueo
    res.status(200).json({
      mensaje: 'Se ha enviado un código y un enlace a tu correo institucional.',
      token_otp: token
    });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(500).json({ mensaje: 'Error al enviar el correo' });
  }
};

// VALIDAR FIRMA PARA RECUPERACIÓN (Método A)
exports.validarFirmaRecuperacion = async (req, res) => {
    const { cedula, password_firma } = req.body;
    try {
        if (!req.file || !password_firma || !cedula) {
            return res.status(400).json({ message: 'Datos incompletos.' });
        }
        
        const usuario = await Usuario.findOne({ where: { cedula } });
        if (!usuario) return res.status(404).json({ message: 'Usuario no registrado con esa cédula.' });

        const meta = extraerMetadatos(req.file.buffer, password_firma);
        if (meta.ci !== cedula) {
            return res.status(400).json({ message: 'La firma no corresponde a la cédula ingresada.' });
        }

        res.json({ message: 'Identidad validada.', cedula: usuario.cedula });
    } catch (error) {
        res.status(400).json({ message: 'Error al validar la firma: ' + error.message });
    }
};

// SOLICITAR OTP (Método B - Zimbra)
exports.solicitarOtpRecuperacion = async (req, res) => {
    const { cedula, correo } = req.body;
    try {
        const usuario = await Usuario.findOne({ where: { cedula, correo } });
        if (!usuario) return res.status(404).json({ mensaje: 'Datos incorrectos. Asegúrese de usar su correo institucional.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const token = jwt.sign({ id: usuario.id, otp }, JWT_SECRET, { expiresIn: '15m' });

        await transporter.sendMail({
            from: `"Soporte SIGEMECH" <sistema@sigemech.local>`,
            to: correo,
            subject: 'Código de Recuperación de Contraseña',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #2563eb;">Recuperación de Contraseña</h2>
                    <p>Hola <b>${usuario.nombres}</b>,</p>
                    <p>Su código de verificación para resetear su clave es:</p>
                    <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-bold; letter-spacing: 5px; color: #1e40af; border-radius: 5px;">
                        ${otp}
                    </div>
                    <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">Este código expira en 15 minutos.</p>
                </div>
            `
        });

        res.json({ mensaje: 'Código enviado.', token_otp: token });
    } catch (error) {
        console.error('Error al enviar OTP:', error);
        res.status(500).json({ mensaje: 'Error al conectar con el servidor de correo.' });
    }
};

// VALIDAR OTP RECUPERACIÓN
exports.validarOtpRecuperacion = async (req, res) => {
    const { cedula, otp, token_otp } = req.body;
    try {
        const usuario = await Usuario.findOne({ where: { cedula } });
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const decoded = jwt.verify(token_otp, JWT_SECRET);
        if (decoded.id === usuario.id && decoded.otp === otp) {
            return res.json({ message: 'Código verificado.' });
        }
        res.status(400).json({ message: 'El código es incorrecto o ha expirado.' });
    } catch (err) {
        res.status(400).json({ message: 'Sesión de recuperación expirada.' });
    }
};

// RESET PASSWORD FINAL
exports.resetPasswordFinal = async (req, res) => {
    const { cedula, nuevaClave } = req.body;
    try {
        const usuario = await Usuario.findOne({ where: { cedula } });
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

        usuario.contrasena = nuevaClave; // El modelo debe tener un hook beforeSave para hashear
        usuario.estado_cuenta = 'ACTIVO';
        usuario.intentos_fallidos = 0;
        await usuario.save();

        res.json({ message: 'Contraseña actualizada correctamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar la contraseña.' });
    }
};

// DESBLOQUEO HÍBRIDO (Zimbra OTP o Firma Digital)
exports.desbloquearCuenta = async (req, res) => {
  const { cedula, otp, password_firma, token_otp } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { cedula } });
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

    let validado = false;

    // Opción A: Validación por OTP (Zimbra)
    if (otp && token_otp) {
      try {
        const decoded = jwt.verify(token_otp, JWT_SECRET);
        if (decoded.id === usuario.id && decoded.otp === otp) {
          validado = true;
        }
      } catch (err) {
        return res.status(400).json({ message: 'El código OTP ha expirado o es inválido.' });
      }
    }
    // Opción B: Validación por Firma .p12 (Archivo subido en la petición)
    else if (req.file && password_firma) {
        try {
            const meta = extraerMetadatos(req.file.buffer, password_firma);
            if (meta.ci === usuario.cedula) {
                validado = true;
            } else {
                return res.status(400).json({ message: 'La firma no corresponde al usuario.' });
            }
        } catch (err) {
            return res.status(400).json({ message: 'Error al validar la firma: ' + err.message });
        }
    }
    // Opción C: Validación por Firma .p12 (Archivo ya guardado en DB)
    else if (usuario.firma_p12 && password_firma) {
        try {
            const iv = usuario.firma_p12.slice(0, 16);
            const cipher = usuario.firma_p12.slice(16);
            const decryptedP12 = decrypt(cipher, iv);
            
            const meta = extraerMetadatos(decryptedP12, password_firma);
            if (meta.ci === usuario.cedula) {
                validado = true;
            }
        } catch (err) {
            return res.status(400).json({ message: 'Contraseña de firma incorrecta o error de validación.' });
        }
    }

    if (validado) {
      await usuario.update({
        estado_cuenta: 'ACTIVO',
        intentos_fallidos: 0,
        ultimo_bloqueo: null
      });
      return res.json({ mensaje: 'Cuenta desbloqueada correctamente. Ya puedes iniciar sesión.' });
    }

    res.status(400).json({ message: 'No se pudo validar la identidad para el desbloqueo. Verifique sus datos.' });

  } catch (error) {
    console.error('Error en desbloqueo:', error);
    res.status(500).json({ message: 'Error del servidor al procesar el desbloqueo' });
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

exports.verificarUsuario = async (req, res) => {
  const { cedula } = req.params;
  try {
    const usuario = await Usuario.findOne({ where: { cedula } });
    if (usuario) {
      return res.status(200).json({ existe: true, mensaje: 'Usuario ya registrado' });
    }
    return res.status(200).json({ existe: false });
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    res.status(500).json({ mensaje: 'Error al verificar disponibilidad de cédula' });
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

// CAMBIAR CONTRASEÑA (para usuario logueado con validaciones extras)
exports.cambiarContrasena = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.usuario ? req.usuario.id : req.userId; // Compatibilidad con diferentes middlewares

  try {
    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // 1. Validar la contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, usuario.contrasena);
    if (!isMatch) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
    }

    // 2. Validar que la nueva contraseña no sea igual a la anterior
    const isSameAsOld = await bcrypt.compare(newPassword, usuario.contrasena);
    if (isSameAsOld) {
      return res.status(400).json({ message: 'La nueva contraseña no puede ser igual a la anterior.' });
    }

    // 3. Hashear y guardar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    usuario.contrasena = await bcrypt.hash(newPassword, salt);
    await usuario.save();

    res.status(200).json({ message: 'Contraseña actualizada correctamente.' });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor al cambiar la contraseña.' });
  }
};
