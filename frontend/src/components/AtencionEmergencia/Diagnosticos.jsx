import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { AlertTriangle, X, Save, Trash2, Info, Search } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

const esCodigoST = (codigo) => /^[ST]/i.test(String(codigo || '').trim());
const esCausaExternaRango = (codigo) => /^[VWXY]/i.test(String(codigo || '').trim());

const DiagnosticosCIE10 = ({ atencionId, readOnly = false, formDataMain }) => {
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAgregar, setShowAgregar] = useState(false);

  // Estados de búsqueda
  const [cie10Options, setCie10Options] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Estados de Causa Externa
  const [cie10OptionsCausa, setCie10OptionsCausa] = useState([]);
  const [searchCausa, setSearchCausa] = useState('');

  const [formData, setFormData] = useState({
    codigoCIE10: '',
    descripcion: '',
    condicion: 'Presuntivo'
  });

  const [causaData, setCausaData] = useState({
    codigoCIE10: '',
    descripcion: ''
  });

  // --- Cargar Diagnósticos Registrados ---
  const cargarDiagnosticos = useCallback(async () => {
    if (!atencionId) return;
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE}/diagnosticos/atencion/${atencionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDiagnosticos(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error('Error al cargar:', err);
    } finally {
      setLoading(false);
    }
  }, [atencionId]);

  useEffect(() => { cargarDiagnosticos(); }, [cargarDiagnosticos]);

  // --- Buscador Principal (CIE-10) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length < 3) { setCie10Options([]); return; }
      setLoadingSearch(true);
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_BASE}/cie10/buscar?termino=${searchTerm}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // IMPORTANTE: Ajuste a nombres de columnas de tu BD (codigo, descripcion)
        setCie10Options(data.slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally { setLoadingSearch(false); }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // --- Buscador Causa Externa (V-Y) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchCausa.length < 3) { setCie10OptionsCausa([]); return; }
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_BASE}/cie10/buscar?termino=${searchCausa}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const filtrados = data.filter(c => esCausaExternaRango(c.codigo));
        setCie10OptionsCausa(filtrados.slice(0, 10));
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchCausa]);

  const handleGuardar = async () => {
    if (!formData.codigoCIE10) return;
    
    // Validación de Trauma
    if (esCodigoST(formData.codigoCIE10) && !causaData.codigoCIE10) {
      alert('OBLIGATORIO: Los diagnósticos S o T requieren una Causa Externa (V, W, X, Y)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        causaExterna: causaData.codigoCIE10 ? causaData : null
      };
      await axios.post(`${API_BASE}/diagnosticos/atencion/${atencionId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAgregar(false);
      setSearchTerm('');
      setSearchCausa('');
      setFormData({ codigoCIE10: '', descripcion: '', condicion: 'Presuntivo' });
      setCausaData({ codigoCIE10: '', descripcion: '' });
      cargarDiagnosticos();
    } catch (err) {
      alert('Error al guardar');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/diagnosticos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      cargarDiagnosticos();
    } catch (err) { alert('Error al eliminar'); }
  };

  if (loading) return <div className="p-4 text-center">Cargando...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-blue-700">DIAGNÓSTICOS (CIE-10)</h3>
        {!readOnly && !showAgregar && (
          <button onClick={() => setShowAgregar(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + Agregar Diagnóstico
          </button>
        )}
      </div>

      {showAgregar && (
        <div className="mb-6 p-5 border border-blue-100 bg-blue-50/50 rounded-xl space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Diagnóstico (Código o Nombre)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej: A09 o Diarrea..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              <select 
                className="border border-gray-300 rounded-lg px-2 py-2 text-sm"
                value={formData.condicion}
                onChange={e => setFormData({...formData, condicion: e.target.value})}
              >
                <option value="Presuntivo">Presuntivo</option>
                <option value="Definitivo Inicial">Definitivo Inicial</option>
                <option value="Definitivo Inicial por Laboratorio">Definitivo Inicial por Laboratorio</option>
              </select>
            </div>

            {/* RESULTADOS DEL BUSCADOR - Z-INDEX CORREGIDO */}
            {cie10Options.length > 0 && (
              <div className="absolute z-[10000] w-full bg-white shadow-2xl border border-gray-200 mt-1 rounded-lg max-h-60 overflow-y-auto">
                {cie10Options.map(opt => (
                  <div 
                    key={opt.codigo} 
                    onClick={() => {
                      setFormData({...formData, codigoCIE10: opt.codigo, descripcion: opt.descripcion});
                      setSearchTerm(`${opt.codigo} - ${opt.descripcion}`);
                      setCie10Options([]);
                    }}
                    className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0"
                  >
                    <span className="font-bold text-blue-600 mr-2">{opt.codigo}</span>
                    <span className="text-gray-700">{opt.descripcion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN CAUSA EXTERNA SI ES S o T */}
          {esCodigoST(formData.codigoCIE10) && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg relative">
              <label className="block text-xs font-bold text-amber-800 mb-1 italic">
                ⚠️ REQUIERE CAUSA EXTERNA (V, W, X, Y)
              </label>
              <input
                className="w-full border border-amber-300 rounded px-3 py-2 text-sm"
                placeholder="Buscar causa (Ej: W18)..."
                value={searchCausa}
                onChange={e => setSearchCausa(e.target.value)}
              />
              {cie10OptionsCausa.length > 0 && (
                <div className="absolute z-[10001] w-full bg-white shadow-xl border border-gray-200 mt-1 max-h-40 overflow-auto">
                  {cie10OptionsCausa.map(opt => (
                    <div 
                      key={opt.codigo}
                      onClick={() => {
                        setCausaData({ codigoCIE10: opt.codigo, descripcion: opt.descripcion });
                        setSearchCausa(`${opt.codigo} - ${opt.descripcion}`);
                        setCie10OptionsCausa([]);
                      }}
                      className="p-2 hover:bg-amber-100 cursor-pointer text-xs border-b"
                    >
                      <span className="font-bold">{opt.codigo}</span> - {opt.descripcion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAgregar(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button 
              onClick={handleGuardar}
              disabled={!formData.codigoCIE10 || (esCodigoST(formData.codigoCIE10) && !causaData.codigoCIE10)}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" /> Guardar
            </button>
          </div>
        </div>
      )}

      {/* TABLA DE RESULTADOS */}
      <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
            <tr>
              <th className="px-4 py-3 border-b">Código</th>
              <th className="px-4 py-3 border-b">Diagnóstico</th>
              <th className="px-4 py-3 border-b">Condición</th>
              <th className="px-4 py-3 border-b text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {diagnosticos.length === 0 ? (
              <tr><td colSpan="4" className="p-10 text-center text-gray-400 italic">No hay registros.</td></tr>
            ) : diagnosticos.map(d => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-bold text-blue-600">{d.codigoCIE10 || d.CIE10?.codigo}</td>
                <td className="px-4 py-3 text-gray-700">
                  <div className="font-medium">{d.descripcion || d.CIE10?.descripcion}</div>
                  {d.padreId && <div className="text-[10px] text-amber-600 font-bold uppercase">Causa Externa</div>}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${d.condicion === 'Presuntivo' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {d.condicion}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {!readOnly && (
                    <button onClick={() => handleEliminar(d.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DiagnosticosCIE10;