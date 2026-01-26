import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const RecetaMedicaForm = ({ admisionId, onClose, onSaveSuccess }) => {
  const [medicamentos, setMedicamentos] = useState([{ nombre: '', via: '', dosis: '', posologia: '', dias: null }]);
  const [observaciones, setObservaciones] = useState('');
  const [firmaElectronica, setFirmaElectronica] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recetasExistentes, setRecetasExistentes] = useState([]);

  useEffect(() => {
    const fetchRecetas = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(`http://localhost:3001/api/recetas-medicas/${admisionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecetasExistentes(response.data);
      } catch (err) {
        console.error('Error al cargar recetas existentes:', err);
        setError('Error al cargar recetas existentes.');
      }
    };
    fetchRecetas();
  }, [admisionId]);

  const handleMedicamentoChange = (index, field, value) => {
    const newMedicamentos = [...medicamentos];
    newMedicamentos[index] = { ...newMedicamentos[index], [field]: value };
    setMedicamentos(newMedicamentos);
  };

  const addMedicamento = () => {
    setMedicamentos([...medicamentos, { nombre: '', via: '', dosis: '', posologia: '', dias: null }]);
  };

  const removeMedicamento = (index) => {
    const newMedicamentos = medicamentos.filter((_, i) => i !== index);
    setMedicamentos(newMedicamentos);
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
        medicamentos,
        observaciones,
        firmaElectronica
      };

      await axios.post('http://localhost:3001/api/recetas-medicas', dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Receta médica guardada exitosamente.');
      setMedicamentos([{ nombre: '', via: '', dosis: '', posologia: '', dias: null }]);
      setObservaciones('');
      setFirmaElectronica('');
      onSaveSuccess(); // Notificar al componente padre
      onClose(); // Cerrar el modal/formulario
    } catch (err) {
      console.error('Error al guardar la receta médica:', err);
      if (err.response && err.response.status === 401) {
        setError('Firma electrónica inválida. Por favor, verifique su contraseña.');
      } else {
        setError('Error al guardar la receta médica. Intente de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Receta Médica</h2>
      
      {recetasExistentes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Recetas Anteriores para esta Admisión:</h3>
          {recetasExistentes.map((receta) => (
            <div key={receta.id} className="border p-3 mb-2 rounded-md bg-gray-50">
              <p><strong>Fecha:</strong> {format(new Date(receta.fechaEmision), 'dd/MM/yyyy')}</p>
              <p><strong>Emitida por:</strong> {receta.Usuario ? receta.Usuario.nombre_completo : 'N/A'}</p>
              <ul className="list-disc ml-5">
                {receta.medicamentos.map((med, idx) => (
                  <li key={idx}>{med.nombre} - {med.dosis} ({med.via}) - {med.posologia} ({med.dias} días)</li>
                ))}
              </ul>
              {receta.observaciones && <p><strong>Obs:</strong> {receta.observaciones}</p>}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Medicamentos:</label>
          {medicamentos.map((med, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2 items-end">
              <input
                type="text"
                placeholder="Nombre"
                value={med.nombre}
                onChange={(e) => handleMedicamentoChange(index, 'nombre', e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
              <input
                type="text"
                placeholder="Vía"
                value={med.via}
                onChange={(e) => handleMedicamentoChange(index, 'via', e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
              <input
                type="text"
                placeholder="Dosis"
                value={med.dosis}
                onChange={(e) => handleMedicamentoChange(index, 'dosis', e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
              <input
                type="text"
                placeholder="Posología"
                value={med.posologia}
                onChange={(e) => handleMedicamentoChange(index, 'posologia', e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
              <input
                type="number"
                placeholder="Días"
                value={med.dias || ''}
                onChange={(e) => handleMedicamentoChange(index, 'dias', parseInt(e.target.value) || null)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <button type="button" onClick={() => removeMedicamento(index)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Eliminar</button>
            </div>
          ))}
          <button type="button" onClick={addMedicamento} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-2">Agregar Medicamento</button>
        </div>

        <div className="mb-4">
          <label htmlFor="observaciones" className="block text-gray-700 text-sm font-bold mb-2">Observaciones:</label>
          <textarea
            id="observaciones"
            name="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
          ></textarea>
        </div>

        <div className="mb-6">
          <label htmlFor="firmaElectronica" className="block text-gray-700 text-sm font-bold mb-2">Firma Electrónica (Contraseña):</label>
          <input
            type="password"
            id="firmaElectronica"
            name="firmaElectronica"
            value={firmaElectronica}
            onChange={(e) => setFirmaElectronica(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Receta Médica'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecetaMedicaForm;