import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const AtencionInicial = ({ formData, handleChange, admisionData, readOnly }) => {
  const motivoLen = (formData.motivoAtencion || '').length;
  const motivoValido = motivoLen >= 10; // Simple validation: at least 10 chars

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Calendar className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Atención Inicial</h2>
          <p className="text-sm text-gray-500">Registro de Tiempos y Condición de Llegada</p>
        </div>
      </div>
      
      {/* Grid: Fecha, Hora, Estado (Info) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <label htmlFor="fechaAtencion" className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            Fecha de Atención
          </label>
          <input
            type="date"
            id="fechaAtencion"
            name="fechaAtencion"
            value={formData.fechaAtencion || ''}
            onChange={handleChange}
            required
            readOnly={true} 
            className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 cursor-not-allowed opacity-75 font-semibold"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <label htmlFor="horaAtencion" className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            Hora de Atención
          </label>
          <input
            type="time"
            id="horaAtencion"
            name="horaAtencion"
            value={formData.horaAtencion || ''}
            onChange={handleChange}
            required
            readOnly={true}
            className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 cursor-not-allowed opacity-75 font-semibold"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-center text-center">
            <div>
                <p className="text-sm font-semibold text-blue-800">Registro Automático</p>
                <p className="text-xs text-blue-600 mt-1">Los tiempos se capturan al iniciar la atención para auditoría.</p>
            </div>
        </div>
      </div>

      {/* Selector de Condición de Llegada (3 columnas) */}
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          Condición de Llegada <span className="text-red-500">*</span>
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            type="button"
            onClick={() => !readOnly && handleChange({ target: { name: 'condicionLlegada', value: 'ESTABLE' } })}
            disabled={readOnly}
            className={`relative p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
              formData.condicionLlegada === 'ESTABLE'
                ? 'border-green-500 bg-green-50 shadow-md transform scale-[1.02]'
                : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
            } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
             {formData.condicionLlegada === 'ESTABLE' && <div className="absolute top-3 right-3 text-green-600"><CheckCircle className="w-5 h-5"/></div>}
             <div className="flex flex-col items-center">
               <span className="text-4xl mb-3">🟢</span>
               <span className={`font-bold text-lg ${formData.condicionLlegada === 'ESTABLE' ? 'text-green-800' : 'text-gray-700'}`}>ESTABLE</span>
               <span className="text-xs text-gray-500 mt-2 text-center">Signos vitales normales<br/>Sin riesgo inminente</span>
             </div>
          </button>

          <button
            type="button"
            onClick={() => !readOnly && handleChange({ target: { name: 'condicionLlegada', value: 'INESTABLE' } })}
            disabled={readOnly}
            className={`relative p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
              formData.condicionLlegada === 'INESTABLE'
                ? 'border-orange-500 bg-orange-50 shadow-md transform scale-[1.02]'
                : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
            } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {formData.condicionLlegada === 'INESTABLE' && <div className="absolute top-3 right-3 text-orange-600"><AlertTriangle className="w-5 h-5"/></div>}
            <div className="flex flex-col items-center">
               <span className="text-4xl mb-3">🟠</span>
               <span className={`font-bold text-lg ${formData.condicionLlegada === 'INESTABLE' ? 'text-orange-800' : 'text-gray-700'}`}>INESTABLE</span>
               <span className="text-xs text-gray-500 mt-2 text-center">Signos vitales alterados<br/>Requiere estabilización</span>
             </div>
          </button>

          <button
            type="button"
            onClick={() => !readOnly && handleChange({ target: { name: 'condicionLlegada', value: 'FALLECIDO' } })}
            disabled={readOnly}
            className={`relative p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
              formData.condicionLlegada === 'FALLECIDO'
                ? 'border-red-600 bg-red-50 shadow-md transform scale-[1.02]'
                : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/50'
            } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {formData.condicionLlegada === 'FALLECIDO' && <div className="absolute top-3 right-3 text-red-600"><XCircle className="w-5 h-5"/></div>}
            <div className="flex flex-col items-center">
               <span className="text-4xl mb-3">🔴</span>
               <span className={`font-bold text-lg ${formData.condicionLlegada === 'FALLECIDO' ? 'text-red-800' : 'text-gray-700'}`}>FALLECIDO</span>
               <span className="text-xs text-gray-500 mt-2 text-center">Sin signos de vida<br/>Protocolo de defunción</span>
             </div>
          </button>
        </div>
      </div>

      {/* Motivo de Atención */}
      <div className="bg-white p-1">
        <label htmlFor="motivoAtencion" className="block text-gray-700 text-sm font-bold mb-2">
          Motivo de Atención (Subjetivo) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
            <textarea
            id="motivoAtencion"
            name="motivoAtencion"
            value={formData.motivoAtencion || (admisionData.MotivoConsultaSintoma?.Motivo_Consulta_Sintoma || '')}
            onChange={handleChange}
            rows={5}
            readOnly={readOnly}
            placeholder={admisionData.MotivoConsultaSintoma?.Motivo_Consulta_Sintoma ? `Motivo de admisión: ${admisionData.MotivoConsultaSintoma.Motivo_Consulta_Sintoma}` : 'Describa el motivo de consulta según lo refiere el paciente...'}
            className={`block p-4 w-full text-sm text-gray-900 bg-gray-50 rounded-xl border ${!motivoValido && motivoLen > 0 ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} focus:outline-none focus:ring-2`}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {motivoLen} caracteres
            </div>
        </div>
        
        {/* Helper / Validation Message */}
        {!readOnly && (
            <div className="flex justify-between items-start mt-2">
                <div>
                     {admisionData.MotivoConsultaSintoma?.Motivo_Consulta_Sintoma && !formData.motivoAtencion && (
                        <button
                            type="button"
                            onClick={() => handleChange({ target: { name: 'motivoAtencion', value: admisionData.MotivoConsultaSintoma.Motivo_Consulta_Sintoma } })}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                        >
                            📋 Copiar motivo de admisión
                        </button>
                    )}
                </div>
                {!motivoValido && motivoLen > 0 && (
                    <span className="text-xs text-red-500 font-medium animate-pulse">
                        Se recomienda una descripción más detallada (mínimo 10 car.)
                    </span>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default AtencionInicial;
