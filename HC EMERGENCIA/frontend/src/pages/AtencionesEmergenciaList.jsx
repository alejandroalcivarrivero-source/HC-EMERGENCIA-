import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import HistorialAdmisionesModal from '../components/HistorialAdmisionesModal';

export default function AtencionesEmergenciaList() {
  const [atenciones, setAtenciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHistorialAdmisionesModalOpen, setIsHistorialAdmisionesModalOpen] = useState(false);
  const [selectedPacienteIdForAdmisionesModal, setSelectedPacienteIdForAdmisionesModal] = useState(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  const [estadosAtencion, setEstadosAtencion] = useState([]); // Para almacenar los estados de atención
  const [sortField, setSortField] = useState('fechaAtencion'); // Campo por defecto para ordenar
  const [sortOrder, setSortOrder] = useState('desc'); // Orden por defecto (descendente)
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAtenciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      let url = `http://localhost:3001/api/atencion-emergencia`;
      const params = new URLSearchParams();

      if (fechaInicio) {
        params.append('fechaInicio', fechaInicio);
      }
      if (fechaFin) {
        params.append('fechaFin', fechaFin);
      }
      if (estadoSeleccionado) {
        params.append('estadoAtencion', estadoSeleccionado);
      }
      params.append('sortField', sortField);
      params.append('sortOrder', sortOrder);

      if (params.toString()) {
        url = `${url}?${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAtenciones(response.data);
      console.log('Atenciones recibidas del backend:', response.data);
    } catch (err) {
      console.error('Error al obtener atenciones de emergencia:', err);
      setError('Error al cargar la lista de atenciones. Intente de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  }, [navigate, fechaInicio, fechaFin, estadoSeleccionado, sortField, sortOrder]);

  const fetchEstadosAtencion = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/atencion-emergencia/estados', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEstadosAtencion(response.data);
    } catch (error) {
      console.error('Error al obtener estados de atención:', error);
    }
  }, []);

  useEffect(() => {
    fetchEstadosAtencion();
    fetchAtenciones();
  }, [fetchAtenciones, fetchEstadosAtencion]);

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

  const getEstadoAtencionClass = (estadoNombre) => {
    if (!estadoNombre) {
      return 'bg-gray-300 text-gray-800';
    }
    switch (estadoNombre.toLowerCase()) {
      case 'atendida':
        return 'bg-green-200 text-green-800 font-bold';
      case 'atencion_incompleta':
        return 'bg-orange-200 text-orange-800 font-bold';
      case 'en_espera':
        return 'bg-yellow-200 text-yellow-800';
      case 'en_proceso':
        return 'bg-blue-200 text-blue-800';
      case 'finalizada':
        return 'bg-gray-200 text-gray-800';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="p-8">
          <h2 className="text-2xl font-semibold mb-4">Listado de Atenciones de Emergencia</h2>

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
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700">Fecha Fin:</label>
                <input
                  type="date"
                  id="fechaFin"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="estadoAtencion" className="block text-sm font-medium text-gray-700">Estado de Atención:</label>
                <select
                  id="estadoAtencion"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={estadoSeleccionado}
                  onChange={(e) => setEstadoSeleccionado(e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  {estadosAtencion.map((estado) => (
                    <option key={estado.id} value={estado.nombre}>{estado.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={fetchAtenciones}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Buscar
              </button>
            </div>
          </div>

          {loading ? (
            <p>Cargando atenciones...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : atenciones.length === 0 ? (
            <p>No hay atenciones de emergencia registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow-md rounded-lg">
                <thead>
                  <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('fecha_hora_inicio')}>Fecha y Hora Inicio{getSortIndicator('fecha_hora_inicio')}</th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('estado_atencion')}>Estado{getSortIndicator('estado_atencion')}</th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('cedula')}>Cédula{getSortIndicator('cedula')}</th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('nombrePaciente')}>Nombre del Paciente{getSortIndicator('nombrePaciente')}</th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('motivoConsulta')}>Motivo Consulta{getSortIndicator('motivoConsulta')}</th>
                    <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('triajeDefinitivoNombre')}>Triaje Definitivo{getSortIndicator('triajeDefinitivoNombre')}</th>
                    <th className="py-3 px-6 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm font-light">
                  {atenciones.map((atencion) => (
                    <tr key={atencion.id} className="border-b border-gray-200 hover:bg-gray-100">
                      <td className="py-3 px-6 text-left">{new Date(atencion.fecha_hora_inicio).toLocaleString()}</td>
                      <td className="py-3 px-6 text-left">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEstadoAtencionClass(atencion.estado_atencion)}`}>
                          {atencion.estado_atencion}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-left whitespace-nowrap">{atencion.Admision.Paciente.numero_identificacion}</td>
                      <td className="py-3 px-6 text-left">{`${atencion.Admision.Paciente.primer_nombre || ''} ${atencion.Admision.Paciente.segundo_nombre || ''} ${atencion.Admision.Paciente.primer_apellido || ''} ${atencion.Admision.Paciente.segundo_apellido || ''}`.trim()}</td>
                      <td className="py-3 px-6 text-left">{atencion.Admision.motivo_consulta}</td>
                      <td className="py-3 px-6 text-left">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTriajeClass(atencion.Admision.Triaje.color)}`}>
                          {atencion.Admision.Triaje.nombre || 'Sin Triaje'}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() => navigate(`/atencion-emergencia-page/${atencion.admisionId}`)}
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
                        >
                          Ver Detalle
                        </button>
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
    </>
  );
}

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