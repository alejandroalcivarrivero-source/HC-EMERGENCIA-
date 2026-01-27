import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ReasignarPacienteModal from '../components/ReasignarPacienteModal'; // Importar el nuevo componente

const ListaEspera = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState(null); // Estado para almacenar el ID del usuario actual
  const [isReasignModalOpen, setIsReasignModalOpen] = useState(false); // Estado para controlar la visibilidad del modal
  const [selectedAdmisionToReasign, setSelectedAdmisionToReasign] = useState(null); // Estado para la admisión a reasignar
  const [atencionesExistentes, setAtencionesExistentes] = useState({}); // Mapa de admisionId -> tieneAtencion

  const fetchPacientesEnEspera = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Decodificar el token para obtener el ID del usuario actual
      const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decodificación básica, considerar una librería como jwt-decode
      setCurrentUserId(decodedToken.id); // Asumiendo que el ID del usuario está en 'id'

      // Usar el endpoint de lista de espera que ordena por triaje y filtra por SIGNOS_VITALES
      const response = await axios.get('http://localhost:3001/api/atencion-paciente-estado/espera', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('[ListaEspera] Respuesta del servidor:', response.data);
      console.log('[ListaEspera] Número de pacientes recibidos:', response.data?.length || 0);

      // Verificar qué admisiones tienen atención pendiente
      const admisionIds = response.data.map(p => p.Admision?.id).filter(Boolean);
      const atencionesMap = {};
      
      if (admisionIds.length > 0) {
        try {
          // Verificar atenciones pendientes para estas admisiones
          const atencionesResponse = await axios.get('http://localhost:3001/api/pendientes-firma/en-curso', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          atencionesResponse.data.forEach(atencion => {
            atencionesMap[atencion.admisionId] = true;
          });
        } catch (err) {
          console.error('Error al verificar atenciones existentes:', err);
        }
      }
      
      setAtencionesExistentes(atencionesMap);

      // Obtener momento actual para el filtro de 24 horas
      const ahora = new Date();
      const hace24Horas = new Date(ahora.getTime() - (24 * 60 * 60 * 1000));

      // Mapear los datos del endpoint a la estructura esperada por el frontend
      const pacientesMapeados = await Promise.all(response.data
        .filter((paciente) => {
          // REGLA DE 24 HORAS: Filtrar pacientes ATENDIDOS con más de 24h desde admisión
          if (paciente.Estado && paciente.Estado.nombre === 'ATENDIDO' && paciente.Admision && paciente.Admision.fecha_hora_admision) {
            const fechaAdmision = new Date(paciente.Admision.fecha_hora_admision);
            const horasPasadas = (ahora.getTime() - fechaAdmision.getTime()) / (1000 * 60 * 60);
            
            console.log(`[ListaEspera] Paciente ATENDIDO - Admisión ID: ${paciente.Admision.id}, Horas desde admisión: ${horasPasadas.toFixed(2)}`);
            
            // Solo mostrar si han pasado MENOS de 24 horas
            return horasPasadas < 24;
          }
          
          // Para todos los demás estados, mostrar sin restricción
          return true;
        })
        .map(async (paciente) => {
          const admision = paciente.Admision;
          const pacienteData = admision.Paciente;
          const triaje = admision.TriajeDefinitivo; // Usar TriajeDefinitivo en lugar de Triaje
          const estado = paciente.Estado;

          // OPTIMIZACIÓN: Usar signos vitales que ya vienen del backend en lugar de hacer llamadas adicionales
          let ultimoSignoVital = null;
          if (admision.DatosSignosVitales && admision.DatosSignosVitales.length > 0) {
            const sv = admision.DatosSignosVitales[0]; // Ya viene ordenado y limitado desde el backend
            ultimoSignoVital = {
              temperatura: sv.temperatura,
              presionArterial: sv.presion_arterial,
              frecuenciaCardiaca: sv.frecuencia_cardiaca,
              saturacionOxigeno: sv.saturacion_oxigeno,
              fechaHoraRegistro: sv.fecha_hora_registro
            };
          }

          // Formatear fecha y hora
          const fechaAdmision = new Date(admision.fecha_hora_admision);
          const fechaFormateada = fechaAdmision.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const horaFormateada = fechaAdmision.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

          return {
            id: pacienteData.id,
            pacienteId: pacienteData.id,
            admisionId: admision.id,
            cedula: pacienteData.numero_identificacion,
            nombre: `${pacienteData.primer_nombre || ''} ${pacienteData.segundo_nombre || ''} ${pacienteData.primer_apellido || ''} ${pacienteData.segundo_apellido || ''}`.trim(),
            fechaAdmision: fechaFormateada,
            horaAdmision: horaFormateada,
            estadoPaciente: estado ? estado.nombre : 'PREPARADO',
            usuarioResponsableId: paciente.usuarioResponsableId,
            triajeDefinitivoNombre: triaje ? triaje.nombre : 'Azul',
            triajeDefinitivoColor: triaje ? triaje.color : 'Azul',
            ultimoSignoVital: ultimoSignoVital,
            prioridadEnfermeria: admision.prioridad_enfermeria || 0, // Campo de escalamiento
            observacionEscalamiento: admision.observacion_escalamiento || null, // Observación del escalamiento
            intentos_llamado: admision.intentos_llamado || 0,
            fecha_ultima_actividad: admision.fecha_ultima_actividad || admision.fecha_actualizacion || null
          };
        }));

      setPacientes(pacientesMapeados);
    } catch (err) {
      console.error('Error al obtener pacientes en espera:', err);
      console.error('Error completo:', err.response?.data || err.message);
      if (err.response?.status === 500) {
        setError(`Error del servidor: ${err.response?.data?.error || err.response?.data?.message || 'Error desconocido'}`);
      } else {
        setError('Error al cargar la lista de pacientes. Intente de nuevo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacientesEnEspera();
    // OPTIMIZACIÓN: Aumentar intervalo a 30 segundos para reducir carga del servidor
    const interval = setInterval(fetchPacientesEnEspera, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, [navigate]);


  const handleAtenderPaciente = async (admisionId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Verificar si ya existe una atención pendiente
      const tieneAtencionPendiente = atencionesExistentes[admisionId];
      
      if (tieneAtencionPendiente) {
        // Si ya existe atención, ir directamente al formulario
        navigate(`/atencion-emergencia-page/${admisionId}`);
        return;
      }
      
      // Si no existe, asignar médico y crear atención
      await axios.put(`http://localhost:3001/api/atencion-paciente-estado/${admisionId}/asignar-medico`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      navigate(`/atencion-emergencia-page/${admisionId}`);
    } catch (err) {
      console.error('Error al asignar paciente:', err);
      if (err.response && err.response.status === 409) {
        alert('Este paciente ya ha sido asignado a otro médico.');
      } else {
        setError('Error al asignar paciente. Intente de nuevo.');
      }
    }
  };

  const handleOpenReasignModal = (admisionId, currentMedicoId) => {
    setSelectedAdmisionToReasign({ admisionId, currentMedicoId });
    setIsReasignModalOpen(true);
  };

  const handleCloseReasignModal = () => {
    setIsReasignModalOpen(false);
    setSelectedAdmisionToReasign(null);
  };

  const handleReasignSuccess = () => {
    fetchPacientesEnEspera(); // Recargar la lista de pacientes
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
      
      // Recargar la lista de pacientes
      await fetchPacientesEnEspera();
      
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

  if (loading) {
    return <div className="text-center py-4">Cargando pacientes en espera...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Lista de Espera de Pacientes</h1>
      {pacientes.length === 0 ? (
        <p className="text-center text-gray-600">No hay pacientes en espera en este momento.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 text-left text-gray-700">Estado</th>
                <th className="py-2 px-4 text-left text-gray-700">Triaje Definitivo</th>
                <th className="py-2 px-4 text-left text-gray-700">Paciente</th>
                <th className="py-2 px-4 text-left text-gray-700">Cédula</th>
                <th className="py-2 px-4 text-left text-gray-700">Fecha de Llegada</th>
                <th className="py-2 px-4 text-left text-gray-700">Hora Últimos Signos Vitales</th>
                <th className="py-2 px-4 text-left text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((paciente) => {
                const token = localStorage.getItem('token');
                const tokenData = token ? JSON.parse(atob(token.split('.')[1])) : null;
                const userRolId = tokenData ? tokenData.rol_id : null;

                // Botón Atender: Visible para administradores (rol_id 1) y médicos (rol_id 2) si el paciente está SIGNOS_VITALES o FALLECIDO
                const canAttend = userRolId === 1 || userRolId === 2;
                const isPreparedOrDeceased = paciente.estadoPaciente === 'SIGNOS_VITALES' || paciente.estadoPaciente === 'FALLECIDO';
                const tieneAtencionPendiente = atencionesExistentes[paciente.admisionId] || paciente.tieneAtencionPendiente;
                const showAttendButton = currentUserId && canAttend && isPreparedOrDeceased && !tieneAtencionPendiente;
                const showContinuarButton = currentUserId && canAttend && tieneAtencionPendiente;

                const estadoInactividad = calcularEstadoInactividad(paciente.fecha_ultima_actividad);
                const tieneProblemas = (paciente.intentos_llamado >= 3) || estadoInactividad.esInactivo;
                
                return (
                  <tr 
                    key={paciente.id} 
                    className={`border-b border-gray-200 hover:bg-gray-100 ${
                      paciente.prioridadEnfermeria === 1 ? 'bg-red-50 border-l-4 border-l-red-600' : 
                      paciente.intentos_llamado >= 3 ? 'bg-yellow-50 border-l-4 border-l-yellow-500' : 
                      estadoInactividad.esInactivo ? 'bg-gray-50 border-l-4 border-l-gray-400' : ''
                    }`}
                  >
                    <td className="py-2 px-4">
                      <div className="flex flex-col gap-1">
                        <span>{paciente.estadoPaciente}</span>
                        {/* ALERTA DE ESCALAMIENTO MÉDICO */}
                        {paciente.prioridadEnfermeria === 1 && (
                          <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold mt-1 animate-pulse inline-flex items-center">
                            ⚠️ VALORACIÓN URGENTE
                          </span>
                        )}
                        {/* INDICADOR NO RESPONDE */}
                        {paciente.intentos_llamado >= 3 && (
                          <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold mt-1 inline-flex items-center">
                            ⚠️ No responde ({paciente.intentos_llamado} intentos)
                          </span>
                        )}
                        {/* INDICADOR INACTIVO */}
                        {estadoInactividad.esInactivo && (
                          <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-semibold mt-1 inline-flex items-center">
                            ⏸️ Inactivo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-2 px-4 ${
                      paciente.triajeDefinitivoColor.toLowerCase() === 'rojo' ? 'bg-red-500 text-white' :
                      paciente.triajeDefinitivoColor.toLowerCase() === 'naranja' ? 'bg-orange-600 text-white' :
                      paciente.triajeDefinitivoColor.toLowerCase() === 'amarillo' ? 'bg-yellow-400' : /* Cambiado a un amarillo más oscuro */
                      paciente.triajeDefinitivoColor.toLowerCase() === 'verde' ? 'bg-green-400 text-white' :
                      paciente.triajeDefinitivoColor.toLowerCase() === 'azul' ? 'bg-blue-400 text-white' : 'bg-gray-300'
                    }`}
                    >
                      {paciente.triajeDefinitivoNombre}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{paciente.nombre}</span>
                          {paciente.tieneAtencionPendiente && (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                              EN CURSO
                            </span>
                          )}
                        </div>
                        {/* OBSERVACIÓN DE ESCALAMIENTO */}
                        {paciente.prioridadEnfermeria === 1 && paciente.observacionEscalamiento && (
                          <div className="text-red-700 text-xs mt-1 p-2 bg-red-100 rounded border border-red-300">
                            <span className="font-bold">📋 Observación Enfermería:</span>
                            <p className="mt-1">{paciente.observacionEscalamiento}</p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4">{paciente.cedula}</td>
                    <td className="py-2 px-4">{paciente.fechaAdmision}</td>
                    <td className="py-2 px-4">
                      {paciente.ultimoSignoVital ? new Date(paciente.ultimoSignoVital.fechaHoraRegistro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : paciente.horaAdmision}
                    </td>
                    <td className="py-2 px-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                      {/* Botón Registrar Llamado: Visible para todos los roles */}
                      <button
                        onClick={(e) => handleIncrementarLlamado(paciente.admisionId, e)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm flex-grow sm:flex-grow-0"
                        title="Registrar intento de llamado"
                      >
                        📞 Llamar
                      </button>
                      {showAttendButton && !showContinuarButton && (
                        <button
                          onClick={() => handleAtenderPaciente(paciente.admisionId)}
                          className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm flex-grow sm:flex-grow-0"
                        >
                          Atender
                        </button>
                      )}
                      {showContinuarButton && (
                        <button
                          onClick={() => {
                            // Pasar el atencionId si existe para que el formulario cargue los datos guardados
                            const url = paciente.atencionId 
                              ? `/atencion-emergencia-page/${paciente.admisionId}?atencionId=${paciente.atencionId}`
                              : `/atencion-emergencia-page/${paciente.admisionId}`;
                            navigate(url);
                          }}
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm flex-grow sm:flex-grow-0"
                        >
                          Continuar Atención
                        </button>
                      )}
                      {/* Botón Continuar Atención: Para administradores (rol_id 1) o médicos (rol_id 2) si el paciente está EN_ATENCION y asignado a este médico */}
                      {currentUserId && (userRolId === 1 || userRolId === 2) && paciente.estadoPaciente === 'EN_ATENCION' && paciente.usuarioResponsableId === currentUserId && !showContinuarButton && (
                        <button
                          onClick={() => navigate(`/atencion-emergencia-page/${paciente.admisionId}`)}
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm flex-grow sm:flex-grow-0"
                        >
                          Continuar Atención
                        </button>
                      )}
                      {/* Botón Reasignar Paciente: Para administradores (rol_id 1) o médicos (rol_id 2) si el paciente está EN_ATENCION y no asignado a este médico o no tiene médico asignado */}
                      {currentUserId && paciente.estadoPaciente === 'EN_ATENCION' && ((userRolId === 1) || (userRolId === 2 && (paciente.usuarioResponsableId !== currentUserId || !paciente.usuarioResponsableId))) && (
                        <button
                          onClick={() => handleOpenReasignModal(paciente.admisionId, paciente.usuarioResponsableId)}
                          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm flex-grow sm:flex-grow-0"
                        >
                          Reasignar Paciente
                        </button>
                      )}
                      {/* Botón Ver Historial: Visible para todos los roles */}
                      <button
                        onClick={() => navigate(`/historial/${paciente.pacienteId}`)}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm flex-grow sm:flex-grow-0"
                      >
                        Ver Historial
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </main>
      {isReasignModalOpen && selectedAdmisionToReasign && (
        <ReasignarPacienteModal
          isOpen={isReasignModalOpen}
          onClose={handleCloseReasignModal}
          admisionId={selectedAdmisionToReasign.admisionId}
          currentMedicoId={selectedAdmisionToReasign.currentMedicoId}
          onReasignSuccess={handleReasignSuccess}
        />
      )}
    </div>
  );
};

export default ListaEspera;