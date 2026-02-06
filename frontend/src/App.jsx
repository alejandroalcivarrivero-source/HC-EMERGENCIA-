import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react'; // Importar useEffect, useRef y useState
import './config/axios'; // Importar configuración de axios para interceptores globales
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './components/LoginForm';
import RegistroForm from './components/RegistroForm';
import RecuperarForm from './components/RecuperarForm';
import RestablecerForm from './components/RestablecerForm';
import CambiarContrasenaForm from './components/CambiarContrasenaForm';
import Dashboard from './pages/Dashboard';
import AdminAprobarUsuarios from './components/AdminAprobarUsuarios';
import AdminUsuarios from './pages/AdminUsuarios';
import AdminVideos from './pages/AdminVideos';
import DashboardBI from './components/Admin/DashboardBI';
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

 function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  if (token && token.length > 0) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roleId = parseInt(payload.rol_id, 10);
      if (roleId === 5) return <Navigate to="/dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    } catch (error) {
      localStorage.removeItem('token'); // Token inválido
    }
  }
  return children;
}

function RedirectByRole() {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const roleId = parseInt(payload.rol_id, 10);
    
    // Rol 1: Médico -> Dashboard
    if (roleId === 1) return <Navigate to="/dashboard" replace />;
    
    // Rol 5: Administrador -> Dashboard
    if (roleId === 5) return <Navigate to="/dashboard" replace />;

    // Otros roles -> Dashboard por defecto
    return <Navigate to="/dashboard" replace />;
  } catch (e) {
    console.error('Error al redirigir por rol:', e);
    localStorage.removeItem('token');
    return <Navigate to="/" replace />;
  }
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
          <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/aprobar"
        element={
          <ProtectedRoute allowedRoles={[5]}>
            <AdminAprobarUsuarios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute allowedRoles={[5]}>
            <AdminUsuarios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/videos"
        element={
          <ProtectedRoute allowedRoles={[5]}>
            <AdminVideos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bi"
        element={
          <ProtectedRoute allowedRoles={[5]}>
            <DashboardBI />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]}>
            <Reportes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admision"
        element={
          <ProtectedRoute allowedRoles={[2, 3, 4]}>
            <Admision />
          </ProtectedRoute>
        }
      />
      <Route
        path="/signosvitales" // Ruta principal para la lista de pacientes admitidos
        element={
          <ProtectedRoute allowedRoles={[2, 3, 4]}>
            <PacientesAdmitidos /> {/* Apuntar al componente renombrado */}
          </ProtectedRoute>
        }
      />
      {/* Mantener la ruta original de toma de signos vitales, pero ajustarla si es necesario */}
      <Route
        path="/signosvitales/tomar/:admisionId" // Usar admisionId como en el controlador
        element={
          <ProtectedRoute allowedRoles={[2, 3, 4]}>
            <SignosVitalesForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historial"
        element={
          <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
            <Historial />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cambiar-contrasena"
        element={
          <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]}>
            <CambiarContrasenaForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/procedimientos-emergencia/:pacienteId"
        element={
          <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
            <ProcedimientosEmergencia />
          </ProtectedRoute>
        }
      />
      <Route
        path="/procedimientos-emergencia/:pacienteId/:admisionId"
        element={
          <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
            <ProcedimientosEmergencia />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seleccionar-paciente-procedimiento"
        element={
          <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
            <SeleccionarPacienteProcedimiento />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lista-espera"
        element={
          <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
            <ListaEspera />
          </ProtectedRoute>
        }
      />
      <Route
        path="/atencion-emergencia-page/:admisionId"
        element={
          <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
            <AtencionEmergenciaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/atenciones-emergencia"
        element={
          <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
            <AtencionesEmergenciaList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes/produccion-por-estado"
        element={
          <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]}>
            <ProduccionPorEstado />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lista-pacientes"
        element={
          <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
            <ListaPacientesPage />
          </ProtectedRoute>
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
          <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
            <AtencionesEnCurso />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pendientes-firma"
        element={
          <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
            <DashboardPendientes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/firmar-atencion/:atencionId"
        element={
          <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
            <FirmarAtencionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ajustes/firma-electronica"
        element={
          <ProtectedRoute allowedRoles={[1, 2, 3, 4]}>
            <AjustesFirmaElectronica />
          </ProtectedRoute>
        }
      />
      
      {/* Ruta Comodín (*) para manejar 404 y redirecciones inteligentes */}
      <Route path="*" element={<RedirectByRole />} />
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
