// EJEMPLO DE IMPLEMENTACIÓN: Auto-Save por Sección
// Este código muestra cómo implementar el guardado automático

import { useEffect, useRef, useCallback } from 'react';

// Hook personalizado para auto-save
const useAutoSave = (data, admisionId, delay = 2000) => {
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveToBackend = useCallback(async (dataToSave) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Verificar si existe atención previa
      const existingResponse = await axios.get(
        `http://localhost:3001/api/atencion-emergencia/admision/${admisionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => null);

      const dataToSend = {
        ...dataToSave,
        pacienteId: admisionData.pacienteId,
        admisionId: parseInt(admisionId),
        tipoAccidenteViolenciaIntoxicacion: JSON.stringify(dataToSave.tipoAccidenteViolenciaIntoxicacion),
        antecedentesPatologicos: JSON.stringify(dataToSave.antecedentesPatologicos),
        examenFisico: JSON.stringify(dataToSave.examenFisico),
        embarazoParto: JSON.stringify(dataToSave.embarazoParto),
        examenesComplementarios: JSON.stringify(dataToSave.examenesComplementarios),
        diagnosticosPresuntivos: JSON.stringify(dataToSave.diagnosticosPresuntivos),
        diagnosticosDefinitivos: JSON.stringify(dataToSave.diagnosticosDefinitivos),
        planTratamiento: JSON.stringify(dataToSave.planTratamiento),
      };

      if (existingResponse?.data) {
        // Actualizar existente
        await axios.put(
          `http://localhost:3001/api/atencion-emergencia/${existingResponse.data.id}`,
          dataToSend,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Crear nuevo (estado BORRADOR)
        await axios.post(
          'http://localhost:3001/api/atencion-emergencia',
          { ...dataToSend, estado: 'BORRADOR' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000); // Ocultar mensaje después de 3 segundos
    } catch (error) {
      console.error('Error en auto-save:', error);
      // Opcional: Mostrar notificación de error
    } finally {
      setSaving(false);
    }
  }, [admisionId]);

  // Auto-save con debounce
  useEffect(() => {
    // Cancelar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Evitar guardar si no hay cambios
    if (JSON.stringify(data) === JSON.stringify(lastSavedRef.current)) {
      return;
    }

    // Crear nuevo timeout
    timeoutRef.current = setTimeout(() => {
      lastSavedRef.current = JSON.parse(JSON.stringify(data));
      saveToBackend(data);
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, saveToBackend]);

  // Guardar al cambiar de pestaña
  const saveOnTabChange = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveToBackend(data);
  }, [data, saveToBackend]);

  // Guardar al cerrar/recargar página
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Guardar inmediatamente antes de cerrar
      if (JSON.stringify(data) !== JSON.stringify(lastSavedRef.current)) {
        // Usar sendBeacon para guardar de forma síncrona
        const token = localStorage.getItem('token');
        const dataToSend = JSON.stringify({
          ...data,
          pacienteId: admisionData.pacienteId,
          admisionId: parseInt(admisionId),
        });
        
        navigator.sendBeacon(
          `http://localhost:3001/api/atencion-emergencia/auto-save/${admisionId}`,
          new Blob([dataToSend], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [data, admisionId]);

  return { saving, saved, saveOnTabChange };
};

// Uso en el componente:
const AtencionEmergenciaForm = ({ admisionData, atencionData, signosVitalesData }) => {
  const [atencionEmergenciaData, setAtencionEmergenciaData] = useState({...});
  const [activeTab, setActiveTab] = useState('inicioAtencion');
  
  // Usar el hook de auto-save
  const { saving, saved, saveOnTabChange } = useAutoSave(
    atencionEmergenciaData,
    admisionId,
    2000 // Guardar después de 2 segundos de inactividad
  );

  // Guardar al cambiar de pestaña
  const handleTabChange = (newTab) => {
    saveOnTabChange(); // Guardar antes de cambiar
    setActiveTab(newTab);
  };

  return (
    <div>
      {/* Indicador de estado de guardado */}
      <div className="fixed top-4 right-4 z-50">
        {saving && (
          <div className="bg-blue-500 text-white px-4 py-2 rounded shadow-lg">
            💾 Guardando...
          </div>
        )}
        {saved && (
          <div className="bg-green-500 text-white px-4 py-2 rounded shadow-lg">
            ✅ Guardado
          </div>
        )}
      </div>

      {/* Pestañas con guardado automático */}
      <button
        onClick={() => handleTabChange('inicioAtencion')}
        className={activeTab === 'inicioAtencion' ? 'active' : ''}
      >
        C. Inicio de Atención
      </button>
      {/* ... más pestañas */}
    </div>
  );
};
