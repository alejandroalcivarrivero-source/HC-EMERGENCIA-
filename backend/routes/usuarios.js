const express = require('express');
const router = express.Router();
const multer = require('multer'); // Importar multer
const authController = require('../controllers/authController');
const usuariosController = require('../controllers/usuariosController'); // Importar el objeto completo
const validarToken = require('../middlewares/validarToken'); // Asumo que existe o lo crearé
const verifyRole = require('../middlewares/verifyRole');
const ubicacionesController = require('../controllers/ubicacionesController');

// Configurar multer para carga de archivo de firma (memoria)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/x-pkcs12' ||
        file.originalname.endsWith('.p12') ||
        file.originalname.endsWith('.pfx')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .p12 o .pfx'));
    }
  }
});

// Login
router.post('/login', authController.login);

// Validar firma para autocompletado en registro (público)
router.post('/validar-firma-registro', upload.single('p12'), authController.validarFirmaRegistro);

// Registro (soporta carga de firma digital)
router.post('/registro', upload.single('p12'), authController.registro);

// Recuperar contraseña (envía email con enlace)
router.post('/recuperar', authController.recuperar);

// Restablecer contraseña (desde token)
router.post('/restablecer/:token', authController.restablecer);

// Ruta para desbloqueo híbrido (Zimbra OTP o Firma Digital)
router.post('/desbloquear', upload.single('p12'), authController.desbloquearCuenta);

// Ruta para cambiar contraseña (autenticado)
router.post('/cambiar-contrasena', validarToken, authController.cambiarContrasena);

// Nuevas rutas para aprobación de usuarios
router.get('/pendientes', validarToken, verifyRole(6), authController.usuariosPendientes);
router.put('/aprobar/:id', validarToken, verifyRole(6), authController.aprobarUsuario);

// Crear usuario administrador (Solo TI puede crear admins ahora)
router.post('/admin', validarToken, verifyRole(6), authController.crearAdmin);

// Asignar rol de administrador
router.put('/asignarAdmin/:id', validarToken, verifyRole(6), authController.asignarAdmin);

// Aprobar usuario
router.put('/aprobarUsuario/:id', validarToken, verifyRole(6), authController.aprobarUsuario);

// Obtener todos los usuarios
router.get('/', validarToken, verifyRole(6), authController.getAllUsuarios);

// Obtener todos los roles
router.get('/roles', validarToken, verifyRole(6), authController.getAllRoles);

// Nueva ruta pública para obtener roles para el registro
router.get('/public-roles', usuariosController.obtenerRoles);

// Rutas para obtener ubicaciones
router.get('/provincias', ubicacionesController.obtenerProvincias);
router.get('/cantones/:provinciaId', ubicacionesController.obtenerCantones);
router.get('/parroquias/:cantonId', ubicacionesController.obtenerParroquias);

// Ruta para buscar paciente por número de identificación
router.get('/buscarPaciente/:numeroIdentificacion', usuariosController.buscarPacientePorIdentificacion); // Usar usuariosController

// Rutas para catálogos de admisión
router.get('/paisesResidencia', ubicacionesController.obtenerPaisesResidencia); // Ruta para obtener países de residencia
router.get('/tiposIdentificacion', usuariosController.obtenerTiposIdentificacion);
router.get('/estadosCiviles', usuariosController.obtenerEstadosCiviles);
router.get('/sexos', usuariosController.obtenerSexos);
router.get('/nacionalidades', usuariosController.obtenerNacionalidades);
router.get('/autoidentificacionesEtnicas', usuariosController.obtenerAutoidentificacionesEtnicas);
router.get('/nacionalidadesPueblos', usuariosController.obtenerNacionalidadesPueblos);
router.get('/pueblosKichwa', usuariosController.obtenerPueblosKichwa);
router.get('/nivelesEducacion', usuariosController.obtenerNivelesEducacion);
router.get('/gradosNivelesEducacion', usuariosController.obtenerGradosNivelesEducacion);
router.get('/tiposEmpresaTrabajo', usuariosController.obtenerTiposEmpresaTrabajo);
router.get('/ocupacionesProfesiones', usuariosController.obtenerOcupacionesProfesiones);
router.get('/segurosSalud', usuariosController.obtenerSegurosSalud);
router.get('/tiposBono', usuariosController.obtenerTiposBono);
router.get('/tieneDiscapacidades', usuariosController.obtenerTieneDiscapacidades);
router.get('/tiposDiscapacidad', usuariosController.obtenerTiposDiscapacidad);
router.get('/parentescosContacto', usuariosController.obtenerParentescosContacto);
router.get('/formasLlegada', usuariosController.obtenerFormasLlegada);
router.get('/fuentesInformacion', usuariosController.obtenerFuentesInformacion);

// Ruta para crear un registro completo de admisión
router.post('/admision', usuariosController.crearRegistroAdmision);

// Rutas para Signos Vitales
router.get('/admisiones-activas', validarToken, usuariosController.obtenerAdmisionesActivas); // Nueva ruta para todas las admisiones activas
// router.get('/pacientes-con-signos', usuariosController.obtenerPacientesConSignosVitales); // Eliminada, ya no es necesaria
// router.post('/signos-vitales', usuariosController.guardarSignosVitales); // Esta ruta se moverá a signosVitales.js

// Ruta para obtener una admisión por su ID
router.get('/admisiones/:admisionId', validarToken, usuariosController.obtenerAdmisionPorId); // Proteger con token

// Ruta para obtener un paciente por su ID (nueva)
router.get('/pacientes/:id', validarToken, usuariosController.obtenerPacientePorId);

// Ruta para actualizar un paciente por ID
router.put('/pacientes/:id', validarToken, usuariosController.actualizarPaciente); // Proteger con token

// Ruta para eliminar un paciente por ID
router.delete('/pacientes/:id', usuariosController.eliminarPaciente);

// Ruta para cambiar contraseña de usuario logueado
router.post('/cambiar-contrasena', validarToken, authController.cambiarContrasena); // Nueva ruta

// Verificar si un usuario ya existe por cédula (público para registro proactivo)
router.get('/verificar/:cedula', authController.verificarUsuario);

module.exports = router;
