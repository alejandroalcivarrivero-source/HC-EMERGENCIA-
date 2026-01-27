import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Importar useNavigate y useLocation
import axios from 'axios';
import ProcedimientoEmergenciaForm from '../components/ProcedimientoEmergenciaForm';
import HistorialProcedimientosModal from '../components/HistorialProcedimientosModal'; // Importar el modal de historial
import ConfirmModal from '../components/ConfirmModal'; // Importar el componente ConfirmModal
import { format } from 'date-fns';
import moment from 'moment-timezone'; // Importar moment-timezone para manejo correcto de zona horaria
import Header from '../components/Header'; // Importar el componente Header

const ProcedimientosEmergencia = () => {
  const { pacienteId } = useParams();
  const location = useLocation();
  const navigate = useNavigate(); // Inicializar useNavigate
  
  // Extraer admisionId del query string
  const queryParams = new URLSearchParams(location.search);
  const admisionId = queryParams.get('admisionId');
  
  // Removido console.log innecesario para mejor rendimiento

  const [paciente, setPaciente] = useState(null);
  const [procedimientos, setProcedimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [procedimientoAAnular, setProcedimientoAAnular] = useState(null);
  const [razonAnulacion, setRazonAnulacion] = useState('');
  const [errorAnulacion, setErrorAnulacion] = useState(''); // Error específico del modal de anulación

  const fetchPacienteAndProcedimientos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      // OPTIMIZACIÓN: Hacer ambas llamadas en paralelo para reducir tiempo total
      const promises = [
        axios.get(`http://localhost:3001/usuarios/pacientes/${pacienteId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ];
      
      // Solo agregar la llamada de cumplimientos si hay admisionId
      if (admisionId && admisionId !== 'undefined') {
        promises.push(
          axios.get(`http://localhost:3001/api/cumplimiento-procedimientos/admision/${admisionId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
      }
      
      // Ejecutar todas las llamadas en paralelo
      const results = await Promise.all(promises);
      const pacienteResponse = results[0];
      setPaciente(pacienteResponse.data);

      // Procesar cumplimientos si existen
      let cumplimientos = [];
      if (results.length > 1 && results[1]?.data) {
        // El backend ya ordena por fecha DESC, no necesitamos reordenar
        cumplimientos = results[1].data.map(c => ({
          id: c.id,
          nombreProcedimiento: c.Procedimiento?.nombre || 'Procedimiento desconocido',
          horaRealizacion: c.fecha_hora || c.fecha_hora_formateada, // Ya viene formateada del backend
          observacion: c.observacion_hallazgo,
          esCumplimiento: true,
          alertaMedica: c.alerta_medica,
          observacionEscalamiento: c.observacion_escalamiento,
          usuarioNombre: c.UsuarioEnfermeria ? `${c.UsuarioEnfermeria.nombres} ${c.UsuarioEnfermeria.apellidos}` : 'N/A'
        }));
      }
      
      setProcedimientos(cumplimientos);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [pacienteId, admisionId]);

  useEffect(() => {
    fetchPacienteAndProcedimientos();
  }, [fetchPacienteAndProcedimientos, location.search]);

  // OPTIMIZACIÓN: Eliminado listener de focus que recarga innecesariamente
  // Si se necesita recargar, se puede hacer manualmente o con un botón de refrescar

  const handleProcedimientoAdded = useCallback(async (newProcedimiento) => {
    // Recargar la lista de procedimientos inmediatamente sin delay
    await fetchPacienteAndProcedimientos();
  }, [fetchPacienteAndProcedimientos]);

  const handleAnularProcedimiento = async () => {
    // Limpiar error anterior
    setErrorAnulacion('');
    
    if (!razonAnulacion || razonAnulacion.trim() === '') {
      setErrorAnulacion('La razón de la anulación es obligatoria.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:3001/api/cumplimiento-procedimientos/${procedimientoAAnular}/anular`,
        { razonAnulacion },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Cerrar modal y limpiar estados
      setShowAnularModal(false);
      setRazonAnulacion('');
      setProcedimientoAAnular(null);
      setErrorAnulacion('');

      // Recargar la lista sin recargar toda la página
      await fetchPacienteAndProcedimientos();
    } catch (err) {
      setErrorAnulacion(err.response?.data?.message || 'Error al anular el procedimiento.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="p-8">
          <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
            <div className="text-center text-gray-600">Cargando...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="p-8">
        <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-700">
              Procedimientos de Emergencia para {paciente?.nombres} {paciente?.apellidos}
            </h1>
            <button
              type="button"
              onClick={() => setIsHistorialModalOpen(true)}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Ver Historial
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ProcedimientoEmergenciaForm
                pacienteId={pacienteId}
                admisionId={admisionId && admisionId !== 'undefined' ? admisionId : null}
                onProcedimientoAdded={handleProcedimientoAdded}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Listado de Procedimientos</h2>
              {procedimientos.length === 0 ? (
                <p className="text-gray-600">No hay procedimientos registrados para este paciente.</p>
              ) : (
                <ul className="bg-white p-4 rounded-lg shadow-md">
                  {procedimientos.map((proc) => (
                    <li key={proc.id} className="border-b border-gray-200 py-3 last:border-b-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{proc.nombreProcedimiento}</p>
                          <p className="text-sm text-gray-600">
                            Hora: {proc.horaRealizacion || 'N/A'}
                          </p>
                          {proc.observacion && (
                            <p className="text-sm text-gray-600">Observación: {proc.observacion}</p>
                          )}
                          {proc.alertaMedica === 1 && (
                            <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-500">
                              <p className="text-xs text-red-700 font-bold">⚠️ ESCALADO A MÉDICO</p>
                              {proc.observacionEscalamiento && (
                                <p className="text-xs text-red-600 mt-1">{proc.observacionEscalamiento}</p>
                              )}
                            </div>
                          )}
                          {proc.usuarioNombre && (
                            <p className="text-xs text-gray-500 mt-1">Registrado por: {proc.usuarioNombre}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-semibold">
                            ✓ Cumplimiento
                          </span>
                          <button
                            onClick={() => {
                              setProcedimientoAAnular(proc.id);
                              setShowAnularModal(true);
                            }}
                            className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-1 px-3 rounded text-sm"
                            title="Anular este procedimiento (no se elimina, queda en el historial)"
                          >
                            Anular
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <HistorialProcedimientosModal
          isOpen={isHistorialModalOpen}
          onClose={() => setIsHistorialModalOpen(false)}
          admisionId={admisionId}
          pacienteId={pacienteId}
        />
        
        {/* Modal de Anulación */}
        {showAnularModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border-4 border-orange-500">
              <h3 className="text-xl font-bold mb-4 text-orange-600 flex items-center">
                ⚠️ Anular Procedimiento
              </h3>
              <p className="text-gray-700 mb-4">
                El registro NO se eliminará, se marcará como ANULADO y permanecerá en el historial con fines de auditoría.
              </p>
              <div className="mb-4">
                <label htmlFor="razonAnulacion" className="block text-gray-700 text-sm font-bold mb-2">
                  Razón de la Anulación (Obligatorio):
                </label>
                <textarea
                  id="razonAnulacion"
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 ${
                    errorAnulacion ? 'border-red-500' : ''
                  }`}
                  value={razonAnulacion}
                  onChange={(e) => {
                    setRazonAnulacion(e.target.value);
                    // Limpiar error cuando el usuario empiece a escribir
                    if (errorAnulacion) {
                      setErrorAnulacion('');
                    }
                  }}
                  placeholder="Ej: Error en la selección del procedimiento, se aplicó un procedimiento diferente, datos incorrectos..."
                  required
                ></textarea>
                {errorAnulacion && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-600 text-sm font-semibold flex items-center">
                      <span className="mr-2">⚠️</span>
                      {errorAnulacion}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAnularModal(false);
                    setRazonAnulacion('');
                    setProcedimientoAAnular(null);
                    setErrorAnulacion('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAnularProcedimiento}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                >
                  Confirmar Anulación
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProcedimientosEmergencia;