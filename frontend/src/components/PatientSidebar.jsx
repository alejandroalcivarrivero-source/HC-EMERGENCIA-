import React from 'react';
import { format, parseISO } from 'date-fns';
import { Activity, Heart, Droplet, Thermometer, Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

const TrendIcon = ({ direction }) => {
  if (direction === 'up') return <TrendingUp className="w-4 h-4 text-amber-600" />;
  if (direction === 'down') return <TrendingDown className="w-4 h-4 text-blue-600" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

/**
 * Columna izquierda: Seguridad y datos base
 * - Signos vitales compactos con flecha de tendencia vs toma anterior
 * - Antecedentes relevantes
 */
const PatientSidebar = ({ signosVitales, signosVitalesHistorial = [], antecedentes, alergias = [], readOnly = false }) => {
  const sv = signosVitales;
  const prev = signosVitalesHistorial[1] || null;

  return (
    <div className="w-80 flex-shrink-0 space-y-4" style={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}>
      {/* Signos vitales: iconos pequeños (corazón, termómetro, etc.) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Signos Vitales</h3>

        {sv?.sin_constantes_vitales ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
            <p className="text-red-800 font-semibold text-sm">⚠️ Sin constantes vitales</p>
            {sv.fecha_hora_registro && (
              <p className="text-red-600 text-xs mt-1">
                {format(parseISO(sv.fecha_hora_registro), 'dd/MM/yyyy HH:mm')}
              </p>
            )}
          </div>
        ) : sv ? (
          <div className="space-y-2">
            {sv.fecha_hora_registro && (
              <p className="text-xs text-gray-500 mb-2">
                {format(parseISO(sv.fecha_hora_registro), 'dd/MM/yyyy HH:mm')}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {sv.temperatura != null && sv.temperatura !== '' && (
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs text-gray-500">Temp</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 text-sm">{sv.temperatura}°</span>
                    <TrendIcon direction={trend(sv.temperatura, prev?.temperatura)} />
                  </div>
                </div>
              )}
              {sv.presion_arterial && (
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-xs text-gray-500">PA</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 text-sm">{sv.presion_arterial}</span>
                    <TrendIcon direction="stable" />
                  </div>
                </div>
              )}
              {sv.frecuencia_cardiaca != null && sv.frecuencia_cardiaca !== '' && (
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-xs text-gray-500">FC</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 text-sm">{sv.frecuencia_cardiaca}</span>
                    <TrendIcon direction={trend(sv.frecuencia_cardiaca, prev?.frecuencia_cardiaca)} />
                  </div>
                </div>
              )}
              {sv.frecuencia_respiratoria != null && sv.frecuencia_respiratoria !== '' && (
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-500 shrink-0" />
                    <span className="text-xs text-gray-500">FR</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 text-sm">{sv.frecuencia_respiratoria}</span>
                    <TrendIcon direction={trend(sv.frecuencia_respiratoria, prev?.frecuencia_respiratoria)} />
                  </div>
                </div>
              )}
              {sv.saturacion_oxigeno != null && sv.saturacion_oxigeno !== '' && (
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span className="text-xs text-gray-500">SpO₂</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 text-sm">{sv.saturacion_oxigeno}%</span>
                    <TrendIcon direction={trend(sv.saturacion_oxigeno, prev?.saturacion_oxigeno)} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No hay signos vitales registrados</p>
        )}
      </div>

      {/* Antecedentes */}
      {antecedentes && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">Antecedentes</h3>
          <div className="space-y-2 text-sm">
            {antecedentes.clinicos && (
              <div>
                <span className="font-semibold text-gray-700">Clínicos:</span>
                <p className="text-gray-600 mt-0.5">{antecedentes.clinicos}</p>
              </div>
            )}
            {antecedentes.quirurgicos && (
              <div>
                <span className="font-semibold text-gray-700">Quirúrgicos:</span>
                <p className="text-gray-600 mt-0.5">{antecedentes.quirurgicos}</p>
              </div>
            )}
            {antecedentes.farmacologicos && (
              <div>
                <span className="font-semibold text-gray-700">Farmacológicos:</span>
                <p className="text-gray-600 mt-0.5">{antecedentes.farmacologicos}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSidebar;
