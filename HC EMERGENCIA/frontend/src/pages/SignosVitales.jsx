import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import AlertaTriaje from '../components/AlertaTriaje';
import HistorialAdmisionesModal from '../components/HistorialAdmisionesModal';
import ConfirmModal from '../components/ConfirmModal';

export default function SignosVitalesPage() {
  const [admisiones, setAdmisiones] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [isHistorialAdmisionesModalOpen, setIsHistorialAdmisionesModalOpen] = useState(false);
  const [selectedPacienteIdForAdmisionesModal, setSelectedPacienteIdForAdmisionesModal] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalAction, setConfirmModalAction] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAdmisiones = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:3001/usuarios/admisiones-activas`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('[SignosVitalesPage] Admisiones recibidas del backend:', data);

      const now = new Date();
      const filteredData = data.filter(admision => {
        const [day, month, year] = admision.fechaAdmision.split('/');
        const [hours, minutes] = admision.horaAdmision.split(':');
        const admisionDateTime = new Date(year, month - 1, day, hours, minutes);
        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        return admisionDateTime > twentyFourHoursAgo;
      });

      setAdmisiones(filteredData);
    } catch (error) {
      console.error('Error al obtener admisiones:', error);
      alert('Error al cargar admisiones. Por favor, intente de nuevo.');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsuario(payload);
    } catch {
      localStorage.removeItem('token');
      navigate('/');
    }

    fetchAdmisiones();

    const intervalId = setInterval(fetchAdmisiones, 30000); // Actualizar cada 30 segundos

    return () => clearInterval(intervalId); // Limpiar el intervalo al desmontar

    if (location.state && location.state.refresh) {
      fetchAdmisiones();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [navigate, location.state]);

  const refreshAdmisiones = () => {
    fetchAdmisiones();
  };

  const openHistorialAdmisionesModal = (pacienteId) => {
    setSelectedPacienteIdForAdmisionesModal(pacienteId);
    setIsHistorialAdmisionesModalOpen(true);
  };

  const closeHistorialAdmisionesModal = () => {
    setIsHistorialAdmisionesModalOpen(false);
    setSelectedPacienteIdForAdmisionesModal(null);
  };

  const handleTomarSignos = async (admisionId) => {
    try {
      const token = localStorage.getItem('token');
      // Obtener todos los signos vitales para verificar la última toma, no solo las últimas 24h
      const response = await axios.get(`http://localhost:3001/api/signos-vitales/${admisionId}?historial=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.length > 0) {
        const ultimaToma = new Date(response.data[0].fecha_hora_registro).toLocaleString();
        setConfirmModalMessage(
          `Ya se han registrado signos vitales para esta admisión por última vez a las ${ultimaToma}. ¿Desea tomar nuevos signos vitales?`
        );
        setConfirmModalAction(() => () => navigate(`/signosvitales/tomar/${admisionId}`));
        setShowConfirmModal(true);
        return;
      }
      navigate(`/signosvitales/tomar/${admisionId}`);
    } catch (error) {
      console.error('Error al verificar signos vitales existentes:', error);
      alert('Error al verificar signos vitales. Por favor, intente de nuevo.');
    }
  };

  const handleRegistrarProcedimiento = (pacienteId, admisionId) => {
    navigate(`/procedimientos-emergencia/${pacienteId}?admisionId=${admisionId}`);
  };

  // Función para determinar la clase CSS del triaje
  const getTriajeClass = (triajeColor) => {
    if (!triajeColor) {
      return 'bg-gray-300 text-gray-800';
    }
    switch (triajeColor.toLowerCase()) {
      case 'rojo':
        return 'bg-red-500 text-white';
      case 'naranja':
        return 'bg-orange-700 text-white';
      case 'amarillo':
        return 'bg-yellow-300 text-gray-800';
      case 'verde':
        return 'bg-green-500 text-white';
      case 'azul':
        return 'bg-blue-500 text-white';
      case 'gris':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="p-8">
          {usuario && (usuario.rol_id === 1 || usuario.rol_id === 3) && ( // Médico o Enfermero
            <div className="max-w-4xl mx-auto mb-6">
              <AlertaTriaje />
            </div>
          )}
          <h2 className="text-2xl font-semibold mb-4">Gestión de Pacientes Admitidos</h2>
          {admisiones.length === 0 ? (
            <p>No hay pacientes admitidos en este momento.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow-md rounded-lg">
                <thead>
                  <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Fecha y Hora Admisión</th>
                    <th className="py-3 px-6 text-left">Estado</th>
                    <th className="py-3 px-6 text-left">Cédula</th>
                    <th className="py-3 px-6 text-left">Nombre</th>
                    <th className="py-3 px-6 text-left">Motivo Consulta</th>
                    <th className="py-3 px-6 text-left">Triaje Definitivo</th>
                    <th className="py-3 px-6 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm font-light">
                  {admisiones.map((admision) => (
                    <tr 
                      key={admision.admisionId} 
                      className={`border-b border-gray-200 hover:bg-gray-100 ${
                        admision.prioridadEnfermeria === 1 ? 'bg-red-50 border-l-4 border-l-red-600' : ''
                      }`}
                    >
                      <td className="py-3 px-6 text-left">{`${admision.fechaAdmision} ${admision.horaAdmision}`}</td>
                      <td className="py-3 px-6 text-left">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-300 text-gray-800">{admision.estadoPaciente}</span>
                        {/* ALERTA DE ESCALAMIENTO MÉDICO */}
                        {admision.prioridadEnfermeria === 1 && (
                          <span className="block bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold mt-1 animate-pulse">
                            ⚠️ ESCALADO A MÉDICO
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-left whitespace-nowrap">{admision.cedula}</td>
                      <td className="py-3 px-6 text-left">
                        <div className="flex flex-col">
                          <span>{admision.nombre}</span>
                          {/* OBSERVACIÓN DE ESCALAMIENTO */}
                          {admision.prioridadEnfermeria === 1 && admision.observacionEscalamiento && (
                            <div className="text-red-700 text-xs mt-1 p-2 bg-red-100 rounded border border-red-300">
                              <span className="font-bold">📋 Escalado:</span>
                              <p className="mt-1">{admision.observacionEscalamiento}</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-left">{admision.motivoConsulta}</td>
                      <td className="py-3 px-6 text-left"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTriajeClass(admision.triajeDefinitivoColor)}`}>{admision.triajeDefinitivoNombre || 'Sin Triaje'}</span></td>
                      <td className="py-3 px-6 text-center">
                        {usuario && (usuario.rol_id === 1 || usuario.rol_id === 3) && ( // Médico o Enfermero
                          <button onClick={() => handleTomarSignos(admision.admisionId)} className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline mr-2">Tomar Signos</button>
                        )}
                        {usuario && (usuario.rol_id === 1 || usuario.rol_id === 3) && ( // Médico o Enfermero
                          <button onClick={() => handleRegistrarProcedimiento(admision.id, admision.admisionId)} className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline mr-2">Registrar Procedimiento</button>
                        )}
                        <button onClick={() => openHistorialAdmisionesModal(admision.id)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline">Ver Historial</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
      {isHistorialAdmisionesModalOpen && (
        <HistorialAdmisionesModal
          isOpen={isHistorialAdmisionesModalOpen}
          pacienteId={selectedPacienteIdForAdmisionesModal}
          onClose={closeHistorialAdmisionesModal}
        />
      )}
 
       {showConfirmModal && (
         <ConfirmModal
           isOpen={showConfirmModal}
           onClose={() => setShowConfirmModal(false)}
           message={confirmModalMessage}
           onConfirm={() => {
             if (confirmModalAction) {
               confirmModalAction();
             }
             setShowConfirmModal(false);
           }}
           onCancel={() => setShowConfirmModal(false)}
         />
       )}
     </>
   );
 }