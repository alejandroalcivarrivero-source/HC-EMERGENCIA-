import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react'; // Importar useEffect, useRef y useState
import './config/axios'; // Importar configuración de axios para interceptores globales
import LoginForm from './components/LoginForm';
import RegistroForm from './components/RegistroForm';
import RecuperarForm from './components/RecuperarForm';
import RestablecerForm from './components/RestablecerForm';
import CambiarContrasenaForm from './components/CambiarContrasenaForm';
import Dashboard from './pages/Dashboard';
import AdminAprobarUsuarios from './components/AdminAprobarUsuarios';
import AdminUsuarios from './pages/AdminUsuarios';
import AdminVideos from './pages/AdminVideos';
import Reportes from './pages/Reportes';
import Admision from './pages/Admision';
import PacientesAdmitidos from './pages/SignosVitales'; // Renombrado de PacientesSinSignosVitales
import SignosVitalesForm from './components/SignosVitalesForm';
import Historial from './pages/Historial';
import ProcedimientosEmergencia from './pages/ProcedimientosEmergencia'; // Nuevo import
import SeleccionarPacienteProcedimiento from './pages/SeleccionarPacienteProcedimiento'; // Nuevo import
import ListaEspera from './pages/ListaEspera'; // Nuevo import para la lista de espera
import AtencionEmergenciaForm from './components/AtencionEmergenciaForm'; // Nuevo import para el formulario de atención de emergencia
import AtencionEmergenciaPage from './pages/AtencionEmergenciaPage'; // Nuevo import para la página de atención de emergencia
import AtencionesEmergenciaList from './pages/AtencionesEmergenciaList'; // Nuevo import para la lista de atenciones de emergencia
import ProduccionPorEstado from './pages/ProduccionPorEstado'; // Nuevo import
import ListaPacientesPage from './pages/ListaPacientes'; // Nuevo import para la lista de todos los pacientes
import PantallaTurnosEmergencia from './pages/PantallaTurnosEmergencia'; // Importar pantalla de turnero digital de emergencia
import ConfirmModal from './components/ConfirmModal'; // Importar ConfirmModal
import DashboardPendientes from './pages/DashboardPendientes';
import FirmarAtencionPage from './pages/FirmarAtencionPage';
import AtencionesEnCurso from './pages/AtencionesEnCurso';
import AjustesFirmaElectronica from './pages/AjustesFirmaElectronica';

 function RutaPrivada({ children }) {
  const token = localStorage.getItem('token');
  // Verificar que el token existe y no es una cadena vacía
  return token && token.length > 0 ? children : <Navigate to="/" />;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  return token && token.length > 0 ? <Navigate to="/dashboard" /> : children;
}
 
function App() {
  const navigate = useNavigate(); // Usar useNavigate aquí para la redirección
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

  const inactivityTimeout = useRef(null);
  const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hora en milisegundos

  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimeout.current);
    inactivityTimeout.current = setTimeout(logout, INACTIVITY_LIMIT);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setShowSessionExpiredModal(true); // Mostrar el modal en lugar de alert
  };

  const handleSessionExpiredConfirm = () => {
    setShowSessionExpiredModal(false);
    navigate('/'); // Redirigir a la página de login
  };

  useEffect(() => {
    // Iniciar el temporizador al cargar el componente
    resetInactivityTimer();

    // Escuchar eventos de actividad del usuario
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer); // También considerar el scroll

    // Limpiar los listeners y el temporizador al desmontar el componente
    return () => {
      clearTimeout(inactivityTimeout.current);
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      window.removeEventListener('click', resetInactivityTimer);
      window.removeEventListener('scroll', resetInactivityTimer);
    };
  }, []); // Se ejecuta una vez al montar el componente

  return (
    <>
      <Routes>
      <Route path="/" element={<PublicRoute><LoginForm /></PublicRoute>} />
      <Route path="/registro" element={<RegistroForm />} />
      <Route path="/recuperar" element={<RecuperarForm />} />
      <Route path="/restablecer/:token" element={<RestablecerForm />} />
      <Route
        path="/dashboard"
        element={
          <RutaPrivada>
            <Dashboard />
          </RutaPrivada>
        }
      />
      <Route
        path="/admin/aprobar"
        element={
          <RutaPrivada>
            <AdminAprobarUsuarios />
          </RutaPrivada>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <RutaPrivada>
            <AdminUsuarios />
          </RutaPrivada>
        }
      />
      <Route
        path="/admin/videos"
        element={
          <RutaPrivada>
            <AdminVideos />
          </RutaPrivada>
        }
      />
      <Route
        path="/reportes"
        element={
          <RutaPrivada>
            <Reportes />
          </RutaPrivada>
        }
      />
      <Route
        path="/admision"
        element={
          <RutaPrivada>
            <Admision />
          </RutaPrivada>
        }
      />
      <Route
        path="/signosvitales" // Ruta principal para la lista de pacientes admitidos
        element={
          <RutaPrivada>
            <PacientesAdmitidos /> {/* Apuntar al componente renombrado */}
          </RutaPrivada>
        }
      />
      {/* Mantener la ruta original de toma de signos vitales, pero ajustarla si es necesario */}
      <Route
        path="/signosvitales/tomar/:admisionId" // Usar admisionId como en el controlador
        element={
          <RutaPrivada>
            <SignosVitalesForm />
          </RutaPrivada>
        }
      />
      <Route
        path="/historial"
        element={
          <RutaPrivada>
            <Historial />
          </RutaPrivada>
        }
      />
      <Route
        path="/cambiar-contrasena"
        element={
          <RutaPrivada>
            <CambiarContrasenaForm />
          </RutaPrivada>
        }
      />
      <Route
        path="/procedimientos-emergencia/:pacienteId"
        element={
          <RutaPrivada>
            <ProcedimientosEmergencia />
          </RutaPrivada>
        }
      />
      <Route
        path="/procedimientos-emergencia/:pacienteId/:admisionId"
        element={
          <RutaPrivada>
            <ProcedimientosEmergencia />
          </RutaPrivada>
        }
      />
      <Route
        path="/seleccionar-paciente-procedimiento"
        element={
          <RutaPrivada>
            <SeleccionarPacienteProcedimiento />
          </RutaPrivada>
        }
      />
      <Route
        path="/lista-espera"
        element={
          <RutaPrivada>
            <ListaEspera />
          </RutaPrivada>
        }
      />
      <Route
        path="/atencion-emergencia-page/:admisionId"
        element={
          <RutaPrivada>
            <AtencionEmergenciaPage />
          </RutaPrivada>
        }
      />
      <Route
        path="/atenciones-emergencia"
        element={
          <RutaPrivada>
            <AtencionesEmergenciaList />
          </RutaPrivada>
        }
      />
      <Route
        path="/reportes/produccion-por-estado"
        element={
          <RutaPrivada>
            <ProduccionPorEstado />
          </RutaPrivada>
        }
      />
      <Route
        path="/lista-pacientes"
        element={
          <RutaPrivada>
            <ListaPacientesPage />
          </RutaPrivada>
        }
      />
      {/* Ruta pública para pantalla de turnero digital de EMERGENCIA (TV) */}
      <Route
        path="/pantalla-turnos-emergencia"
        element={<PantallaTurnosEmergencia />}
      />
      <Route
        path="/atenciones-en-curso"
        element={
          <RutaPrivada>
            <AtencionesEnCurso />
          </RutaPrivada>
        }
      />
      <Route
        path="/pendientes-firma"
        element={
          <RutaPrivada>
            <DashboardPendientes />
          </RutaPrivada>
        }
      />
      <Route
        path="/firmar-atencion/:atencionId"
        element={
          <RutaPrivada>
            <FirmarAtencionPage />
          </RutaPrivada>
        }
      />
      <Route
        path="/ajustes/firma-electronica"
        element={
          <RutaPrivada>
            <AjustesFirmaElectronica />
          </RutaPrivada>
        }
      />
    </Routes>
    <ConfirmModal
      message="Su sesión ha expirado, ingrese nuevamente."
      isOpen={showSessionExpiredModal}
      onConfirm={handleSessionExpiredConfirm}
      isInformative={true}
    />
  </>
 );
}

// El BrowserRouter debe envolver el componente App en index.js o main.jsx
// No debe estar dentro de App si se usa useNavigate directamente en App.
// Si App está dentro de BrowserRouter, entonces useNavigate funciona.
// Si no, se debe pasar navigate como prop o usar un contexto.
// Para este caso, asumimos que App ya está dentro de BrowserRouter en main.jsx.

export default App;
