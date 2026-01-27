import React from 'react';
import { differenceInYears, parseISO, format } from 'date-fns';
import { User, Calendar, LogIn, Stethoscope, Circle, UserSearch, Activity, Heart, Droplet, Thermometer, Gauge, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';

/** Comparar valor actual vs anterior y devolver 'up' | 'down' | 'stable' */
function trend(current, previous) {
  if (previous == null || previous === '' || current == null || current === '') return 'stable';
  const c = parseFloat(String(current).replace(/[^0-9.]/g, ''));
  const p = parseFloat(String(previous).replace(/[^0-9.]/g, ''));
  if (Number.isNaN(c) || Number.isNaN(p)) return 'stable';
  if (c > p) return 'up';
  if (c < p) return 'down';
  return 'stable';
}

/** Indica si la PA sugiere hipertensión (sistólica ≥140 o diastólica ≥90). PA puede ser "120/80" o similar. */
function esHipertension(pa) {
  if (!pa || typeof pa !== 'string') return false;
  const parts = pa.split(/[/\s]/).map(s => parseFloat(s)).filter(n => !Number.isNaN(n));
  if (parts.length >= 2) {
    const sistolica = parts[0];
    const diastolica = parts[1];
    return sistolica >= 140 || diastolica >= 90;
  }
  return false;
}

const TrendIcon = ({ direction }) => {
  if (direction === 'up') return <TrendingUp className="w-3 h-3 text-amber-600" />;
  if (direction === 'down') return <TrendingDown className="w-3 h-3 text-blue-600" />;
  return <Minus className="w-3 h-3 text-gray-400" />;
};

/**
 * Banner compacto y moderno – Minimalist Clinical
 * Timeline compacto arriba derecha, botón reasignar reemplaza badge de triaje.
 * Signos vitales horizontales debajo del nombre del paciente.
 * Motivo de consulta debajo del timeline.
 * Se autoajusta cuando el sidebar se abre/cierra.
 */
const PatientBanner = ({ paciente, admision, triaje, alergias = [], atencion, onReasignar, signosVitales, signosVitalesHistorial = [], motivoConsulta }) => {
  const { isSidebarOpen } = useSidebar();
  
  if (!paciente || !admision) return null;

  const edad = paciente.fecha_nacimiento
    ? differenceInYears(new Date(), parseISO(paciente.fecha_nacimiento))
    : 'N/A';

  const nombreCompleto = `${paciente.primer_nombre || ''} ${paciente.segundo_nombre || ''} ${paciente.primer_apellido || ''} ${paciente.segundo_apellido || ''}`.trim();

  const triajeNombre = triaje?.nombre || 'N/A';

  // Timeline compacto: Ingreso -> Triaje -> Inicio de Atención
  const ingresoAt = admision?.fecha_hora_admision
    ? format(parseISO(admision.fecha_hora_admision), 'dd/MM/yyyy HH:mm')
    : '—';
  const inicioAt = atencion?.fechaAtencion && atencion?.horaAtencion
    ? format(parseISO(`${atencion.fechaAtencion}T${atencion.horaAtencion}`), 'dd/MM/yyyy HH:mm')
    : '—';

  // Signos vitales para tendencia
  const sv = signosVitales;
  const prev = signosVitalesHistorial[1] || null;

  return (
    <div
      className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm transition-all duration-300"
      style={{ 
        fontFamily: "'Inter', 'Roboto', sans-serif",
        marginLeft: isSidebarOpen ? '256px' : '0'
      }}
    >
      <div className="container mx-auto px-5 py-3">
        {/* Alerta de alergias – aviso de peligro en header del paciente */}
        {alergias && alergias.length > 0 && (
          <div className="mb-3 px-4 py-2 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span className="text-sm font-semibold">Alergias:</span>
            <span className="text-sm">{alergias.join(', ')}</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Columna izquierda: Datos del paciente */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900 truncate">
                    {nombreCompleto || 'Paciente'}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {edad} años
                    </span>
                    <span>·</span>
                    <span>CI {paciente.numero_identificacion || 'N/A'}</span>
                  </div>
                </div>
              </div>
              {/* Botón Reasignar reemplaza el badge de triaje */}
              {atencion && atencion.estadoFirma !== 'FINALIZADO_FIRMADO' && onReasignar && (
                <button
                  onClick={onReasignar}
                  className="shrink-0 flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold shadow-sm"
                >
                  <UserSearch className="w-3.5 h-3.5" />
                  Reasignar
                </button>
              )}
            </div>

            {/* Signos Vitales - Horizontal debajo del nombre */}
            {sv && !sv.sin_constantes_vitales && (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {sv.temperatura != null && sv.temperatura !== '' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg">
                    <Thermometer className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs text-gray-500">Temp:</span>
                    <span className="text-xs font-semibold text-gray-900">{sv.temperatura}°</span>
                    <TrendIcon direction={trend(sv.temperatura, prev?.temperatura)} />
                  </div>
                )}
                {sv.presion_arterial && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${esHipertension(sv.presion_arterial) ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <Gauge className={`w-3.5 h-3.5 shrink-0 ${esHipertension(sv.presion_arterial) ? 'text-red-600' : 'text-rose-500'}`} />
                    <span className="text-xs text-gray-500">PA:</span>
                    <span className={`text-xs font-semibold ${esHipertension(sv.presion_arterial) ? 'text-red-700' : 'text-gray-900'}`}>{sv.presion_arterial}</span>
                    <TrendIcon direction="stable" />
                  </div>
                )}
                {sv.frecuencia_cardiaca != null && sv.frecuencia_cardiaca !== '' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg">
                    <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="text-xs text-gray-500">FC:</span>
                    <span className="text-xs font-semibold text-gray-900">{sv.frecuencia_cardiaca}</span>
                    <TrendIcon direction={trend(sv.frecuencia_cardiaca, prev?.frecuencia_cardiaca)} />
                  </div>
                )}
                {sv.frecuencia_respiratoria != null && sv.frecuencia_respiratoria !== '' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg">
                    <Activity className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="text-xs text-gray-500">FR:</span>
                    <span className="text-xs font-semibold text-gray-900">{sv.frecuencia_respiratoria}</span>
                    <TrendIcon direction={trend(sv.frecuencia_respiratoria, prev?.frecuencia_respiratoria)} />
                  </div>
                )}
                {sv.saturacion_oxigeno != null && sv.saturacion_oxigeno !== '' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg">
                    <Droplet className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span className="text-xs text-gray-500">SpO₂:</span>
                    <span className="text-xs font-semibold text-gray-900">{sv.saturacion_oxigeno}%</span>
                    <TrendIcon direction={trend(sv.saturacion_oxigeno, prev?.saturacion_oxigeno)} />
                  </div>
                )}
              </div>
            )}
            {sv?.sin_constantes_vitales && (
              <div className="mt-2">
                <span className="text-xs text-red-600 font-semibold px-2.5 py-1 bg-red-50 rounded-lg">
                  ⚠️ Sin constantes vitales
                </span>
              </div>
            )}
          </div>

          {/* Columna derecha: Timeline y Motivo de consulta */}
          <div className="flex flex-col items-start gap-2 shrink-0">
            {/* Timeline compacto horizontal */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <LogIn className="w-3 h-3 text-blue-600" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-gray-500 uppercase leading-none">Ingreso</p>
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{ingresoAt}</p>
                </div>
              </div>
              <div className="w-0.5 h-8 bg-gray-200 mx-1" />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <Stethoscope className="w-3 h-3 text-amber-600" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-gray-500 uppercase leading-none">Triaje</p>
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{triajeNombre}</p>
                </div>
              </div>
              {inicioAt !== '—' && (
                <>
                  <div className="w-0.5 h-8 bg-gray-200 mx-1" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <Circle className="w-2.5 h-2.5 fill-green-600 text-green-600" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-gray-500 uppercase leading-none">Inicio</p>
                      <p className="text-xs font-semibold text-gray-800 leading-tight">{inicioAt}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Motivo de consulta debajo del timeline */}
            {motivoConsulta && (
              <div className="bg-sky-50 border border-sky-100 rounded-xl px-3 py-2 min-w-[300px] max-w-[400px]">
                <p className="text-xs font-semibold text-sky-900 mb-1">Motivo de consulta:</p>
                <p 
                  className="text-xs text-sky-800 leading-tight"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {motivoConsulta}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientBanner;
