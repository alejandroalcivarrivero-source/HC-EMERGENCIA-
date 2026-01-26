import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, UserSearch } from 'lucide-react';

const ReasignarPacienteModal = ({ isOpen, onClose, atencionId, onReasignado }) => {
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medicoNuevoId: '',
    motivoReasignacion: ''
  });

  useEffect(() => {
    if (isOpen) {
      cargarMedicos();
    }
  }, [isOpen]);

  const cargarMedicos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/reasignacion/medicos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedicos(response.data);
    } catch (error) {
      console.error('Error al cargar médicos:', error);
      alert('Error al cargar la lista de médicos.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.medicoNuevoId || !formData.motivoReasignacion.trim()) {
      alert('Por favor complete todos los campos.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3001/api/reasignacion/atencion/${atencionId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Paciente reasignado exitosamente.');
      if (onReasignado) {
        onReasignado();
      }
      onClose();
      setFormData({ medicoNuevoId: '', motivoReasignacion: '' });
    } catch (error) {
      console.error('Error al reasignar paciente:', error);
      alert('Error al reasignar el paciente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserSearch className="w-6 h-6" />
            Reasignar Paciente
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Médico:
            </label>
            <select
              value={formData.medicoNuevoId}
              onChange={(e) => setFormData({ ...formData, medicoNuevoId: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione un médico</option>
              {medicos.map((medico) => (
                <option key={medico.id} value={medico.id}>
                  {medico.nombres} {medico.apellidos} - {medico.cedula}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo de Reasignación:
            </label>
            <textarea
              value={formData.motivoReasignacion}
              onChange={(e) => setFormData({ ...formData, motivoReasignacion: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describa el motivo de la reasignación..."
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Reasignando...' : 'Confirmar Reasignación'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReasignarPacienteModal;
