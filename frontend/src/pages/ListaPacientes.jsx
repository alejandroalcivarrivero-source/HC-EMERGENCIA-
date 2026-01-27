import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import HistorialAdmisionesModal from '../components/HistorialAdmisionesModal';

export default function ListaPacientesPage() {
  const [admisiones, setAdmisiones] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [isHistorialAdmisionesModalOpen, setIsHistorialAdmisionesModalOpen] = useState(false);
  const [selectedPacienteIdForAdmisionesModal, setSelectedPacienteIdForAdmisionesModal] = useState(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  const [estadosPaciente, setEstadosPaciente] = useState([]); // Para almacenar los estados de paciente
  const [sortField, setSortField] = useState('fechaAdmision'); // Campo por defecto para ordenar
  const [sortOrder, setSortOrder] = useState('desc'); // Orden por defecto (descendente)
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAllAdmisiones = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `http://localhost:3001/api/admisiones`;
      const params = new URLSearchParams();

      if (fechaInicio) {
        params.append('fechaInicio', fechaInicio);
      }
      if (fechaFin) {
        params.append('fechaFin', fechaFin);
      }
      if (estadoSeleccionado) {
        params.append('estadoPaciente', estadoSeleccionado);
      }
      params.append('sortField', sortField);
      params.append('sortOrder', sortOrder);

      if (params.toString()) {
        url = `${url}?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('[ListaPacientesPage] Admisiones recibidas del backend:', data);
      setAdmisiones(data);
    } catch (error) {
      console.error('Error al obtener admisiones:', error);
      alert('Error al cargar admisiones. Por favor, intente de nuevo.');
    }
  }, [fechaInicio, fechaFin, estadoSeleccionado, sortField, sortOrder]);

  const fetchEstadosPaciente = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/admisiones/estados-paciente', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEstadosPaciente(response.data);
    } catch (error) {
      console.error('Error al obtener estados de paciente:', error);
    }
  }, []);

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

    fetchEstadosPaciente(); // Cargar estados de paciente
    fetchAllAdmisiones(); // Cargar admisiones al montar el componente

    if (location.state && location.state.refresh) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [navigate, location.state, fetchEstadosPaciente, fetchAllAdmisiones]);

  const handleFilter = () => {
    fetchAllAdmisiones();
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const getSortIndicator = (field) => {
    if (sortField === field) {
      return sortOrder === 'asc' ? ' 🔼' : ' 🔽';
    }
    return '';
  };

  const openHistorialAdmisionesModal = (pacienteId) => {
    setSelectedPacienteIdForAdmisionesModal(pacienteId);
    setIsHistorialAdmisionesModalOpen(true);
  };

  const closeHistorialAdmisionesModal = () => {
    setIsHistorialAdmisionesModalOpen(false);
    setSelectedPacienteIdForAdmisionesModal(null);
  };

  // Función para incrementar intentos de llamado
  const handleIncrementarLlamado = async (admisionId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:3001/api/admisiones/${admisionId}/incrementar-llamado`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Actualizar el estado local
      setAdmisiones(prevAdmisiones => 
        prevAdmisiones.map(adm => 
          adm.admisionId === admisionId 
            ? { ...adm, intentos_llamado: response.data.intentos_llamado }
            : adm
        )
      );
      
      if (response.data.requiereAtencion) {
        alert(`⚠️ Paciente marcado como "No responde" (${response.data.intentos_llamado} intentos)`);
      } else {
        alert(`✅ Intento de llamado registrado (${response.data.intentos_llamado} intentos)`);
      }
    } catch (error) {
      console.error('Error al incrementar intentos de llamado:', error);
      alert('Error al registrar el llamado. Por favor, intente de nuevo.');
    }
  };

  // Función para calcular estado de inactividad
  const calcularEstadoInactividad = (fechaUltimaActividad) => {
    if (!fechaUltimaActividad) return { esInactivo: false, esCierreAutomatico: false };
    
    const ahora = new Date();
    const ultimaActividad = new Date(fechaUltimaActividad);
    const horasSinActividad = (ahora - ultimaActividad) / (1000 * 60 * 60);
    
    return {
      esInactivo: horasSinActividad > 4 && horasSinActividad < 24,
      esCierreAutomatico: horasSinActividad >= 24
    };
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

  // Función para determinar la clase CSS del estado del paciente
  const getEstadoPacienteClass = (estadoNombre) => {
    if (!estadoNombre) {
      return 'bg-gray-300 text-gray-800';
    }
    switch (estadoNombre.toLowerCase()) {
      case 'admitido':
        return 'bg-blue-200 text-blue-800';
      case 'en_atencion':
        return 'bg-yellow-200 text-yellow-800';
      case 'atencion_incompleta':
        return 'bg-orange-200 text-orange-800';
      case 'alta_medica':
        return 'bg-green-220 text-green-800';
      case 'fallecido':
        return 'bg-red-200 text-red-800';
      case 'transferido':
        return 'bg-purple-200 text-purple-800';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="p-8">
          <h2 className="text-2xl font-semibold mb-4">Listado de Pacientes Admitidos</h2>

          {/* Controles de filtro */}
          <div className="bg-white shadow-md rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700">Fecha Inicio:</label>
                <input
                  type="date"
                  id="fechaInicio"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                  }}
                />
              </div>
              <div>
                <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700">Fecha Fin:</label>
                <input
                  type="date"
                  id="fechaFin"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value);
                  }}
                />
              </div>
              <div>
                <label htmlFor="estadoPaciente" className="block text-sm font-medium text-gray-700">Estado del Paciente:</label>
                <select
                  id="estadoPaciente"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={estadoSeleccionado}
                  onChange={(e) => {
                    setEstadoSeleccionado(e.target.value);
                  }}
                >
                  <option value="">Todos los estados</option>
                  {estadosPaciente.map((estado) => (
                    <option key={estado.id} value={estado.nombre}>{estado.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={fetchAllAdmisiones}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Buscar
              </button>
            </div>
          </div>

          {admisiones.length === 0 ? (
            <p>No hay pacientes admitidos en este momento.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow-md rounded-lg">
                <thead>
                  <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('fechaAdmision')}>Fecha y Hora Admisión{getSortIndicator('fechaAdmision')}</th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('estadoPaciente')}>Estado{getSortIndicator('estadoPaciente')}</th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('cedula')}>Cédula{getSortIndicator('cedula')}</th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('nombre')}>Nombre{getSortIndicator('nombre')}</th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('motivoConsulta')}>Motivo Consulta{getSortIndicator('motivoConsulta')}</th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('triajeDefinitivoNombre')}>Triaje Definitivo{getSortIndicator('triajeDefinitivoNombre')}</th>
                    <th className="py-3 px-6 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm font-light">
                  {admisiones.map((admision) => {
                    const estadoInactividad = calcularEstadoInactividad(admision.fecha_ultima_actividad);
                    const tieneProblemas = (admision.intentos_llamado >= 3) || estadoInactividad.esInactivo;
                    
                    return (
                      <tr 
                        key={admision.admisionId} 
                        className={`border-b border-gray-200 hover:bg-gray-100 ${
                          admision.intentos_llamado >= 3 ? 'bg-yellow-50 border-l-4 border-l-yellow-500' : 
                          estadoInactividad.esInactivo ? 'bg-gray-50 border-l-4 border-l-gray-400' : ''
                        }`}
                      >
                        <td className="py-3 px-6 text-left">{`${admision.fechaAdmision} ${admision.horaAdmision}`}</td>
                        <td className="py-3 px-6 text-left">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEstadoPacienteClass(admision.estadoPaciente)}`}>
                              {admision.estadoPaciente}
                            </span>
                            {admision.intentos_llamado >= 3 && (
                              <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold inline-flex items-center">
                                ⚠️ No responde ({admision.intentos_llamado} intentos)
                              </span>
                            )}
                            {estadoInactividad.esInactivo && (
                              <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center">
                                ⏸️ Inactivo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-6 text-left whitespace-nowrap">{admision.cedula}</td>
                        <td className="py-3 px-6 text-left">{admision.nombre}</td>
                        <td className="py-3 px-6 text-left">{admision.motivoConsulta}</td>
                        <td className="py-3 px-6 text-left"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTriajeClass(admision.triajeDefinitivoColor)}`}>{admision.triajeDefinitivoNombre || 'Sin Triaje'}</span></td>
                        <td className="py-3 px-6 text-center">
                          <div className="flex flex-col gap-2 items-center">
                            <button 
                              onClick={(e) => handleIncrementarLlamado(admision.admisionId, e)} 
                              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs focus:outline-none focus:shadow-outline"
                              title="Registrar intento de llamado"
                            >
                              📞 Llamar
                            </button>
                            <button 
                              onClick={() => openHistorialAdmisionesModal(admision.id)} 
                              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs focus:outline-none focus:shadow-outline"
                            >
                              Ver Historial
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
    </>
  );
}