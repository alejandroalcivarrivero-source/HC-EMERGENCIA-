import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Trash2, Edit2, Save, AlertTriangle, FileText, X } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';
const MAX_PRESUNTIVOS = 3;
const MAX_DEFINITIVOS = 3;

const esCodigoZ = (codigo) => /^Z/i.test(String(codigo || '').trim());
const esCodigoST = (codigo) => /^[ST]/i.test(String(codigo || '').trim());
const esCausaExternaRango = (codigo) => /^[VWXY]\d{2}/i.test(String(codigo || '').trim().replace(/\s/g, ''));

const DiagnosticosCIE10 = ({ atencionId, readOnly = false }) => {
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAgregar, setShowAgregar] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [cie10Options, setCie10Options] = useState([]);
  const [searchCie10, setSearchCie10] = useState('');
  const [searchingCie10, setSearchingCie10] = useState(false);
  const [formData, setFormData] = useState({
    codigoCIE10: '',
    descripcionCie: '',
    descripcion: '',
    tipoDiagnostico: 'PRESUNTIVO',
    esCausaExterna: false
  });
  const [mostrarSeccionCausaExterna, setMostrarSeccionCausaExterna] = useState(false);
  const [formDataCausaExterna, setFormDataCausaExterna] = useState({
    codigoCIE10: '',
    descripcion: '',
    tipoDiagnostico: 'PRESUNTIVO'
  });
  const [searchCausaExterna, setSearchCausaExterna] = useState('');
  const [cie10OptionsCausaExterna, setCie10OptionsCausaExterna] = useState([]);
  const [searchingCausaExterna, setSearchingCausaExterna] = useState(false);
  const debounceRef = useRef(null);
  const debounceCausaRef = useRef(null);

  const cargarDiagnosticos = useCallback(async () => {
    if (!atencionId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE}/diagnosticos/atencion/${atencionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDiagnosticos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar diagnósticos:', err);
      setDiagnosticos([]);
    } finally {
      setLoading(false);
    }
  }, [atencionId]);

  useEffect(() => {
    cargarDiagnosticos();
  }, [cargarDiagnosticos]);

  const buscarCIE10 = useCallback(async (termino) => {
    const t = String(termino || '').trim();
    if (t.length < 2) {
      setCie10Options([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setSearchingCie10(true);
        const token = localStorage.getItem('token');
        const { data } = await axios.get(
          `${API_BASE}/cat-cie10/search?query=${encodeURIComponent(t)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCie10Options(Array.isArray(data) ? data.slice(0, 15) : []);
      } catch (err) {
        console.error('Error al buscar CIE-10:', err);
        setCie10Options([]);
      } finally {
        setSearchingCie10(false);
      }
    }, 280);
  }, []);

  const buscarCausaExterna = useCallback(async (termino) => {
    const t = String(termino || '').trim();
    if (t.length < 2) {
      setCie10OptionsCausaExterna([]);
      return;
    }
    if (debounceCausaRef.current) clearTimeout(debounceCausaRef.current);
    debounceCausaRef.current = setTimeout(async () => {
      try {
        setSearchingCausaExterna(true);
        const token = localStorage.getItem('token');
        const { data } = await axios.get(
          `${API_BASE}/cat-cie10/search?query=${encodeURIComponent(t)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const lista = Array.isArray(data) ? data : [];
        setCie10OptionsCausaExterna(lista.filter(c => esCausaExternaRango((c.codigo || '').trim())).slice(0, 15));
      } catch (err) {
        console.error('Error al buscar causa externa:', err);
        setCie10OptionsCausaExterna([]);
      } finally {
        setSearchingCausaExterna(false);
      }
    }, 280);
  }, []);

  useEffect(() => {
    if (showAgregar) buscarCIE10(searchCie10);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [showAgregar, searchCie10, buscarCIE10]);

  useEffect(() => {
    if (showAgregar && mostrarSeccionCausaExterna) buscarCausaExterna(searchCausaExterna);
    return () => { if (debounceCausaRef.current) clearTimeout(debounceCausaRef.current); };
  }, [showAgregar, mostrarSeccionCausaExterna, searchCausaExterna, buscarCausaExterna]);

  // Detección en tiempo real: Z → NO APLICA (administrativos/certificados); S/T → faltaCausaExterna y campo obligatorio causa externa
  useEffect(() => {
    const cod = String(formData.codigoCIE10 || '').trim().toUpperCase();
    if (!cod) {
      setMostrarSeccionCausaExterna(false);
      return;
    }
    if (cod.startsWith('Z')) {
      setFormData(prev => ({ ...prev, tipoDiagnostico: 'NO APLICA' }));
      setMostrarSeccionCausaExterna(false);
      return;
    }
    if (cod.startsWith('S') || cod.startsWith('T')) {
      setMostrarSeccionCausaExterna(true);
      return;
    }
    setMostrarSeccionCausaExterna(false);
  }, [formData.codigoCIE10]);

  // Falta causa externa: trauma S/T seleccionado en el formulario sin haber elegido aún un código V/W/X/Y
  const faltaCausaExterna = mostrarSeccionCausaExterna && !(formDataCausaExterna.codigoCIE10 || '').trim();

  // Solo morbilidad (no Z, no causa externa V-Y ni hijos) ocupa slots L/M
  const presuntivos = diagnosticos.filter(d => {
    const cod = d.codigoCIE10 || d.CIE10?.codigo;
    return d.tipoDiagnostico === 'PRESUNTIVO' && !esCodigoZ(cod) && !esCausaExternaRango(cod) && !d.padreId;
  });
  const definitivos = diagnosticos.filter(d => {
    const cod = d.codigoCIE10 || d.CIE10?.codigo;
    return d.tipoDiagnostico === 'DEFINITIVO' && !esCodigoZ(cod) && !esCausaExternaRango(cod) && !d.padreId;
  });
  const estadisticos = diagnosticos.filter(d => esCodigoZ(d.codigoCIE10 || d.CIE10?.codigo) || d.tipoDiagnostico === 'ESTADISTICO' || d.tipoDiagnostico === 'NO APLICA');
  const hayST = diagnosticos.some(d => esCodigoST(d.codigoCIE10 || d.CIE10?.codigo));
  const tieneCausaExterna = diagnosticos.some(d => esCausaExternaRango(d.codigoCIE10 || d.CIE10?.codigo));

  const handleSelectCIE10 = (cie10) => {
    const cod = (cie10.codigo || '').trim();
    const tipo = esCodigoZ(cod) ? 'NO APLICA' : formData.tipoDiagnostico;
    setFormData(prev => ({
      ...prev,
      codigoCIE10: cod,
      descripcionCie: cie10.descripcion || '',
      tipoDiagnostico: tipo,
      esCausaExterna: esCausaExternaRango(cod) ? prev.esCausaExterna : false
    }));
    setCie10Options([]);
    setSearchCie10(cod);
  };

  const handleAgregarDiagnostico = async () => {
    const cod = (formData.codigoCIE10 || '').trim();
    const tipo = esCodigoZ(cod) ? 'NO APLICA' : formData.tipoDiagnostico;
    if (faltaCausaExterna) {
      alert('Trauma (S o T): debe seleccionar la Causa Externa (código V, W, X o Y) obligatoria antes de agregar.');
      return;
    }
    if (tipo === 'PRESUNTIVO' && presuntivos.length >= MAX_PRESUNTIVOS) {
      alert(`Solo se permiten hasta ${MAX_PRESUNTIVOS} diagnósticos Presuntivos (L) en el Formulario 008.`);
      return;
    }
    if (tipo === 'DEFINITIVO' && definitivos.length >= MAX_DEFINITIVOS) {
      alert(`Solo se permiten hasta ${MAX_DEFINITIVOS} diagnósticos Definitivos (M) en el Formulario 008.`);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const { data: creado } = await axios.post(
        `${API_BASE}/diagnosticos/atencion/${atencionId}`,
        {
          codigoCIE10: cod,
          descripcion: formData.descripcion || formData.descripcionCie,
          tipoDiagnostico: tipo,
          esCausaExterna: !!formData.esCausaExterna
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const idPadre = creado?.id ?? creado?.data?.id;
      if (mostrarSeccionCausaExterna && formDataCausaExterna.codigoCIE10 && idPadre) {
        const codCausa = (formDataCausaExterna.codigoCIE10 || '').trim();
        await axios.post(
          `${API_BASE}/diagnosticos/atencion/${atencionId}`,
          {
            codigoCIE10: codCausa,
            descripcion: formDataCausaExterna.descripcion,
            tipoDiagnostico: formDataCausaExterna.tipoDiagnostico,
            esCausaExterna: true,
            padreId: idPadre
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setFormData({ codigoCIE10: '', descripcionCie: '', descripcion: '', tipoDiagnostico: 'PRESUNTIVO', esCausaExterna: false });
      setMostrarSeccionCausaExterna(false);
      setFormDataCausaExterna({ codigoCIE10: '', descripcion: '', tipoDiagnostico: 'PRESUNTIVO' });
      setSearchCausaExterna('');
      setCie10OptionsCausaExterna([]);
      setShowAgregar(false);
      setSearchCie10('');
      cargarDiagnosticos();
    } catch (err) {
      console.error('Error al agregar diagnóstico:', err);
      alert(err.response?.data?.message || 'Error al agregar el diagnóstico.');
    }
  };

  const handleActualizarDiagnostico = async (diagnosticoId, datos) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/diagnosticos/${diagnosticoId}`, datos, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingId(null);
      cargarDiagnosticos();
    } catch (err) {
      console.error('Error al actualizar diagnóstico:', err);
      alert(err.response?.data?.message || 'Error al actualizar.');
    }
  };

  const handleEliminarDiagnostico = async (diagnosticoId) => {
    if (!confirm('¿Está seguro de eliminar este diagnóstico?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/diagnosticos/${diagnosticoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      cargarDiagnosticos();
    } catch (err) {
      console.error('Error al eliminar diagnóstico:', err);
      alert('Error al eliminar el diagnóstico.');
    }
  };

  const handleCancelarAgregar = () => {
    setShowAgregar(false);
    setFormData({ codigoCIE10: '', descripcionCie: '', descripcion: '', tipoDiagnostico: 'PRESUNTIVO', esCausaExterna: false });
    setMostrarSeccionCausaExterna(false);
    setFormDataCausaExterna({ codigoCIE10: '', descripcion: '', tipoDiagnostico: 'PRESUNTIVO' });
    setSearchCie10('');
    setSearchCausaExterna('');
    setCie10OptionsCausaExterna([]);
  };

  const destinoLabel = (diag) => {
    const cod = diag.codigoCIE10 || diag.CIE10?.codigo || '';
    if (esCodigoZ(cod)) return { text: 'Estadístico', bg: 'bg-slate-100 text-slate-800', short: 'Z' };
    if (diag.tipoDiagnostico === 'DEFINITIVO') return { text: 'M. Definitivo', bg: 'bg-green-100 text-green-800', short: 'M' };
    return { text: 'L. Presuntivo', bg: 'bg-amber-100 text-amber-800', short: 'L' };
  };

  const tipoDiagnostico = (diag) => {
    const cod = diag.codigoCIE10 || diag.CIE10?.codigo || '';
    if (esCodigoZ(cod)) return { label: 'Estadístico', bg: 'bg-slate-100 text-slate-700' };
    if (diag.padreId || esCausaExternaRango(cod)) return { label: 'Causa Externa', bg: 'bg-blue-100 text-blue-800' };
    return { label: 'Morbilidad', bg: 'bg-gray-100 text-gray-800' };
  };

  const condicionLabel = (diag) => {
    const cod = diag.codigoCIE10 || diag.CIE10?.codigo || '';
    const t = diag.tipoDiagnostico;
    if (esCodigoZ(cod) || t === 'ESTADISTICO' || t === 'NO APLICA') return 'No Aplica';
    if (t === 'DEFINITIVO') return 'Definitivo';
    return 'Presuntivo';
  };

  // Ordenar para anidar: sin padre primero, luego sus hijos (indentados)
  const diagnosticosOrdenados = [...diagnosticos].sort((a, b) => {
    const aPadre = a.padreId ?? 0;
    const bPadre = b.padreId ?? 0;
    if (aPadre === 0 && bPadre === 0) return (a.orden ?? 0) - (b.orden ?? 0) || (a.id - b.id);
    if (aPadre === 0) return -1;
    if (bPadre === 0) return 1;
    if (aPadre !== bPadre) return aPadre - bPadre;
    return (a.orden ?? 0) - (b.orden ?? 0) || (a.id - b.id);
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-6 text-gray-500">Cargando diagnósticos...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="text-lg font-semibold text-blue-700">DIAGNÓSTICO</h3>
      </div>

      {hayST && !tieneCausaExterna && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong>Trauma (código S o T):</strong> Debe agregar al menos un diagnóstico de causa externa (V00–V99, W00–X59, X60–Y09, Y35–Y84) para poder firmar.
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código CIE <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  value={searchCie10}
                  onChange={(e) => setSearchCie10(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscarCIE10(searchCie10)}
                  placeholder="Escriba el Código CIE y presione enter para buscar"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-9 text-gray-700 focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                  autoFocus
                />
                {(searchCie10 || formData.codigoCIE10) && (
                  <button
                    type="button"
                    onClick={() => { setSearchCie10(''); setFormData(prev => ({ ...prev, codigoCIE10: '', descripcionCie: '' })); setCie10Options([]); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Limpiar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción CIE <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.descripcionCie}
                readOnly
                placeholder="Escriba la Descripción CIE y presione enter para buscar"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-0.5">Se completa al seleccionar un código arriba</p>
            </div>
          </div>
          {searchingCie10 && <p className="text-xs text-gray-500 mb-2">Buscando...</p>}
          {cie10Options.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-sm max-h-52 overflow-y-auto divide-y divide-gray-100">
              {cie10Options.map((cie10) => (
                <button
                  type="button"
                  key={cie10.id}
                  onClick={() => handleSelectCIE10(cie10)}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50/80 transition-colors flex gap-3 items-start text-sm"
                >
                  <span className="font-semibold text-blue-600 shrink-0">{cie10.codigo}</span>
                  <span className="text-gray-700">{cie10.descripcion}</span>
                </button>
              ))}
            </div>
          )}

          {formData.codigoCIE10 && (
            <>
              {esCodigoZ(formData.codigoCIE10) ? (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-700 text-sm">
                  <strong>Código administrativo/estadístico:</strong> No se reflejará en el Formulario 008 legal. Se guarda para reportes.
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo (Form 008):</label>
                    <select
                      value={formData.tipoDiagnostico}
                      onChange={(e) => setFormData({ ...formData, tipoDiagnostico: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700"
                    >
                      <option value="PRESUNTIVO">L. Presuntivo</option>
                      <option value="DEFINITIVO">M. Definitivo</option>
                    </select>
                    {(formData.tipoDiagnostico === 'PRESUNTIVO' && presuntivos.length >= MAX_PRESUNTIVOS) && (
                      <p className="text-xs text-amber-600 mt-1">Límite normativo: máx. {MAX_PRESUNTIVOS} Presuntivos.</p>
                    )}
                    {(formData.tipoDiagnostico === 'DEFINITIVO' && definitivos.length >= MAX_DEFINITIVOS) && (
                      <p className="text-xs text-amber-600 mt-1">Límite normativo: máx. {MAX_DEFINITIVOS} Definitivos.</p>
                    )}
                  </div>
                  {esCausaExternaRango(formData.codigoCIE10) && (
                    <div className="flex items-center gap-2 pt-6">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData.esCausaExterna}
                          onChange={(e) => setFormData({ ...formData, esCausaExterna: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-700">Es Causa Externa (V-W-X-Y)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
              {mostrarSeccionCausaExterna && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                  <p className="text-sm font-medium text-blue-800 mb-2">Causa externa (V01–Y84) — obligatoria para trauma S/T</p>
                  {faltaCausaExterna && (
                    <p className="text-xs text-amber-700 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Debe seleccionar un código V, W, X o Y antes de agregar.
                    </p>
                  )}
                  <label className="block text-xs font-medium text-gray-600 mb-1">Buscar código V, W, X o Y:</label>
                  <input
                    type="text"
                    value={searchCausaExterna}
                    onChange={(e) => setSearchCausaExterna(e.target.value)}
                    placeholder="Ej: V01, W21, X59..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-1 focus:ring-blue-400"
                  />
                  {searchingCausaExterna && <p className="text-xs text-gray-500 mt-1">Buscando...</p>}
                  {cie10OptionsCausaExterna.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg bg-white max-h-40 overflow-y-auto divide-y divide-gray-100">
                      {cie10OptionsCausaExterna.map((cie10) => (
                        <button
                          type="button"
                          key={cie10.id}
                          onClick={() => {
                            const c = (cie10.codigo || '').trim();
                            setFormDataCausaExterna(prev => ({
                              ...prev,
                              codigoCIE10: c,
                              descripcion: cie10.descripcion || prev.descripcion
                            }));
                            setSearchCausaExterna(c);
                            setCie10OptionsCausaExterna([]);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm flex gap-2"
                        >
                          <span className="font-semibold text-blue-600">{cie10.codigo}</span>
                          <span className="text-gray-700">{cie10.descripcion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {formDataCausaExterna.codigoCIE10 && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Condición Causa Externa:</label>
                        <select
                          value={formDataCausaExterna.tipoDiagnostico}
                          onChange={(e) => setFormDataCausaExterna(prev => ({ ...prev, tipoDiagnostico: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                        >
                          <option value="PRESUNTIVO">Presuntivo</option>
                          <option value="DEFINITIVO">Definitivo</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                  placeholder="Observaciones adicionales del diagnóstico"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  type="button"
                  onClick={handleCancelarAgregar}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAgregarDiagnostico}
                  disabled={!formData.codigoCIE10 || faltaCausaExterna || (!esCodigoZ(formData.codigoCIE10) && ((formData.tipoDiagnostico === 'PRESUNTIVO' && presuntivos.length >= MAX_PRESUNTIVOS) || (formData.tipoDiagnostico === 'DEFINITIVO' && definitivos.length >= MAX_DEFINITIVOS)))}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  Confirmar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2 text-sm text-gray-600 mb-4">
        <strong>Resumen para PDF 008:</strong> {presuntivos.length} Presuntivos (L), {definitivos.length} Definitivos (M), {estadisticos.length} Estadísticos (no ocupan slots).
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-0 px-4 py-3 bg-blue-600 rounded-t-xl">
          <h4 className="text-base font-semibold text-white">Diagnósticos registrados</h4>
          <div className="flex items-center gap-4 text-xs text-blue-100">
            <span className="font-medium">Semaforización para diagnósticos de Notificación Obligatoria — Intervención e investigación en máximo:</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-red-400 border border-white/30" title="24 horas" />
              24 horas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-amber-300 border border-white/30" title="48 horas" />
              48 horas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-green-400 border border-white/30" title="Indefinido" />
              Indefinido
            </span>
          </div>
        </div>
        <div className="overflow-x-auto rounded-b-xl border border-t-0 border-gray-200 shadow-sm">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2.5 border-b font-medium text-gray-700">Código</th>
                <th className="px-4 py-2.5 border-b font-medium text-gray-700">Diagnóstico</th>
                <th className="px-4 py-2.5 border-b font-medium text-gray-700">Tipo</th>
                <th className="px-4 py-2.5 border-b font-medium text-gray-700">Condición</th>
                <th className="px-4 py-2.5 border-b font-medium text-gray-700">Observaciones</th>
                {!readOnly && <th className="px-4 py-2.5 border-b font-medium text-gray-700 w-24">Acciones</th>}
              </tr>
            </thead>
          <tbody>
            {diagnosticos.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 5 : 6} className="px-4 py-8 text-center text-gray-500">
                  No hay diagnósticos registrados.
                </td>
              </tr>
            ) : (
              diagnosticosOrdenados.map((diag) => {
                const destino = destinoLabel(diag);
                const tipo = tipoDiagnostico(diag);
                const condicion = condicionLabel(diag);
                const cod = diag.codigoCIE10 || diag.CIE10?.codigo || '';
                const esHijo = !!diag.padreId;
                return (
                  <React.Fragment key={diag.id}>
                    {editingId === diag.id ? (
                      <tr>
                        <td colSpan={readOnly ? 5 : 6} className="p-4 bg-amber-50/50 border-b">
                          <EditarDiagnostico
                            diagnostico={diag}
                            onSave={(datos) => handleActualizarDiagnostico(diag.id, datos)}
                            onCancel={() => setEditingId(null)}
                            readOnly={readOnly}
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr className={`bg-white hover:bg-gray-50/50 ${esHijo ? 'border-l-4 border-l-blue-300' : ''}`}>
                        <td className={`px-4 py-2 border-b ${esHijo ? 'pl-8' : ''}`}>
                          <span className="font-bold text-blue-600">{cod}</span>
                        </td>
                        <td className="px-4 py-2 border-b">
                          <p className="text-gray-700">{diag.CIE10?.descripcion || diag.descripcion}</p>
                          {esCodigoZ(cod) && (
                            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              No se refleja en el Formulario 008 legal.
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-2 border-b">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${tipo.bg}`}>{tipo.label}</span>
                        </td>
                        <td className="px-4 py-2 border-b">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${destino.bg}`}>{condicion}</span>
                        </td>
                        <td className="px-4 py-2 border-b text-gray-600 max-w-[200px] truncate" title={diag.descripcion || ''}>
                          {diag.descripcion || '—'}
                        </td>
                        {!readOnly && (
                          <td className="px-4 py-2 border-b">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingId(diag.id)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminarDiagnostico(diag.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
};

const EditarDiagnostico = ({ diagnostico, onSave, onCancel, readOnly }) => {
  const cod = diagnostico.codigoCIE10 || diagnostico.CIE10?.codigo || '';
  const [formData, setFormData] = useState({
    codigoCIE10: cod,
    descripcion: diagnostico.descripcion || '',
    tipoDiagnostico: (diagnostico.tipoDiagnostico === 'NO APLICA' || diagnostico.tipoDiagnostico === 'ESTADISTICO') ? 'NO APLICA' : diagnostico.tipoDiagnostico,
    esCausaExterna: !!diagnostico.esCausaExterna
  });
  const [cie10Options, setCie10Options] = useState([]);
  const [searchCie10, setSearchCie10] = useState(cod);
  const debRef = useRef(null);

  const buscar = (term) => {
    if (String(term || '').trim().length < 2) {
      setCie10Options([]);
      return;
    }
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(
          `${API_BASE}/cat-cie10/search?query=${encodeURIComponent(term)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCie10Options(Array.isArray(data) ? data.slice(0, 10) : []);
      } catch (_) {
        setCie10Options([]);
      }
    }, 250);
  };

  useEffect(() => {
    buscar(searchCie10);
    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [searchCie10]);

  const handleSelect = (cie10) => {
    const c = (cie10.codigo || '').trim();
    setFormData(prev => ({
      ...prev,
      codigoCIE10: c,
      descripcion: cie10.descripcion || prev.descripcion,
      tipoDiagnostico: esCodigoZ(c) ? 'NO APLICA' : prev.tipoDiagnostico,
      esCausaExterna: esCausaExternaRango(c) ? prev.esCausaExterna : false
    }));
    setSearchCie10(c);
    setCie10Options([]);
  };

  const esZ = esCodigoZ(formData.codigoCIE10);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Código CIE-10:</label>
        <input
          type="text"
          value={searchCie10}
          onChange={(e) => { setSearchCie10(e.target.value); buscar(e.target.value); }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
          disabled={readOnly}
        />
        {cie10Options.length > 0 && (
          <div className="mt-1 border border-gray-200 rounded-lg bg-white max-h-40 overflow-y-auto divide-y divide-gray-100">
            {cie10Options.map((cie10) => (
              <button
                type="button"
                key={cie10.id}
                onClick={() => handleSelect(cie10)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 flex gap-2 text-sm"
              >
                <span className="font-semibold text-blue-600">{cie10.codigo}</span>
                <span className="text-gray-700">{cie10.descripcion}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {!esZ && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo:</label>
          <select
            value={formData.tipoDiagnostico}
            onChange={(e) => setFormData({ ...formData, tipoDiagnostico: e.target.value })}
            disabled={readOnly}
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
          >
            <option value="PRESUNTIVO">L. Presuntivo</option>
            <option value="DEFINITIVO">M. Definitivo</option>
            <option value="ESTADISTICO">Estadístico</option>
          </select>
        </div>
      )}
      {esCausaExternaRango(formData.codigoCIE10) && (
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!formData.esCausaExterna}
            onChange={(e) => setFormData({ ...formData, esCausaExterna: e.target.checked })}
            disabled={readOnly}
            className="rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">Es Causa Externa</span>
        </label>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción:</label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
          disabled={readOnly}
        />
      </div>
      {!readOnly && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSave(formData)}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
          <button type="button" onClick={onCancel} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default DiagnosticosCIE10;
