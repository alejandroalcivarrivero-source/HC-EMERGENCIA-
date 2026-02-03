import React from 'react';
import { AlertCircle, CheckSquare, ShieldCheck } from 'lucide-react';

/** Campos oficiales MSP Sección E (Antecedentes Patológicos) – orden y etiquetas */
const CAMPOS_ANTECEDENTES = [
  { key: 'alergicos', label: 'Alérgicos', num: 1, placeholder: 'Medicamentos, alimentos, insectos...' },
  { key: 'clinicos', label: 'Clínicos', num: 2, placeholder: 'HTA, Diabetes, Asma, Hipotiroidismo...' },
  { key: 'ginecologicos', label: 'Ginecológicos', num: 3, placeholder: 'Ciclos, menarquia, FUM...' },
  { key: 'traumaticos', label: 'Traumatológicos', num: 4, placeholder: 'Fracturas, esguinces previos...' },
  { key: 'pediatricos', label: 'Pediátricos', num: 5, placeholder: 'Nacimiento, desarrollo, vacunas...' },
  { key: 'quirurgicos', label: 'Quirúrgicos', num: 6, placeholder: 'Cirugías previas, año, motivo...' },
  { key: 'farmacologicos', label: 'Farmacológicos', num: 7, placeholder: 'Medicación habitual...' },
  { key: 'habitos', label: 'Hábitos', num: 8, placeholder: 'Tabaco, alcohol, drogas, sueño...' },
  { key: 'familiares', label: 'Familiares', num: 9, placeholder: 'Antecedentes hereditarios...' },
  { key: 'otros', label: 'Otros', num: 10, placeholder: 'Otros antecedentes relevantes...' },
];

const AntecedentesPatologicos = ({ formData, setFormData, readOnly }) => {
  const ap = formData.antecedentesPatologicos || {};
  
  // Handlers locales para manipular el estado complejo de antecedentes
  const handleTextChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      antecedentesPatologicos: {
        ...prev.antecedentesPatologicos,
        [key]: value
      }
    }));
  };

  const setNoAplicaGeneralAntecedentes = (value) => {
    setFormData(prev => ({
      ...prev,
      antecedentesPatologicos: { 
        ...prev.antecedentesPatologicos, 
        noAplicaGeneral: !!value 
      }
    }));
  };

  const setNoAplicaCampoAntecedente = (fieldKey, value) => {
    setFormData(prev => ({
      ...prev,
      antecedentesPatologicos: {
        ...prev.antecedentesPatologicos,
        noAplica: { 
          ...(prev.antecedentesPatologicos?.noAplica || {}), 
          [fieldKey]: !!value 
        }
      }
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Antecedentes Patológicos
          </h2>
          <p className="text-sm text-gray-500">Sección E - Formulario 008</p>
        </div>

        {/* No aplica general */}
        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${ap.noAplicaGeneral ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
           <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!ap.noAplicaGeneral}
                onChange={(e) => setNoAplicaGeneralAntecedentes(e.target.checked)}
                disabled={readOnly}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className={`text-sm font-semibold ${ap.noAplicaGeneral ? 'text-green-800' : 'text-gray-600'}`}>
                No Refiere Antecedentes (General)
              </span>
           </label>
        </div>
      </div>
      
      {ap.noAplicaGeneral && (
          <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-green-800 text-sm flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Paciente niega antecedentes patológicos personales y familiares relevantes para la atención actual.
          </div>
      )}

      {/* Grid Layout - 2 columns on MD, 3 columns on XL for better use of space */}
      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ${ap.noAplicaGeneral ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        {CAMPOS_ANTECEDENTES.map(({ key, label, num, placeholder }) => {
          const valor = ap[key] != null ? ap[key] : "";
          const noAplicaCampo = !!(ap.noAplica && ap.noAplica[key]);
          
          return (
            <div key={key} className={`group relative flex flex-col bg-white border rounded-xl transition-all duration-200 ${noAplicaCampo ? 'border-gray-200 bg-gray-50' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}>
              
              {/* Header del Card */}
              <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                <label htmlFor={`antecedentes-${key}`} className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{num}</span>
                  {label}
                </label>
                
                {/* Checkbox individual No Aplica */}
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={noAplicaCampo}
                    onChange={(e) => setNoAplicaCampoAntecedente(key, e.target.checked)}
                    disabled={readOnly || !!ap.noAplicaGeneral}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700">No refiere</span>
                </label>
              </div>

              {/* Textarea Area */}
              <div className="p-3 flex-grow">
                <textarea
                  id={`antecedentes-${key}`}
                  value={valor}
                  onChange={(e) => handleTextChange(key, e.target.value)}
                  disabled={readOnly || noAplicaCampo || !!ap.noAplicaGeneral}
                  placeholder={noAplicaCampo ? "No refiere antecedentes." : placeholder}
                  rows={3}
                  className={`w-full text-sm bg-transparent border-0 p-0 focus:ring-0 resize-none placeholder-gray-400 ${noAplicaCampo ? 'text-gray-400 italic' : 'text-gray-700'}`}
                />
              </div>

              {/* Visual indicator line at bottom */}
              <div className={`h-1 w-full rounded-b-xl ${noAplicaCampo ? 'bg-gray-200' : valor.length > 0 ? 'bg-blue-500' : 'bg-transparent group-hover:bg-blue-200'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AntecedentesPatologicos;
