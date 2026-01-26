import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import PatientBanner from '../components/PatientBanner';
import AtencionEmergenciaForm from '../components/AtencionEmergenciaForm';
import DiagnosticosCIE10 from '../components/DiagnosticosCIE10';
import ReasignarPacienteModal from '../components/ReasignarPacienteModal';
import FirmaElectronica from '../components/FirmaElectronica';
import { CheckCircle2 } from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';

const AtencionEmergenciaPage = () => {
  const { admisionId } = useParams();
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();
  const [atencion, setAtencion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [atencionesAnteriores, setAtencionesAnteriores] = useState([]);
  const [admisionDetails, setAdmisionDetails] = useState(null);
  const [signosVitalesDetails, setSignosVitalesDetails] = useState(null);
  const [signosVitalesHistorial, setSignosVitalesHistorial] = useState([]);
  const [motivoConsulta, setMotivoConsulta] = useState(null);
  const [showReasignarModal, setShowReasignarModal] = useState(false);
  const [alergias, setAlergias] = useState([]);

  useEffect(() => {
    const fetchAtencionAndHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Obtener datos de la admisión primero
        const admisionDetailsResponse = await axios.get(`http://localhost:3001/api/admisiones/${admisionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAdmisionDetails(admisionDetailsResponse.data);

        // Obtener signos vitales (último + historial para tendencia)
        const signosVitalesResponse = await axios.get(`http://localhost:3001/api/signos-vitales/${admisionId}?historial=true`, {
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
            `http://localhost:3001/api/pendientes-firma/prellenado/${admisionId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setMotivoConsulta(prellenadoResponse.data.motivoConsulta);
        } catch (err) {
          console.error('Error al obtener datos de pre-llenado:', err);
        }

        // Obtener la atención de emergencia actual (si existe)
        let currentAtencion = null;
        try {
          const atencionResponse = await axios.get(`http://localhost:3001/api/atencion-emergencia/admision/${admisionId}`, {
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
                // Dividir por comas o punto y coma
                const alergiasArray = antecedentes.alergicos
                  .split(/[,;]/)
                  .map(a => a.trim())
                  .filter(a => a.length > 0);
                setAlergias(alergiasArray);
              }
            } catch (e) {
              console.error('Error al parsear antecedentes:', e);
            }
          }
        } catch (err) {
          if (err.response && err.response.status === 404) {
            console.log('No existe atención de emergencia previa para esta admisión.');
          } else {
            throw err;
          }
        }

        // Obtener el historial de atenciones del paciente
        const pacienteIdToFetchHistory = currentAtencion 
          ? currentAtencion.pacienteId 
          : admisionDetailsResponse.data.pacienteId;

        if (pacienteIdToFetchHistory) {
          const historialResponse = await axios.get(
            `http://localhost:3001/api/atencion-emergencia/historial/${pacienteIdToFetchHistory}`,
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
  const antecedentes = atencion?.antecedentesPatologicos 
    ? (typeof atencion.antecedentesPatologicos === 'string' 
        ? JSON.parse(atencion.antecedentesPatologicos) 
        : atencion.antecedentesPatologicos)
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc', fontFamily: "'Inter', 'Roboto', sans-serif" }}>
      <Header />
      <PatientBanner
        paciente={paciente}
        admision={admisionDetails}
        triaje={triaje}
        alergias={alergias}
        atencion={atencion}
        onReasignar={() => setShowReasignarModal(true)}
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
              atencionData={atencion}
              admisionData={admisionDetails}
              signosVitalesData={signosVitalesDetails}
              motivoConsulta={motivoConsulta}
            />
          </div>

          {/* Diagnósticos CIE-10 */}
          {atencion && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <DiagnosticosCIE10
                atencionId={atencion.id}
                readOnly={atencion.estadoFirma === 'FIRMADO'}
              />
            </div>
          )}

          {/* Finalizar y Firmar */}
          {atencion && atencion.estadoFirma === 'PENDIENTE' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Finalizar y Firmar</h3>
              <FirmaElectronica atencionId={atencion.id} />
            </div>
          )}

          {/* Formulario Firmado */}
          {atencion && atencion.estadoFirma === 'FIRMADO' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 text-emerald-700">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Formulario firmado</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Bloqueado para edición.</p>
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
