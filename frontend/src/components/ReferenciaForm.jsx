import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const ReferenciaForm = ({ admisionId, atencionId, onClose, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    establecimientoDestino: '',
    servicioDestino: '',
    motivoReferencia: '',
    resumenCuadroClinico: '',
    hallazgosRelevantes: '',
    diagnosticoCIE10: '',
    planTratamiento: ''
  });
  const [firmaElectronica, setFirmaElectronica] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [referenciasExistentes, setReferenciasExistentes] = useState([]);

  useEffect(() => {
    const fetchReferencias = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(`http://localhost:3001/api/referencias-053/admision/${admisionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReferenciasExistentes(response.data);
      } catch (err) {
        console.error('Error al cargar referencias existentes:', err);
        setError('Error al cargar referencias existentes.');
      }
    };
    fetchReferencias();
  }, [admisionId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No autenticado. Por favor, inicie sesión.');
        setLoading(false);
        return;
      }

      const dataToSend = {
        admisionId,
        atencionId,
        ...formData,
        firmaElectronica
      };

      await axios.post('http://localhost:3001/api/referencias-053', dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Referencia (053) guardada exitosamente.');
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Error al guardar la referencia:', err);
      if (err.response && err.response.status === 401) {
        setError('Firma electrónica inválida. Por favor, verifique su contraseña.');
      } else {
        setError('Error al guardar la referencia. Intente de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 overflow-y-auto max-h-[80vh]">
      <h2 className="text-xl font-bold mb-4">Referencia / Derivación (Formulario 053)</h2>
      
      {referenciasExistentes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Referencias Anteriores:</h3>
          {referenciasExistentes.map((ref) => (
            <div key={ref.id} className="border p-3 mb-2 rounded-md bg-gray-50 text-sm">
              <p><strong>Fecha:</strong> {format(new Date(ref.fechaEmision), 'dd/MM/yyyy')}</p>
              <p><strong>Destino:</strong> {ref.establecimientoDestino} - {ref.servicioDestino}</p>
              <p><strong>Motivo:</strong> {ref.motivoReferencia}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">Establecimiento Destino:</label>
            <input
              type="text"
              name="establecimientoDestino"
              value={formData.establecimientoDestino}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-1">Servicio Destino:</label>
            <input
              type="text"
              name="servicioDestino"
              value={formData.servicioDestino}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Motivo de Referencia:</label>
          <textarea
            name="motivoReferencia"
            value={formData.motivoReferencia}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="2"
            required
          ></textarea>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Resumen del Cuadro Clínico:</label>
          <textarea
            name="resumenCuadroClinico"
            value={formData.resumenCuadroClinico}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
            required
          ></textarea>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Hallazgos Relevantes (Exámenes/Imagen):</label>
          <textarea
            name="hallazgosRelevantes"
            value={formData.hallazgosRelevantes}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="2"
          ></textarea>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Diagnóstico Principal (CIE-10):</label>
          <input
            type="text"
            name="diagnosticoCIE10"
            value={formData.diagnosticoCIE10}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            placeholder="Ej: A09X - Diarrea y gastroenteritis..."
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-1">Plan de Tratamiento Realizado:</label>
          <textarea
            name="planTratamiento"
            value={formData.planTratamiento}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="2"
          ></textarea>
        </div>

        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
          <label htmlFor="firmaElectronica" className="block text-amber-800 text-sm font-bold mb-1">Firma Electrónica (Contraseña):</label>
          <input
            type="password"
            id="firmaElectronica"
            value={firmaElectronica}
            onChange={(e) => setFirmaElectronica(e.target.value)}
            className="shadow appearance-none border border-amber-200 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>

        {error && <p className="text-red-500 text-xs italic">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Referencia'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReferenciaForm;
