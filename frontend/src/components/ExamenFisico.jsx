import React, { useState } from 'react';
import { Search, CheckCircle, AlertCircle, FileText } from 'lucide-react';

/** Sección H – 15 ítems normativos del Examen Físico Regional (Form 008) - Orden Cefalocaudal */
const EXAMEN_FISICO_REGIONAL_ITEMS = [
  { key: 'estado_general', label: 'Estado general', num: 1 },
  { key: 'piel_faneras', label: 'Piel y faneras', num: 2 },
  { key: 'cabeza', label: 'Cabeza', num: 3 },
  { key: 'ojos', label: 'Ojos', num: 4 },
  { key: 'oidos', label: 'Oídos', num: 5 },
  { key: 'nariz', label: 'Nariz', num: 6 },
  { key: 'boca', label: 'Boca', num: 7 },
  { key: 'orofaringe', label: 'Orofaringe', num: 8 },
  { key: 'cuello', label: 'Cuello', num: 9 },
  { key: 'axilas_mamas', label: 'Axilas y mamas', num: 10 },
  { key: 'torax', label: 'Tórax', num: 11 },
  { key: 'abdomen', label: 'Abdomen', num: 12 },
  { key: 'columna_vertebral', label: 'Columna vertebral', num: 13 },
  { key: 'miembros_superiores', label: 'Miembros superiores', num: 14 },
  { key: 'miembros_inferiores', label: 'Miembros inferiores', num: 15 },
];

const ExamenFisico = ({ formData, setFormData, readOnly }) => {
  const [revision, setRevision] = useState(0);

  const handleNestedChange = (section, field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value
      }
    }));
  };

  const handleMarcarTodoNormalExamenRegional = () => {
    setFormData(prevData => {
      const nextEF = { ...prevData.examenFisico };
      EXAMEN_FISICO_REGIONAL_ITEMS.forEach(({ key }) => {
        nextEF[key] = ''; // Limpiar descripción
        nextEF[`${key}_normal`] = true; // Marcar normal
      });
      return { ...prevData, examenFisico: nextEF };
    });
    setRevision(r => r + 1);
  };

  const d = formData.tipoAccidenteViolenciaIntoxicacion || {};
  const seleccion = Array.isArray(d.seleccion) ? d.seleccion : [];
  const hayEventoTraumatico = seleccion.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sección H: Examen Físico Regional (Sistemático) */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
             <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    Examen Físico Regional
                </h2>
                <p className="text-xs text-gray-500">Revisión Sistemática (Cefalocaudal)</p>
             </div>
             {!readOnly && (
                <button
                    type="button"
                    onClick={handleMarcarTodoNormalExamenRegional}
                    className="text-xs px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg transition-colors font-medium flex items-center gap-1"
                >
                    <CheckCircle className="w-3 h-3" />
                    Marcar todo Normal
                </button>
             )}
          </div>
          
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-4 max-h-[600px] overflow-y-auto">
             {EXAMEN_FISICO_REGIONAL_ITEMS.map(({ key, label, num }) => {
                 const ef = formData.examenFisico || {};
                 const esNormal = ef[`${key}_normal`] !== false;
                 
                 return (
                     <div key={key} className={`p-3 rounded-lg border transition-all duration-200 ${esNormal ? 'border-gray-100 bg-white' : 'border-amber-200 bg-amber-50 shadow-sm col-span-1 md:col-span-2'}`}>
                         <div className="flex items-center justify-between mb-2">
                             <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={esNormal}
                                    onChange={(e) => handleNestedChange('examenFisico', `${key}_normal`, e.target.checked)}
                                    disabled={readOnly}
                                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className={`text-sm font-semibold ${esNormal ? 'text-gray-600' : 'text-amber-800'}`}>
                                    {num}. {label}
                                </span>
                             </label>
                             {esNormal ? (
                                 <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">Normal</span>
                             ) : (
                                 <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 font-bold flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Patológico
                                 </span>
                             )}
                         </div>
                         
                         {!esNormal && (
                             <div className="animate-fade-in-down">
                                 <textarea
                                    value={ef[key] || ''}
                                    onChange={(e) => handleNestedChange('examenFisico', key, e.target.value)}
                                    disabled={readOnly}
                                    placeholder={`Describa el hallazgo patológico en ${label.toLowerCase()}...`}
                                    className="w-full text-sm border-amber-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 bg-white"
                                    rows={3}
                                    autoFocus
                                 />
                             </div>
                         )}
                     </div>
                 );
             })}
          </div>
        </div>

        {/* Sección I: Examen de Trauma / Crítico */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
             <div className={`flex-1 rounded-xl border p-4 flex flex-col ${hayEventoTraumatico ? 'border-amber-400 bg-amber-50/30' : 'border-gray-200 bg-white'}`}>
                <div className="mb-3">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        Examen Trauma / Crítico
                    </h2>
                    <p className="text-xs text-gray-500">Evaluación primaria (ABCDE)</p>
                </div>
                
                <textarea
                    id="examenFisicoTraumaCritico"
                    name="examenFisicoTraumaCritico"
                    value={formData.examenFisicoTraumaCritico || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, examenFisicoTraumaCritico: e.target.value }))}
                    disabled={readOnly}
                    placeholder="Describa hallazgos según esquema ABCDE (Vía aérea, Respiración, Circulación, Déficit neurológico, Exposición). Obligatorio para trauma."
                    className="flex-1 w-full text-sm border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 resize-none min-h-[300px]"
                />
                
                {hayEventoTraumatico && (
                    <div className="mt-3 p-2 bg-amber-100 rounded text-amber-800 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Se ha registrado un evento traumático. Complete esta sección con prioridad.</span>
                    </div>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default ExamenFisico;
