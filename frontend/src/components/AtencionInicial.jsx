import React from 'react';
import { format } from 'date-fns';

const AtencionInicial = ({ formData, handleChange, admisionData, readOnly }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Atención Inicial</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="fechaAtencion" className="block text-gray-700 text-sm font-bold mb-2">
            Fecha de Atención: <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="fechaAtencion"
            name="fechaAtencion"
            value={formData.fechaAtencion || ''}
            onChange={handleChange}
            required
            readOnly={true} 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100 cursor-not-allowed"
            title="Fecha automática capturada al inicio de la atención (Registro de Tiempos de Oro)."
          />
          <p className="text-xs text-gray-500 mt-1">Fecha automática capturada por el sistema</p>
        </div>
        <div>
          <label htmlFor="horaAtencion" className="block text-gray-700 text-sm font-bold mb-2">
            Hora de Atención: <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="horaAtencion"
            name="horaAtencion"
            value={formData.horaAtencion || ''}
            onChange={handleChange}
            required
            readOnly={true}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100 cursor-not-allowed"
            title="Hora automática capturada al inicio de la atención (Registro de Tiempos de Oro)."
          />
          <p className="text-xs text-gray-500 mt-1">Hora automática capturada por el sistema</p>
        </div>
      </div>

      {/* Selector visual de condición de llegada */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-3">
          Condición de Llegada: <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => !readOnly && handleChange({ target: { name: 'condicionLlegada', value: 'ESTABLE' } })}
            disabled={readOnly}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.condicionLlegada === 'ESTABLE'
                ? 'border-green-500 bg-green-50 shadow-md transform scale-105'
                : 'border-gray-300 bg-white hover:border-green-300 hover:bg-green-50'
            } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className={`font-semibold ${formData.condicionLlegada === 'ESTABLE' ? 'text-green-800' : 'text-gray-800'}`}>ESTABLE</div>
              <div className="text-xs text-gray-600 mt-1">Paciente estable</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => !readOnly && handleChange({ target: { name: 'condicionLlegada', value: 'INESTABLE' } })}
            disabled={readOnly}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.condicionLlegada === 'INESTABLE'
                ? 'border-orange-500 bg-orange-50 shadow-md transform scale-105'
                : 'border-gray-300 bg-white hover:border-orange-300 hover:bg-orange-50'
            } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <div className={`font-semibold ${formData.condicionLlegada === 'INESTABLE' ? 'text-orange-800' : 'text-gray-800'}`}>INESTABLE</div>
              <div className="text-xs text-gray-600 mt-1">Requiere atención urgente</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => !readOnly && handleChange({ target: { name: 'condicionLlegada', value: 'FALLECIDO' } })}
            disabled={readOnly}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.condicionLlegada === 'FALLECIDO'
                ? 'border-red-600 bg-red-50 shadow-md transform scale-105'
                : 'border-gray-300 bg-white hover:border-red-300 hover:bg-red-50'
            } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">❌</div>
              <div className={`font-semibold ${formData.condicionLlegada === 'FALLECIDO' ? 'text-red-800' : 'text-gray-800'}`}>FALLECIDO</div>
              <div className="text-xs text-gray-600 mt-1">Sin signos vitales</div>
            </div>
          </button>
        </div>
      </div>

      {/* Motivo de atención con auto-completar */}
      <div className="mb-4">
        <label htmlFor="motivoAtencion" className="block text-gray-700 text-sm font-bold mb-2">
          Motivo de Atención:
        </label>
        <textarea
          id="motivoAtencion"
          name="motivoAtencion"
          value={formData.motivoAtencion || (admisionData.MotivoConsultaSintoma?.Motivo_Consulta_Sintoma || '')}
          onChange={handleChange}
          rows={4}
          readOnly={readOnly}
          placeholder={admisionData.MotivoConsultaSintoma?.Motivo_Consulta_Sintoma ? `Motivo de admisión: ${admisionData.MotivoConsultaSintoma.Motivo_Consulta_Sintoma}` : 'Describa el motivo de atención...'}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        {admisionData.MotivoConsultaSintoma?.Motivo_Consulta_Sintoma && !formData.motivoAtencion && !readOnly && (
          <button
            type="button"
            onClick={() => handleChange({ target: { name: 'motivoAtencion', value: admisionData.MotivoConsultaSintoma.Motivo_Consulta_Sintoma } })}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            📋 Usar motivo de admisión: "{admisionData.MotivoConsultaSintoma.Motivo_Consulta_Sintoma}"
          </button>
        )}
      </div>
    </div>
  );
};

export default AtencionInicial;
