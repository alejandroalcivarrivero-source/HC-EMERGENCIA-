import React from 'react';
import { format, parseISO } from 'date-fns';
import { FileText } from 'lucide-react';

/**
 * Columna derecha: Solo Historial Rápido
 * El Timeline de Atención ahora está en el PatientBanner
 */
const PatientTimeline = ({ admision, atencion, atencionesAnteriores = [], admisionId }) => {
  // Últimos 3 diagnósticos de atenciones anteriores (excluyendo la actual)
  const diagnosticosPrevios = [];
  let count = 0;
  for (const a of atencionesAnteriores) {
    if (count >= 3) break;
    if (a.id === atencion?.id) continue;
    let defs = [];
    try {
      const raw = a.diagnosticosDefinitivos;
      defs = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw || [];
      if (!Array.isArray(defs)) defs = [];
    } catch (_) {}
    for (const d of defs) {
      if (count >= 3) break;
      const cod = d.cie || d.codigo;
      if (cod) {
        diagnosticosPrevios.push({ codigo: cod, descripcion: d.descripcion || '' });
        count++;
      }
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24" style={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}>
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-gray-500" />
        <h3 className="font-semibold text-gray-800 text-sm">Historial Rápido</h3>
      </div>
      {diagnosticosPrevios.length === 0 ? (
        <p className="text-gray-500 text-sm">Sin diagnósticos previos</p>
      ) : (
        <ul className="space-y-2">
          {diagnosticosPrevios.slice(0, 3).map((d, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="font-semibold text-blue-600 shrink-0">{d.codigo}</span>
              <span className="text-gray-700 truncate">{d.descripcion || '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PatientTimeline;
