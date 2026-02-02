import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns'; // Para manejar fechas y horas
import Header from '../components/Header';
import PatientBanner from '../components/PatientBanner';
import AtencionEmergenciaForm from '../components/AtencionEmergenciaForm';
import ReasignarPacienteModal from '../components/ReasignarPacienteModal';
import FirmaElectronica from '../components/FirmaElectronica';
import { CheckCircle2 } from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';

const API_BASE = 'http://localhost:3001/api'; // Definir API_BASE aquí

const AtencionEmergenciaPage = () => {
  const { admisionId } = useParams();
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();
  const [atencion, setAtencion] = useState(null);
  const [formData, setFormData] = useState({}); // Nuevo estado para los datos del formulario
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [atencionesAnteriores, setAtencionesAnteriores] = useState([]);
  const [admisionDetails, setAdmisionDetails] = useState(null);
  const [signosVitalesDetails, setSignosVitalesDetails] = useState(null);
  const [signosVitalesHistorial, setSignosVitalesHistorial] = useState([]);
  const [motivoConsulta, setMotivoConsulta] = useState(null);
  const [showReasignarModal, setShowReasignarModal] = useState(false);
  const [alergias, setAlergias] = useState([]);
  const [userRol, setUserRol] = useState(null);

  useEffect(() => {
    const fetchAtencionAndHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          console.log('Datos del Usuario:', tokenData);
          setUserRol(tokenData.rol_id);
        } catch (e) {
          console.error("Error al decodificar token:", e);
        }

        // Obtener datos de la admisión primero
        const admisionDetailsResponse = await axios.get(`${API_BASE}/admisiones/${admisionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAdmisionDetails(admisionDetailsResponse.data);

        // Obtener signos vitales (último + historial para tendencia)
        const signosVitalesResponse = await axios.get(`${API_BASE}/signos-vitales/${admisionId}?historial=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const historial = Array.isArray(signosVitalesResponse.data) ? signosVitalesResponse.data : [];
        setSignosVitalesHistorial(historial);

        let signosVitalesData = null;
        if (historial.length > 0) {
          const ultimoSignoVital = historial[0];
          if (ultimoSignoVital.sin_constantes_vitales) {
            signosVitalesData = {
              sin_constantes_vitales: true,
              fecha_hora_registro: ultimoSignoVital.fecha_hora_registro
            };
          } else {
            signosVitalesData = ultimoSignoVital;
          }
        }
        setSignosVitalesDetails(signosVitalesData);

        // Obtener motivo de consulta y datos de pre-llenado
        try {
          const prellenadoResponse = await axios.get(
            `${API_BASE}/pendientes-firma/prellenado/${admisionId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setMotivoConsulta(prellenadoResponse.data.motivoConsulta);
        } catch (err) {
          console.error('Error al obtener datos de pre-llenado:', err);
        }

        // Obtener la atención de emergencia actual (si existe)
        let currentAtencion = null;
        let borradorData = null;

        try {
          const atencionResponse = await axios.get(`${API_BASE}/atencion-emergencia/admision/${admisionId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          currentAtencion = atencionResponse.data;
          setAtencion(currentAtencion);

          // Extraer alergias de los antecedentes patológicos
          if (currentAtencion.antecedentesPatologicos) {
            try {
              const antecedentes = typeof currentAtencion.antecedentesPatologicos === 'string'
                ? JSON.parse(currentAtencion.antecedentesPatologicos)
                : currentAtencion.antecedentesPatologicos;
              
              if (antecedentes.alergicos && antecedentes.alergicos.trim()) {
                const alergiasArray = antecedentes.alergicos
                  .split(/[,;]/)
                  .map(a => a.trim())
                  .filter(a => a.length > 0);
                setAlergias(alergiasArray);
              }
            } catch (e) {
              console.error('Error al parsear antecedentes (AtencionEmergenciaPage):', e);
            }
          }
        } catch (err) {
          // Manejo Silencioso de Error 404 (Estabilidad)
          if (err.response && err.response.status === 404) {
            console.log('[AtencionEmergenciaPage] 404 en consulta de atención. Procediendo a carga de borrador (temporal_guardado).');
            // No lanzamos error, permitimos que el flujo continúe hacia la carga del borrador
          } else {
            throw err;
          }
        }

        // Intentar cargar el borrador si existe un ID de atención (o admisionId si no hay atención)
        const idParaBorrador = currentAtencion?.id || parseInt(admisionId, 10);
        if (idParaBorrador) {
          try {
            const borradorResponse = await axios.get(`${API_BASE}/atencion-emergencia/borrador/${idParaBorrador}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (borradorResponse.data && borradorResponse.data.datos) {
              borradorData = borradorResponse.data.datos;
              console.log('Borrador cargado exitosamente.');
              // Inicializar formData con los datos del borrador, sobrescribiendo si hay currentAtencion
              setFormData(borradorData);
            } else if (currentAtencion) {
              // Si hay atención pero no borrador, inicializar formData con la atención
              setFormData(currentAtencion);
            } else {
              console.log('No se encontró borrador, continuando con inicialización por defecto.');
            }
          } catch (err) {
            if (err.response && err.response.status === 404) {
              console.log('No se encontró borrador para esta atención/admisión. Continuando con inicialización por defecto.');
            } else {
              console.error('Error al cargar borrador (AtencionEmergenciaPage):', err);
            }
          }
        } else if (currentAtencion) {
          // Si hay atención pero no se pudo determinar un ID para borrador, usar la atención
          setFormData(currentAtencion);
        }

        // Si no hay atención ni borrador, inicializar formData con valores por defecto (si es necesario)
        if (!currentAtencion && !borradorData) {
          setFormData(prev => ({
            ...prev,
            fechaAtencion: format(new Date(), 'yyyy-MM-dd'),
            horaAtencion: format(new Date(), 'HH:mm'),
            // Asegurarse de que otros campos complejos se inicialicen correctamente
            // Esto es crucial porque AtencionEmergenciaForm esperará estos objetos
            tipoAccidenteViolenciaIntoxicacion: { seleccion: [], transito: { consumoSustancias: '', proteccion: { casco: false, cinturon: false } } },
            antecedentesPatologicos: {
              alergicos: '', clinicos: '', ginecologicos: '', traumaticos: '', pediatricos: '', quirurgicos: '', farmacologicos: '', habitos: '', familiares: '', otros: '',
              noAplicaGeneral: false, noAplica: { alergicos: false, clinicos: false, ginecologicos: false, traumaticos: false, pediatricos: false, quirurgicos: false, farmacologicos: false, habitos: false, familiares: false, otros: false }
            },
            examenFisico: {
              // Valores iniciales de examenFisico aquí. Serán sobrescritos por signosVitalesData si existen.
              glasgow_ocular: null, glasgow_verbal: null, glasgow_motora: null,
              pupilas_derecha: '', pupilas_izquierda: '', tiempo_llenado_capilar: null,
              glicemia_capilar: null, perimetro_cefalico: null, peso: null, talla: null
            },
            examenFisicoTraumaCritico: '',
            embarazoParto: { estadoGestacion: '', numeroGestas: null, numeroPartos: null, numeroAbortos: null, numeroCesareas: null, fum: '', semanasGestacion: null, movimientoFetal: false, frecuenciaCardiacaFetal: null, rupturaMembranas: false, tiempo: '', afu: '', presentacion: '', dilatacion: '', borramiento: '', plano: '', pelvisViable: false, sangradoVaginal: false, contracciones: false, scoreMama: null },
            examenesComplementarios: {
              examenes_no_aplica: false,
              items: Object.fromEntries([...Array(16)].map((_, i) => [i + 1, false])),
              observaciones: ''
            },
            planTratamiento: [],
            observacionesPlanTratamiento: '',
            condicionEgreso: '',
            referenciaEgreso: '',
            establecimientoEgreso: ''
          }));
        }

        // Obtener el historial de atenciones del paciente
        const pacienteIdToFetchHistory = currentAtencion 
          ? currentAtencion.pacienteId 
          : admisionDetailsResponse.data.pacienteId;

        if (pacienteIdToFetchHistory) {
          const historialResponse = await axios.get(
            `${API_BASE}/atencion-emergencia/historial/${pacienteIdToFetchHistory}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setAtencionesAnteriores(historialResponse.data);
        }

      } catch (err) {
        console.error('Error al cargar la atención o el historial:', err);
        setError('Error al cargar los datos de atención. Intente de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchAtencionAndHistory();
  }, [admisionId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando atención de emergencia...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!admisionDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p>No se encontraron datos de admisión para este paciente.</p>
        </div>
      </div>
    );
  }

  const paciente = admisionDetails.Paciente;
  const triaje = admisionDetails.TriajeDefinitivo;
  // `antecedentes` ahora debe basarse en `formData` para estar sincronizado
  const antecedentes = formData?.antecedentesPatologicos 
    ? (typeof formData.antecedentesPatologicos === 'string' 
        ? JSON.parse(formData.antecedentesPatologicos) 
        : formData.antecedentesPatologicos)
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc', fontFamily: "'Inter', 'Roboto', sans-serif" }}>
      <Header />
      <PatientBanner
        paciente={paciente}
        admision={admisionDetails}
        triaje={triaje}
        alergias={alergias}
        atencion={atencion} // Se sigue pasando 'atencion' para el estado de firma y ID
        onReasignar={(() => {
          const canReassign = [1, 2, 5].includes(Number(userRol));
          console.log('Prop onReasignar calculada - UserRol:', userRol, 'Puede reasignar:', canReassign);
          return canReassign ? () => setShowReasignarModal(true) : null;
        })()}
        signosVitales={signosVitalesDetails}
        signosVitalesHistorial={signosVitalesHistorial}
        motivoConsulta={motivoConsulta}
      />

      <div 
        className="container mx-auto px-6 py-6 transition-all duration-300" 
        style={{
          backgroundColor: '#f8fafc',
          marginLeft: isSidebarOpen ? '256px' : '0'
        }}
      >
        {/* Layout de una sola columna expandida */}
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Formulario de Atención */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <AtencionEmergenciaForm
              admisionId={admisionId}
              atencionData={atencion} // Todavía se pasa atencionData original para el ID y estado de firma
              admisionData={admisionDetails}
              signosVitalesData={signosVitalesDetails}
              motivoConsulta={motivoConsulta}
              readOnly={atencion?.estadoFirma === 'FINALIZADO_FIRMADO'}
              onAlergiasChange={setAlergias}
              formData={formData} // Pasar formData
              setFormData={setFormData} // Pasar setFormData
            />
          </div>

          {/* Firmar y Cerrar: solo si no está finalizado/firmado */}
          {atencion && atencion.estadoFirma !== 'FINALIZADO_FIRMADO' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Firmar y Cerrar</h3>
              <FirmaElectronica atencionId={atencion.id} />
            </div>
          )}

          {/* Formulario cerrado legalmente (FINALIZADO_FIRMADO) */}
          {atencion && atencion.estadoFirma === 'FINALIZADO_FIRMADO' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 text-emerald-700">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Formulario cerrado legalmente</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Este formulario está cerrado legalmente. Cualquier adición debe realizarse mediante el Formulario 005 (Evolución).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Reasignación */}
      {atencion && (
        <ReasignarPacienteModal
          isOpen={showReasignarModal}
          onClose={() => setShowReasignarModal(false)}
          atencionId={atencion.id}
          onReasignado={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default AtencionEmergenciaPage;
