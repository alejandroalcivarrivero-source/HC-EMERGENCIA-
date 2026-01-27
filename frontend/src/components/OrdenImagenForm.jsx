import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const OrdenImagenForm = ({ admisionId, onClose, onSaveSuccess }) => {
  const [tipoImagen, setTipoImagen] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [firmaElectronica, setFirmaElectronica] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ordenesExistentes, setOrdenesExistentes] = useState([]);

  useEffect(() => {
    const fetchOrdenes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(`http://localhost:3001/api/ordenes-imagen/${admisionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrdenesExistentes(response.data);
      } catch (err) {
        console.error('Error al cargar órdenes de imagen existentes:', err);
        setError('Error al cargar órdenes de imagen existentes.');
      }
    };
    fetchOrdenes();
  }, [admisionId]);

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
        tipoImagen,
        observaciones,
        firmaElectronica
      };

      await axios.post('http://localhost:3001/api/ordenes-imagen', dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Orden de imagen guardada exitosamente.');
      setTipoImagen('');
      setObservaciones('');
      setFirmaElectronica('');
      onSaveSuccess(); // Notificar al componente padre
      onClose(); // Cerrar el modal/formulario
    } catch (err) {
      console.error('Error al guardar la orden de imagen:', err);
      if (err.response && err.response.status === 401) {
        setError('Firma electrónica inválida. Por favor, verifique su contraseña.');
      } else {
        setError('Error al guardar la orden de imagen. Intente de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Orden de Imagen (Formulario 012)</h2>
      
      {ordenesExistentes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Órdenes Anteriores para esta Admisión:</h3>
          {ordenesExistentes.map((orden) => (
            <div key={orden.id} className="border p-3 mb-2 rounded-md bg-gray-50">
              <p><strong>Fecha:</strong> {format(new Date(orden.fechaEmision), 'dd/MM/yyyy')}</p>
              <p><strong>Emitida por:</strong> {orden.Usuario ? orden.Usuario.nombre_completo : 'N/A'}</p>
              <p><strong>Tipo de Imagen:</strong> {orden.tipoImagen}</p>
              {orden.observaciones && <p><strong>Obs:</strong> {orden.observaciones}</p>}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="tipoImagen" className="block text-gray-700 text-sm font-bold mb-2">Tipo de Imagen:</label>
          <input
            type="text"
            id="tipoImagen"
            name="tipoImagen"
            value={tipoImagen}
            onChange={(e) => setTipoImagen(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
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
            {loading ? 'Guardando...' : 'Guardar Orden de Imagen'}
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

export default OrdenImagenForm;