import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Trash2, Edit2, Save } from 'lucide-react';

const DiagnosticosCIE10 = ({ atencionId, readOnly = false }) => {
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAgregar, setShowAgregar] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [cie10Options, setCie10Options] = useState([]);
  const [searchCie10, setSearchCie10] = useState('');
  const [formData, setFormData] = useState({
    codigoCIE10: '',
    descripcion: '',
    tipoDiagnostico: 'PRESUNTIVO'
  });

  useEffect(() => {
    if (atencionId) {
      cargarDiagnosticos();
    }
  }, [atencionId]);

  const cargarDiagnosticos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3001/api/diagnosticos/atencion/${atencionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDiagnosticos(response.data);
    } catch (error) {
      console.error('Error al cargar diagnósticos:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarCIE10 = async (termino) => {
    if (termino.length < 2) {
      setCie10Options([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3001/api/cat-cie10?search=${termino}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCie10Options(response.data.slice(0, 10)); // Limitar a 10 resultados
    } catch (error) {
      console.error('Error al buscar CIE-10:', error);
    }
  };

  const handleSelectCIE10 = (cie10) => {
    setFormData({
      ...formData,
      codigoCIE10: cie10.codigo,
      descripcion: cie10.descripcion
    });
    setCie10Options([]);
    setSearchCie10(cie10.codigo);

    // Aplicar regla de la letra Z
    if (cie10.codigo.toUpperCase().startsWith('Z')) {
      setFormData(prev => ({ ...prev, tipoDiagnostico: 'NO APLICA' }));
    }
  };

  const handleAgregarDiagnostico = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3001/api/diagnosticos/atencion/${atencionId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setFormData({ codigoCIE10: '', descripcion: '', tipoDiagnostico: 'PRESUNTIVO' });
      setShowAgregar(false);
      setSearchCie10('');
      cargarDiagnosticos();
    } catch (error) {
      console.error('Error al agregar diagnóstico:', error);
      alert('Error al agregar el diagnóstico.');
    }
  };

  const handleActualizarDiagnostico = async (diagnosticoId, datos) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:3001/api/diagnosticos/${diagnosticoId}`,
        datos,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEditingId(null);
      cargarDiagnosticos();
    } catch (error) {
      console.error('Error al actualizar diagnóstico:', error);
      alert('Error al actualizar el diagnóstico.');
    }
  };

  const handleEliminarDiagnostico = async (diagnosticoId) => {
    if (!confirm('¿Está seguro de eliminar este diagnóstico?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:3001/api/diagnosticos/${diagnosticoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      cargarDiagnosticos();
    } catch (error) {
      console.error('Error al eliminar diagnóstico:', error);
      alert('Error al eliminar el diagnóstico.');
    }
  };

  const esCodigoZ = (codigo) => {
    return codigo && codigo.toUpperCase().startsWith('Z');
  };

  if (loading) {
    return <div className="text-center py-4">Cargando diagnósticos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Diagnósticos CIE-10</h3>
        {!readOnly && (
          <button
            onClick={() => setShowAgregar(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Agregar Diagnóstico
          </button>
        )}
      </div>

      {showAgregar && !readOnly && (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Código CIE-10:
            </label>
            <input
              type="text"
              value={searchCie10}
              onChange={(e) => {
                setSearchCie10(e.target.value);
                buscarCIE10(e.target.value);
              }}
              placeholder="Ej: A00, Z00..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {cie10Options.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-xl bg-white shadow-sm max-h-60 overflow-y-auto divide-y divide-gray-100">
                {cie10Options.map((cie10) => (
                  <button
                    type="button"
                    key={cie10.id}
                    onClick={() => handleSelectCIE10(cie10)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50/80 transition-colors flex gap-3 items-start"
                  >
                    <span className="font-bold text-blue-600 shrink-0">{cie10.codigo}</span>
                    <span className="text-sm text-gray-700">{cie10.descripcion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Diagnóstico:
            </label>
            <select
              value={formData.tipoDiagnostico}
              onChange={(e) => setFormData({ ...formData, tipoDiagnostico: e.target.value })}
              disabled={esCodigoZ(formData.codigoCIE10)}
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 ${
                esCodigoZ(formData.codigoCIE10) ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="PRESUNTIVO">Presuntivo</option>
              <option value="DEFINITIVO">Definitivo</option>
              <option value="NO APLICA">No Aplica (Regla Z)</option>
            </select>
            {esCodigoZ(formData.codigoCIE10) && (
              <p className="text-sm text-amber-600 mt-1 font-medium">
                Regla Z: Códigos que inician con Z se bloquean como «No Aplica».
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción:
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAgregarDiagnostico}
              disabled={!formData.codigoCIE10}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Guardar
            </button>
            <button
              onClick={() => {
                setShowAgregar(false);
                setFormData({ codigoCIE10: '', descripcion: '', tipoDiagnostico: 'PRESUNTIVO' });
                setSearchCie10('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {diagnosticos.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No hay diagnósticos registrados.</p>
        ) : (
          diagnosticos.map((diag) => (
            <div
              key={diag.id}
              className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {editingId === diag.id ? (
                <EditarDiagnostico
                  diagnostico={diag}
                  onSave={(datos) => handleActualizarDiagnostico(diag.id, datos)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-bold text-blue-600">{diag.CIE10?.codigo || diag.codigoCIE10}</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        diag.tipoDiagnostico === 'DEFINITIVO' ? 'bg-green-100 text-green-800' :
                        diag.tipoDiagnostico === 'PRESUNTIVO' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {diag.tipoDiagnostico}
                      </span>
                      {esCodigoZ(diag.CIE10?.codigo || diag.codigoCIE10) && (
                        <span className="text-xs text-amber-600 font-medium">(Regla Z)</span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm">{diag.CIE10?.descripcion || diag.descripcion}</p>
                    {diag.descripcion && diag.descripcion !== diag.CIE10?.descripcion && (
                      <p className="text-sm text-gray-600 mt-1">{diag.descripcion}</p>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setEditingId(diag.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminarDiagnostico(diag.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const EditarDiagnostico = ({ diagnostico, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    codigoCIE10: diagnostico.CIE10?.codigo || diagnostico.codigoCIE10,
    descripcion: diagnostico.descripcion || '',
    tipoDiagnostico: diagnostico.tipoDiagnostico
  });
  const [cie10Options, setCie10Options] = useState([]);
  const [searchCie10, setSearchCie10] = useState('');

  const buscarCIE10 = async (termino) => {
    if (termino.length < 2) {
      setCie10Options([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3001/api/cat-cie10?search=${termino}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCie10Options(response.data.slice(0, 10));
    } catch (error) {
      console.error('Error al buscar CIE-10:', error);
    }
  };

  const handleSelectCIE10 = (cie10) => {
    setFormData({
      ...formData,
      codigoCIE10: cie10.codigo,
      descripcion: cie10.descripcion
    });
    setCie10Options([]);
    setSearchCie10(cie10.codigo);

    if (cie10.codigo.toUpperCase().startsWith('Z')) {
      setFormData(prev => ({ ...prev, tipoDiagnostico: 'NO APLICA' }));
    }
  };

  const esCodigoZ = formData.codigoCIE10 && formData.codigoCIE10.toUpperCase().startsWith('Z');

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Código CIE-10:</label>
        <input
          type="text"
          value={searchCie10 || formData.codigoCIE10}
          onChange={(e) => {
            setSearchCie10(e.target.value);
            buscarCIE10(e.target.value);
          }}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
        {cie10Options.length > 0 && (
          <div className="mt-1 border border-gray-200 rounded-xl bg-white shadow-sm max-h-40 overflow-y-auto divide-y divide-gray-100">
            {cie10Options.map((cie10) => (
              <button
                type="button"
                key={cie10.id}
                onClick={() => handleSelectCIE10(cie10)}
                className="w-full text-left px-3 py-2.5 hover:bg-blue-50/80 transition-colors flex gap-2 items-start text-sm"
              >
                <span className="font-bold text-blue-600 shrink-0">{cie10.codigo}</span>
                <span className="text-gray-700">{cie10.descripcion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo:</label>
        <select
          value={formData.tipoDiagnostico}
          onChange={(e) => setFormData({ ...formData, tipoDiagnostico: e.target.value })}
          disabled={esCodigoZ}
          className={`w-full border border-gray-300 rounded-md px-3 py-2 ${esCodigoZ ? 'bg-gray-100' : ''}`}
        >
          <option value="PRESUNTIVO">Presuntivo</option>
          <option value="DEFINITIVO">Definitivo</option>
          <option value="NO APLICA">No Aplica</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción:</label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          rows={2}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onSave(formData)}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          <Save className="w-4 h-4 inline mr-1" />
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default DiagnosticosCIE10;
