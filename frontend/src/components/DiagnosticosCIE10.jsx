import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Trash2, Save, AlertTriangle, FileText, X } from 'lucide-react';
import AutoCompleteInput from './AutoCompleteInput';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const MAX_PRESUNTIVOS = 3;
const MAX_DEFINITIVOS = 3;

// Funciones auxiliares
const esCodigoZ = (codigo) => /^Z/i.test(String(codigo || '').trim());
const esCodigoST = (codigo) => /^[ST]/i.test(String(codigo || '').trim());
const esCausaExternaRango = (codigo) => /^[VWXY]\d{2}/i.test(String(codigo || '').trim().replace(/\s/g, ''));

const DiagnosticosCIE10 = ({ atencionId, readOnly = false, formDataMain }) => {
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAgregar, setShowAgregar] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Búsqueda CIE-10 Principal
  const [cie10Options, setCie10Options] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchingCie10, setSearchingCie10] = useState(false);
  
  // Búsqueda Causa Externa
  const [externalCauseSearchTerm, setExternalCauseSearchTerm] = useState('');
  const [cie10OptionsCausaExterna, setCie10OptionsCausaExterna] = useState([]);
  const [searchingCausaExterna, setSearchingCausaExterna] = useState(false);

  // Estado del Formulario
  const [formData, setFormData] = useState({
    codigoCIE10: '',
    descripcionCie: '',
    descripcion: '',
    tipoDiagnostico: 'PRESUNTIVO', // PRESUNTIVO, DEFINITIVO, NO APLICA
    condicion: 'Presuntivo', // Presuntivo, Definitivo Inicial, Definitivo Inicial por Laboratorio, NO APLICA
    esCausaExterna: false
  });

  const [mostrarSeccionCausaExterna, setMostrarSeccionCausaExterna] = useState(false);
  const [formDataCausaExterna, setFormDataCausaExterna] = useState({
    codigoCIE10: '',
    descripcion: '',
    tipoDiagnostico: 'PRESUNTIVO',
    condicion: 'Presuntivo'
  });

  const debounceRef = useRef(null);
  const debounceCausaRef = useRef(null);

  // Cargar diagnósticos al montar
  const cargarDiagnosticos = useCallback(async () => {
    // Asegurar ID limpio (entero)
    const idClean = parseInt(atencionId, 10);
    if (!idClean) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Limpieza de URL: Asegurar que no se envíen IDs duplicados o mal formados
      const url = `${API_BASE}/diagnosticos/atencion/${idClean}`;
      const { data } = await axios.get(url, {
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

  // Buscar CIE-10
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
          `${API_BASE}/cat-cie10/buscar?query=${encodeURIComponent(t)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        let results = Array.isArray(data) ? data : [];
        
        const formattedResults = results.slice(0, 15).map(item => ({
          ...item,
          labelCompleto: `${item.codigo} - ${item.descripcion}`
        }));

        setCie10Options(formattedResults);
      } catch (err) {
        console.error('Error al buscar CIE-10:', err);
        setCie10Options([]);
      } finally {
        setSearchingCie10(false);
      }
    }, 280);
  }, [formDataMain]);

  // Buscar Causa Externa (Solo V, W, X, Y)
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
          `${API_BASE}/cat-cie10/buscar?query=${encodeURIComponent(t)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const lista = Array.isArray(data) ? data : [];
        const filtrados = lista.filter(c => esCausaExternaRango((c.codigo || '').trim()));
        
        const formattedResults = filtrados.slice(0, 15).map(item => ({
          ...item,
          labelCompleto: `${item.codigo} - ${item.descripcion}`
        }));
        
        setCie10OptionsCausaExterna(formattedResults);
      } catch (err) {
        console.error('Error al buscar causa externa:', err);
        setCie10OptionsCausaExterna([]);
      } finally {
        setSearchingCausaExterna(false);
      }
    }, 280);
  }, []);

  // Limpieza al cerrar
  useEffect(() => {
    if (!showAgregar) {
        setSearchTerm('');
        setCie10Options([]);
        setExternalCauseSearchTerm('');
        setCie10OptionsCausaExterna([]);
        setFormData({
            codigoCIE10: '',
            descripcionCie: '',
            descripcion: '',
            tipoDiagnostico: 'PRESUNTIVO',
            condicion: 'Presuntivo',
            esCausaExterna: false
        });
    }
  }, [showAgregar]);

  // Sincronización automática (Z Code, S/T)
  useEffect(() => {
    const cod = String(formData.codigoCIE10 || '').trim().toUpperCase();
    
    // Regla 1: Códigos Z -> NO APLICA / ESTADISTICO (Automatización)
    if (esCodigoZ(cod)) {
        // Bloqueo automático del selector en 'No Aplica'
        setFormData(prev => ({
            ...prev,
            tipoDiagnostico: 'NO APLICA',
            condicion: 'NO APLICA'
        }));
        setMostrarSeccionCausaExterna(false);
        return;
    }

    // Regla 2: Códigos S/T -> Obligatorio Causa Externa (Causa Externa Lógica)
    if (esCodigoST(cod)) {
      setMostrarSeccionCausaExterna(true);
      // Restaurar si estaba en NO APLICA
      if (formData.condicion === 'NO APLICA') {
          setFormData(prev => ({ ...prev, tipoDiagnostico: 'PRESUNTIVO', condicion: 'Presuntivo' }));
      }
      return;
    }
    
    // Regla 3: Otros códigos -> Resetear Causa Externa y condiciones si venía de Z
    setMostrarSeccionCausaExterna(false);
    setFormDataCausaExterna({ codigoCIE10: '', descripcion: '', tipoDiagnostico: 'PRESUNTIVO' });
    setExternalCauseSearchTerm('');
    
    if (formData.condicion === 'NO APLICA') {
         setFormData(prev => ({ ...prev, tipoDiagnostico: 'PRESUNTIVO', condicion: 'Presuntivo' }));
    }

  }, [formData.codigoCIE10]);

  // Manejadores de Selección
  const handleSelectCIE10 = (cie10) => {
    const cod = (cie10.codigo || '').trim();
    setFormData(prev => ({
      ...prev,
      codigoCIE10: cod,
      descripcionCie: cie10.descripcion || '',
      descripcion: cie10.descripcion || '', // Auto-fill Description
    }));
    setCie10Options([]);
    setSearchTerm(`${cod} - ${cie10.descripcion}`);
  };

  const handleSelectCausaExterna = (cie10) => {
    const cod = (cie10.codigo || '').trim();
    setFormDataCausaExterna(prev => ({
        ...prev,
        codigoCIE10: cod,
        descripcion: cie10.descripcion || ''
    }));
    setCie10OptionsCausaExterna([]);
    setExternalCauseSearchTerm(`${cod} - ${cie10.descripcion}`);
  };

  // Manejador Cambio de Condición (Sincronización con Tipo)
  const handleCondicionChange = (e) => {
      const val = e.target.value;
      let nuevoTipo = 'PRESUNTIVO'; // Valor por defecto seguro
      
      if (val === 'Definitivo Inicial' || val === 'Definitivo Inicial por Laboratorio') {
          nuevoTipo = 'DEFINITIVO';
      } else if (val === 'NO APLICA') {
          nuevoTipo = 'NO APLICA';
      } else if (val === 'Presuntivo') {
          nuevoTipo = 'PRESUNTIVO';
      }
      
      setFormData(prev => ({
          ...prev,
          condicion: val,
          tipoDiagnostico: nuevoTipo
      }));

      // Sincronizar también la Causa Externa si está visible
      if (mostrarSeccionCausaExterna) {
          setFormDataCausaExterna(prev => ({
              ...prev,
              condicion: val,
              tipoDiagnostico: nuevoTipo
          }));
      }
  };

  // Agregar Diagnóstico
  const handleAgregarDiagnostico = async () => {
    // 1. Validaciones Críticas
    if (!formData.codigoCIE10) {
        alert("Error: Debe seleccionar un diagnóstico válido.");
        return;
    }
    // Validación estricta de tipoDiagnostico
    if (!formData.tipoDiagnostico || formData.tipoDiagnostico === 'null' || !formData.condicion) {
        // Intentar recuperar valores por defecto si es posible
        if (!formData.tipoDiagnostico && formData.condicion) {
            // Si hay condición, deducir tipo
            const tipoDeducido = (formData.condicion === 'Definitivo Inicial' || formData.condicion === 'Definitivo Inicial por Laboratorio')
                ? 'DEFINITIVO'
                : (formData.condicion === 'NO APLICA' ? 'NO APLICA' : 'PRESUNTIVO');
             setFormData(prev => ({ ...prev, tipoDiagnostico: tipoDeducido }));
        } else {
             alert("Error de Validación: El tipo o condición de diagnóstico no pueden estar vacíos. Seleccione una condición válida.");
             return;
        }
    }

    const cod = formData.codigoCIE10.trim();
    
    // Asegurar lógica de Tipos y Códigos Z (CRÍTICO para evitar notNull Violation)
    let tipo = formData.tipoDiagnostico;
    let condicionFinal = formData.condicion;

    // REGLA ABSOLUTA: Si es código Z -> NO APLICA
    if (esCodigoZ(cod)) {
        tipo = 'NO APLICA';
        condicionFinal = 'NO APLICA';
    } else {
        // Lógica de fallback si no es Z pero tipo está vacío
        if (!tipo || tipo === 'null') {
            if (condicionFinal === 'NO APLICA') {
                tipo = 'NO APLICA';
            } else if (condicionFinal && (condicionFinal.includes('Definitivo') || condicionFinal === 'DEFINITIVO')) {
                tipo = 'DEFINITIVO';
            } else {
                tipo = 'PRESUNTIVO';
                if (!condicionFinal) condicionFinal = 'Presuntivo';
            }
        }
    }

    const faltaCausaExterna = mostrarSeccionCausaExterna && !formDataCausaExterna.codigoCIE10;

    // Validación S/T y Evento Traumático
    if (esCodigoST(cod) && formDataMain?.tipoAccidenteViolenciaIntoxicacion?.noAplica) {
        alert('Error Normativo: Para códigos de Trauma (S/T), la sección "Evento Traumático" es obligatoria.');
        return;
    }

    // Validación S/T y Causa Externa requerida
    if (faltaCausaExterna) {
      alert('Requisito CIE-10: Los códigos S y T requieren obligatoriamente un segundo diagnóstico de Causa Externa (V, W, X, Y).');
      return;
    }
    
    // Validación de Límites
    const presuntivosCount = diagnosticos.filter(d => d.tipoDiagnostico === 'PRESUNTIVO' && !esCodigoZ(d.codigoCIE10 || d.CIE10?.codigo)).length;
    const definitivosCount = diagnosticos.filter(d => d.tipoDiagnostico === 'DEFINITIVO' && !esCodigoZ(d.codigoCIE10 || d.CIE10?.codigo)).length;

    if (tipo === 'PRESUNTIVO' && presuntivosCount >= MAX_PRESUNTIVOS) {
      alert(`Límite Alcanzado: Máximo ${MAX_PRESUNTIVOS} diagnósticos Presuntivos (L).`);
      return;
    }
    if (tipo === 'DEFINITIVO' && definitivosCount >= MAX_DEFINITIVOS) {
      alert(`Límite Alcanzado: Máximo ${MAX_DEFINITIVOS} diagnósticos Definitivos (M).`);
      return;
    }

    // ID Limpio y Validaciones Finales de Integridad
    const idClean = parseInt(atencionId, 10);

    if (!idClean || isNaN(idClean)) {
        alert("Atención no guardada: Para agregar diagnósticos, primero debe existir una atención guardada.");
        return;
    }

    // Asegurar que los campos críticos NO sean null antes de enviar
    if (!cod || !tipo) {
        console.error("Error de Integridad: Intentando enviar diagnóstico con campos nulos.", { cod, tipo });
        alert("Error: Faltan datos obligatorios del diagnóstico (Código o Tipo).");
        return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Construcción Robusta del Payload (Garantizando campos exactos - Mapeo de Datos)
      const payload = {
          atencionEmergenciaId: idClean,
          codigoCIE10: cod,
          tipoDiagnostico: tipo || 'PRESUNTIVO', // Fallback de seguridad
          descripcion: formData.descripcion || formData.descripcionCie || 'Sin descripción',
          condicion: condicionFinal || 'Presuntivo', // Fallback de seguridad
          esCausaExterna: !!formData.esCausaExterna
      };

      if (mostrarSeccionCausaExterna && formDataCausaExterna.codigoCIE10) {
          payload.causaExterna = {
              codigoCIE10: formDataCausaExterna.codigoCIE10,
              descripcion: formDataCausaExterna.descripcion,
              tipoDiagnostico: tipo || 'PRESUNTIVO',
              condicion: condicionFinal || 'Presuntivo'
          };
      }

      console.log('Enviando Diagnóstico Payload (Saneado):', payload);

      // Envío con ID limpio en URL (Limpieza de URL: evitar 1:1)
      await axios.post(
        `${API_BASE}/diagnosticos/atencion/${idClean}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Resetear formulario
      setShowAgregar(false);
      setFormData({ 
          codigoCIE10: '', descripcionCie: '', descripcion: '', 
          tipoDiagnostico: 'PRESUNTIVO', condicion: 'Presuntivo', esCausaExterna: false 
      });
      setMostrarSeccionCausaExterna(false);
      setFormDataCausaExterna({ codigoCIE10: '', descripcion: '', tipoDiagnostico: 'PRESUNTIVO', condicion: 'Presuntivo' });
      
      cargarDiagnosticos();

    } catch (err) {
      console.error('Error al agregar diagnóstico:', err);
      if (err.response?.status === 500) {
          const backendMsg = err.response?.data?.message || err.response?.data?.error || '';
          alert(`Error del Servidor (500): ${backendMsg || 'No se pudo procesar la solicitud. Posibles causas:\n- Datos incompletos o inválidos.\n- Problemas de conexión con la base de datos.'}`);
      } else {
          alert(err.response?.data?.message || 'Error al agregar el diagnóstico.');
      }
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

  // Renderizado de Etiquetas
  const getBadgeStyle = (tipo, codigo) => {
      if (esCodigoZ(codigo) || tipo === 'NO APLICA') return 'bg-slate-100 text-slate-700 border-slate-200';
      if (tipo === 'DEFINITIVO') return 'bg-green-100 text-green-800 border-green-200';
      if (tipo === 'PRESUNTIVO') return 'bg-amber-50 text-amber-800 border-amber-200'; // Ajustado visualmente
      return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando diagnósticos...</div>;
  }

  const esZCodeActual = esCodigoZ(formData.codigoCIE10);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            DIAGNÓSTICO
        </h3>
      </div>

      {/* Alerta Informativa */}
      {diagnosticos.some(d => esCodigoST(d.codigoCIE10 || d.CIE10?.codigo)) && !diagnosticos.some(d => esCausaExternaRango(d.codigoCIE10 || d.CIE10?.codigo)) && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            <strong>Atención:</strong> Ha registrado un diagnóstico de Trauma (S/T). 
            Debe agregar un diagnóstico de <strong>Causa Externa</strong> para proceder con el alta.
          </p>
        </div>
      )}

      {/* Formulario de Agregar */}
      {!readOnly && (
        <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
          {!showAgregar ? (
            <button
              onClick={() => setShowAgregar(true)}
              className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-400 font-medium transition-all"
            >
              + Agregar Nuevo Diagnóstico
            </button>
          ) : (
            <div className="space-y-6">
              {/* Header del Formulario */}
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <h4 className="font-semibold text-gray-700">Nuevo Diagnóstico</h4>
                <button onClick={() => setShowAgregar(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>
              </div>

              {/* GRID LAYOUT PRINCIPAL - Sistema de Rejilla de 2 Columnas (Layout Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* COLUMNA 1: Diagnóstico Principal + Condición */}
                <div className="col-span-1 flex flex-col gap-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h5 className="font-bold text-gray-800 border-b pb-3 text-sm tracking-wide uppercase flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                        Diagnóstico Principal
                    </h5>
                    
                    {/* Buscador (CIE-10) */}
                    <div className="space-y-1">
                        <AutoCompleteInput
                            label="Buscar Diagnóstico (CIE-10)"
                            name="busquedaCIE10"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (!e.target.value) setFormData(prev => ({ ...prev, codigoCIE10: '', descripcionCie: '' }));
                            }}
                            onSearch={buscarCIE10}
                            suggestions={cie10Options}
                            onSelect={handleSelectCIE10}
                            displayKey="labelCompleto"
                            placeholder="Ej: A090, J00..."
                            disabled={readOnly}
                            required
                        />
                        {searchingCie10 && <span className="text-xs text-blue-500 font-medium ml-1">Buscando...</span>}
                    </div>

                    {/* Condición de Diagnóstico */}
                    <div className={`p-4 rounded-lg border transition-colors ${esZCodeActual ? 'bg-gray-50 border-gray-200' : 'bg-blue-50/30 border-blue-100'}`}>
                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                            Condición del Diagnóstico <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.condicion}
                            onChange={handleCondicionChange}
                            disabled={esZCodeActual} // Bloqueo automático si es código Z
                            required
                            className={`w-full px-3 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm font-medium
                                ${esZCodeActual ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-300 text-gray-800 hover:border-blue-300'}`}
                        >
                            {esZCodeActual ? (
                                <option value="NO APLICA">No Aplica (Estadístico - Código Z)</option>
                            ) : (
                                <>
                                    <option value="" disabled>-- Seleccione Condición --</option>
                                    <option value="Presuntivo">Presuntivo</option>
                                    <option value="Definitivo Inicial">Definitivo Inicial</option>
                                    <option value="Definitivo Inicial por Laboratorio">Definitivo Inicial por Laboratorio</option>
                                </>
                            )}
                        </select>
                        {!esZCodeActual && formData.tipoDiagnostico && (
                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Tipo Clasificado:</span>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-sm border ${
                                    formData.tipoDiagnostico === 'DEFINITIVO'
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : 'bg-amber-100 text-amber-700 border-amber-200'
                                }`}>
                                    {formData.tipoDiagnostico}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA 2: Causa Externa + Condición (Solo si es Trauma S/T) */}
                {mostrarSeccionCausaExterna && (
                    <div className="col-span-1 flex flex-col gap-4 p-5 bg-amber-50/50 border border-amber-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                        <h5 className="font-bold text-amber-900 border-b border-amber-200 pb-3 text-sm tracking-wide uppercase flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold">2</div>
                            Causa Externa (V-Y)
                        </h5>
                        
                        {/* Buscador Causa Externa */}
                        <div className="space-y-1">
                            <AutoCompleteInput
                                label={
                                    <span className="flex items-center gap-1 text-amber-900 font-semibold">
                                        Buscar Causa Externa <span className="text-red-600">*</span>
                                    </span>
                                }
                                name="busquedaCausaExterna"
                                value={externalCauseSearchTerm}
                                onChange={(e) => {
                                    setExternalCauseSearchTerm(e.target.value);
                                    if (!e.target.value) setFormDataCausaExterna(prev => ({ ...prev, codigoCIE10: '', descripcion: '' }));
                                }}
                                onSearch={buscarCausaExterna}
                                suggestions={cie10OptionsCausaExterna}
                                onSelect={handleSelectCausaExterna}
                                displayKey="labelCompleto"
                                placeholder="Ej: W01, X59..."
                                disabled={readOnly}
                                required
                            />
                            {searchingCausaExterna && <span className="text-xs text-amber-700 font-medium ml-1">Filtrando códigos V, W, X, Y...</span>}
                        </div>

                        {/* Condición Causa Externa (Visible y Sincronizada) */}
                        <div className="bg-white p-4 rounded-lg border border-amber-100 shadow-sm">
                            <label className="block text-xs font-bold text-amber-900 mb-2 uppercase tracking-wide">
                                Condición (Sincronizada)
                            </label>
                            <select
                                value={formDataCausaExterna.condicion || formData.condicion} // Fallback a la principal
                                disabled={true} // Deshabilitado para forzar sincronización
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 font-medium text-sm cursor-not-allowed"
                            >
                                <option value="" disabled>-- Sincronizando --</option>
                                <option value="Presuntivo">Presuntivo</option>
                                <option value="Definitivo Inicial">Definitivo Inicial</option>
                                <option value="Definitivo Inicial por Laboratorio">Definitivo Inicial por Laboratorio</option>
                                <option value="NO APLICA">No Aplica</option>
                            </select>
                            <div className="mt-3 flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-amber-800 font-bold">Clasificación:</span>
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium border border-amber-200">
                                    {formDataCausaExterna.tipoDiagnostico || formData.tipoDiagnostico}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Observación (Ancho Completo) */}
                <div className="col-span-1 md:col-span-2 mt-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Observación (Opcional)
                    </label>
                    <textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Detalles adicionales del diagnóstico..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-sm resize-none"
                    />
                </div>
              </div>


              {/* Botones de Acción */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 mt-4">
                  <button
                      onClick={() => setShowAgregar(false)}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                      Cancelar
                  </button>
                  <button
                      type="button"
                      onClick={handleAgregarDiagnostico}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                  >
                      <Save className="w-4 h-4" />
                      Guardar Diagnóstico
                  </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Tabla de Resultados */}
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-medium">
            <tr>
              <th className="px-4 py-3 border-b">Código</th>
              <th className="px-4 py-3 border-b">Diagnóstico</th>
              <th className="px-4 py-3 border-b">Tipo</th>
              <th className="px-4 py-3 border-b">Condición</th>
              <th className="px-4 py-3 border-b text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {diagnosticos.length === 0 ? (
                <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        No hay diagnósticos registrados.
                    </td>
                </tr>
            ) : (
                diagnosticos.map((diag) => {
                    const cod = diag.codigoCIE10 || diag.CIE10?.codigo || '';
                    const esHijo = !!diag.padreId;
                    const badgeClass = getBadgeStyle(diag.tipoDiagnostico, cod);
                    
                    return (
                        <tr key={diag.id} className={`hover:bg-gray-50/50 ${esHijo ? 'bg-blue-50/30' : ''}`}>
                            <td className={`px-4 py-3 font-semibold text-gray-900 ${esHijo ? 'pl-8 border-l-4 border-blue-200' : ''}`}>
                                {cod}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                                {diag.CIE10?.descripcion || diag.descripcion}
                                {diag.descripcion && diag.descripcion !== (diag.CIE10?.descripcion) && (
                                    <div className="text-xs text-gray-500 mt-1 italic">Obs: {diag.descripcion}</div>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${badgeClass}`}>
                                    {diag.tipoDiagnostico}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                                {diag.condicion}
                            </td>
                            <td className="px-4 py-3 text-right">
                                {!readOnly && (
                                    <button
                                        onClick={() => handleEliminarDiagnostico(diag.id)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-right">
        * Códigos Z no se reflejan en Formulario 008 Legal.
      </div>
    </div>
  );
};

export default DiagnosticosCIE10;
