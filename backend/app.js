const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const Provincia = require('./models/provincia');
const Canton = require('./models/canton');
const Parroquia = require('./models/parroquia');
const Admisiones = require('./models/admisiones');
const CatAutoidentificacionEtnica = require('./models/cat_autoidentificacion_etnica');
const CatEstadosCiviles = require('./models/cat_estados_civiles');
const CatFormasLlegada = require('./models/cat_formas_llegada');
const CatFuentesInformacion = require('./models/cat_fuentes_informacion');
const CatGradosNivelesEducacion = require('./models/cat_grados_niveles_educacion');
const CatNacionalidades = require('./models/cat_nacionalidades');
const CatNacionalidadesPueblos = require('./models/cat_nacionalidades_pueblos');
const CatNivelesEducacion = require('./models/cat_niveles_educacion');
const CatOcupacionesProfesiones = require('./models/cat_ocupaciones_profesiones');
const CatParentescos = require('./models/cat_parentescos');
const CatPueblosKichwa = require('./models/cat_pueblos_kichwa');
const CatSegurosSalud = require('./models/cat_seguros_salud');
const CatSexos = require('./models/cat_sexos');
const CatTieneDiscapacidad = require('./models/cat_tiene_discapacidad');
const CatTiposBono = require('./models/cat_tipos_bono');
const CatTiposDiscapacidad = require('./models/cat_tipos_discapacidad');
const CatTiposEmpresaTrabajo = require('./models/cat_tipos_empresa_trabajo');
const CatTiposIdentificacion = require('./models/cat_tipos_identificacion');
const ContactosEmergencia = require('./models/contactos_emergencia');
const DatosAdicionalesPaciente = require('./models/datos_adicionales_paciente');
const FormasLlegada = require('./models/formas_llegada');
const Pacientes = require('./models/pacientes');
const Partos = require('./models/partos');
const Representantes = require('./models/representantes');
const Residencias = require('./models/residencias');
const Rol = require('./models/rol');
const TokenRecuperacion = require('./models/tokenRecuperacion');
const Usuario = require('./models/usuario');
const ProcedimientoEmergencia = require('./models/procedimientoEmergencia');
const Medicamento = require('./models/medicamento'); // Nuevo import para el modelo Medicamento
const CatProcedimientosEmergencia = require('./models/cat_procedimientos_emergencia'); // Nuevo import para el modelo de categorías de procedimientos
const CatTriaje = require('./models/cat_triaje'); // Nuevo import para el modelo de categorías de triaje
const CatCIE10 = require('./models/catCie10'); // Nuevo import para el modelo de categorías CIE10
const initAssociations = require('./models/init-associations'); // Importar la función de inicialización de asociaciones
const startPatientStatusCheck = require('./tasks/checkPatientStatus'); // Importar la tarea programada

dotenv.config();

const http = require('http');
const { initSocketServer } = require('./socket/socketServer');

const app = express();
const PORT = process.env.PORT || 3001;

// Crear servidor HTTP para Socket.io
const httpServer = http.createServer(app);

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public')); // Servir archivos estáticos (videos subidos)

// Rutas
const usuariosRouter = require('./routes/usuarios');
const medicamentosRouter = require('./routes/medicamentos'); // Nuevo import para las rutas de medicamentos
const procedimientosEmergenciaRouter = require('./routes/procedimientosEmergencia'); // Nuevo import para las rutas de procedimientos de emergencia
const cumplimientoProcedimientosRouter = require('./routes/cumplimientoProcedimientos'); // Nuevo import para cumplimiento de procedimientos
const signosVitalesRoutes = require('./routes/signosVitales'); // Importar rutas de signos vitales
const catProcedimientosEmergenciaRoutes = require('./routes/catProcedimientosEmergenciaRoutes'); // Nuevo import para las rutas de categorías de procedimientos
const alertasRoutes = require('./routes/alertas'); // Importar rutas de alertas
const atencionEmergenciaRoutes = require('./routes/atencionEmergencia'); // Importar rutas de atención de emergencia
const atencionPacienteEstadoRoutes = require('./routes/atencionPacienteEstado'); // Importar rutas de estado de atención del paciente
const recetaMedicaRoutes = require('./routes/recetaMedica'); // Importar rutas de recetas médicas
const ordenExamenRoutes = require('./routes/ordenExamen'); // Importar rutas de órdenes de examen
const ordenImagenRoutes = require('./routes/ordenImagen'); // Importar rutas de órdenes de imagen
const admisionesRoutes = require('./routes/admisiones'); // Nuevo import para las rutas de admisiones
const catMotivoConsultaSintomasRoutes = require('./routes/catMotivoConsultaSintomasRoutes'); // Nueva ruta
const reportesRoutes = require('./routes/reportes'); // Nuevo import para las rutas de reportes
const referenciaRoutes = require('./routes/referencia'); // Nuevo import para las rutas de referencia (053)

app.use('/usuarios', usuariosRouter);
console.log('Rutas de usuarios registradas en /usuarios'); // Log para depuración
app.use('/api/medicamentos', medicamentosRouter); // Usar las nuevas rutas de medicamentos
app.use('/api/procedimientos-emergencia', procedimientosEmergenciaRouter); // Usar las nuevas rutas de procedimientos de emergencia
app.use('/api/cumplimiento-procedimientos', cumplimientoProcedimientosRouter); // Usar rutas de cumplimiento de procedimientos
app.use('/api/signos-vitales', signosVitalesRoutes); // Usar rutas de signos vitales
app.use('/api/cat-procedimientos-emergencia', catProcedimientosEmergenciaRoutes); // Usar las nuevas rutas de categorías de procedimientos
app.use('/api/cat-triaje', require('./routes/catTriajeRoutes')); // Usar las nuevas rutas de categorías de triaje
app.use('/api/alertas', alertasRoutes); // Usar rutas de alertas
app.use('/api/atencion-emergencia', atencionEmergenciaRoutes); // Usar rutas de atención de emergencia
app.use('/api/atencion-paciente-estado', atencionPacienteEstadoRoutes); // Usar rutas de estado de atención del paciente
app.use('/api/cat-cie10', require('./routes/catCie10')); // Usar rutas de catálogo CIE10
app.use('/api/recetas-medicas', recetaMedicaRoutes); // Usar rutas de recetas médicas
app.use('/api/ordenes-examen', ordenExamenRoutes); // Usar rutas de órdenes de examen
app.use('/api/ordenes-imagen', ordenImagenRoutes); // Usar rutas de órdenes de imagen
app.use('/api/admisiones', admisionesRoutes); // Usar las nuevas rutas de admisiones
app.use('/api/motivos-consulta', catMotivoConsultaSintomasRoutes); // Nueva ruta
app.use('/api/reportes', reportesRoutes); // Usar las rutas de reportes
app.use('/api/referencias-053', referenciaRoutes); // Usar las rutas de referencias (053)
app.use('/api/multimedia-tv', require('./routes/multimediaTv')); // Rutas de multimedia para TV
app.use('/api/configuracion-audio', require('./routes/configuracionAudio')); // Rutas de configuración de audio
app.use('/api/pendientes-firma', require('./routes/pendientesFirma')); // Rutas de pendientes de firma
app.use('/api/diagnosticos', require('./routes/diagnosticos')); // Rutas de diagnósticos CIE-10
app.use('/api/reasignacion', require('./routes/reasignacion')); // Rutas de reasignación de pacientes
app.use('/api/firma-electronica', require('./routes/firmaElectronica')); // Rutas de firma electrónica
app.use('/api/bi', require('./routes/biRoutes')); // Rutas de Dashboard BI
app.use('/api/verificar', require('./routes/verificarTabla')); // Ruta temporal para verificar estructura de tablas
app.use('/api/soporte', require('./routes/soporte')); // Rutas para soporte técnico (logs correos, intentos, etc)
app.use('/api/usuarios-admin', require('./routes/usuariosAdmin')); // Rutas de gestión de usuarios para TI

// Inicializar Socket.io ANTES de iniciar el servidor (para que esté listo cuando el servidor escuche)
initSocketServer(httpServer);

// Inicializar asociaciones en cuanto los modelos estén cargados, ANTES de escuchar peticiones.
// Así evitamos "Pacientes is not associated to AtencionEmergencia" y alias incorrectos cuando
// el dashboard llama a la API antes de que la BD termine de conectar.
initAssociations();

// Iniciar servidor HTTP (que incluye Socket.io) - INICIAR SIEMPRE, incluso si la BD falla
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
  console.log(`📡 Socket.io habilitado para tiempo real en ws://localhost:${PORT}`);
  
  // Independencia de Inicio: La conexión a BD se realiza de forma asíncrona después de iniciar el servidor
  
  console.log('🔍 Intentando conexión inicial con Timeout de 2s para fallback rápido...');
  
  // Flujo de Fallback: sequelize.connectWithFallback se ejecuta en el callback del listen
  if (sequelize.connectWithFallback) {
    sequelize.connectWithFallback()
      .then(async () => {
        console.log('✅ Conexión a la base de datos establecida.');
        // Inicializar asociaciones después de cargar todos los modelos
        // initAssociations(); // COMENTADO: Ya se inicializan en la línea 114
        console.log('✅ Modelos sincronizados con la base de datos.');

        // Iniciar la tarea programada
        startPatientStatusCheck();
        console.log('✅ Tarea programada de verificación de estado de pacientes iniciada.');
      })
      .catch((error) => {
        console.error('❌ Error al conectar con la base de datos:', error.message);
        console.log('⚠️ Servidor funcionando en modo degradado (sin BD). Socket.io sigue activo.');
      });
  } else {
    // Fallback al método tradicional si no hay función de fallback
    sequelize.authenticate()
      .then(async () => {
        console.log('✅ Conexión a la base de datos establecida.');
        // initAssociations(); // COMENTADO: Ya se inicializan en la línea 114
        console.log('✅ Modelos sincronizados con la base de datos.');
        startPatientStatusCheck();
        console.log('✅ Tarea programada de verificación de estado de pacientes iniciada.');
      })
      .catch((error) => {
        console.error('❌ Error al conectar con la base de datos:', error.message);
        console.log('⚠️ Servidor funcionando en modo degradado (sin BD). Socket.io sigue activo.');
      });
  }
});
