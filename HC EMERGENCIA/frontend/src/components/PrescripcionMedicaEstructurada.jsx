/**
 * Componente de Prescripción Médica Estructurada
 * Permite agregar medicamentos y procedimientos con todos los campos requeridos
 * Preparado para integración con Formulario 008 y generación de órdenes (010/012)
 */
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Pill, Stethoscope, TestTube, Scan } from 'lucide-react';

const PrescripcionMedicaEstructurada = ({ 
  prescripciones = [], 
  onChange, 
  readOnly = false 
}) => {
  // Normalizar prescripciones: convertir formato antiguo a nuevo si es necesario
  const normalizarPrescripciones = (prescripciones) => {
    if (!prescripciones || !Array.isArray(prescripciones)) {
      return [];
    }
    
    return prescripciones.map(presc => {
      // Si ya tiene tipo, retornar tal cual
      if (presc.tipo) {
        return presc;
      }
      
      // Si tiene campos del formato antiguo, convertir
      if (presc.medicamento || presc.via || presc.dosis) {
        return {
          tipo: 'medicamento',
          nombre: presc.medicamento || '',
          nombreGenerico: '',
          concentracion: '',
          formaFarmaceutica: '',
          dosis: presc.dosis || '',
          frecuencia: presc.posologia || '',
          viaAdministracion: presc.via || '',
          duracion: presc.dias ? presc.dias.toString() : '',
          duracionUnidad: 'días',
          cantidad: '',
          indicaciones: '',
          requiereOrden: false
        };
      }
      
      // Si no tiene estructura conocida, retornar tal cual
      return presc;
    });
  };

  const prescripcionesNormalizadas = normalizarPrescripciones(prescripciones);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [tipoPrescripcion, setTipoPrescripcion] = useState('medicamento'); // 'medicamento' | 'procedimiento_lab' | 'procedimiento_imagen'

  // Opciones predefinidas
  const viasAdministracion = [
    'Oral', 'Intramuscular', 'Intravenosa', 'Subcutánea', 'Tópica', 
    'Rectal', 'Vaginal', 'Oftálmica', 'Ótica', 'Nasal', 'Inhalatoria'
  ];

  const formasFarmaceuticas = [
    'Tableta', 'Cápsula', 'Jarabe', 'Suspensión', 'Solución', 
    'Inyección', 'Ungüento', 'Crema', 'Gotas', 'Supositorio', 
    'Óvulo', 'Spray', 'Parche', 'Polvo'
  ];

  const tiposProcedimientoLab = [
    'Hemograma completo',
    'Química sanguínea',
    'Perfil lipídico',
    'Perfil hepático',
    'Perfil renal',
    'Glicemia',
    'Hemoglobina glicosilada',
    'TSH',
    'T4 libre',
    'Proteína C reactiva',
    'VDRL',
    'ELISA VIH',
    'Urocultivo',
    'Coprocultivo',
    'Otro'
  ];

  const tiposProcedimientoImagen = [
    'Radiografía de tórax',
    'Radiografía de abdomen',
    'Radiografía de extremidades',
    'Ecografía abdominal',
    'Ecografía pélvica',
    'Tomografía axial computarizada',
    'Resonancia magnética',
    'Otro'
  ];

  const frecuenciaOpciones = [
    'Cada 8 horas',
    'Cada 12 horas',
    'Cada 24 horas',
    'Cada 6 horas',
    'Cada 4 horas',
    'Cada hora',
    'Según necesidad',
    'Una vez al día',
    'Dos veces al día',
    'Tres veces al día',
    'Cuatro veces al día'
  ];

  const [formData, setFormData] = useState({
    tipo: 'medicamento', // 'medicamento' | 'procedimiento_lab' | 'procedimiento_imagen'
    // Campos para medicamento
    nombre: '',
    nombreGenerico: '',
    concentracion: '',
    formaFarmaceutica: '',
    dosis: '',
    frecuencia: '',
    viaAdministracion: '',
    duracion: '',
    duracionUnidad: 'días', // 'días' | 'semanas' | 'meses'
    cantidad: '',
    indicaciones: '',
    // Campos para procedimiento
    nombreProcedimiento: '',
    tipoProcedimiento: '',
    observaciones: '',
    requiereOrden: true // Flag para generar orden 010/012
  });

  const handleAdd = () => {
    if (editingIndex !== null) {
      // Actualizar existente
      const nuevasPrescripciones = [...prescripcionesNormalizadas];
      nuevasPrescripciones[editingIndex] = { ...formData };
      onChange(nuevasPrescripciones);
      setEditingIndex(null);
    } else {
      // Agregar nuevo
      onChange([...prescripcionesNormalizadas, { ...formData }]);
    }
    resetForm();
  };

  const handleEdit = (index) => {
    const prescripcion = prescripcionesNormalizadas[index];
    setFormData(prescripcion);
    setTipoPrescripcion(prescripcion.tipo || 'medicamento');
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = (index) => {
    if (window.confirm('¿Está seguro de eliminar esta prescripción?')) {
      const nuevasPrescripciones = prescripcionesNormalizadas.filter((_, i) => i !== index);
      onChange(nuevasPrescripciones);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'medicamento',
      nombre: '',
      nombreGenerico: '',
      concentracion: '',
      formaFarmaceutica: '',
      dosis: '',
      frecuencia: '',
      viaAdministracion: '',
      duracion: '',
      duracionUnidad: 'días',
      cantidad: '',
      indicaciones: '',
      nombreProcedimiento: '',
      tipoProcedimiento: '',
      observaciones: '',
      requiereOrden: true
    });
    setTipoPrescripcion('medicamento');
    setShowForm(false);
    setEditingIndex(null);
  };

  const handleTipoChange = (tipo) => {
    setTipoPrescripcion(tipo);
    setFormData(prev => ({ ...prev, tipo }));
  };

  const formatPrescripcion = (prescripcion) => {
    if (prescripcion.tipo === 'medicamento') {
      return `${prescripcion.nombre || prescripcion.nombreGenerico} ${prescripcion.concentracion || ''} ${prescripcion.formaFarmaceutica || ''} - ${prescripcion.dosis || ''} ${prescripcion.frecuencia || ''} - ${prescripcion.viaAdministracion || ''} - ${prescripcion.duracion || ''} ${prescripcion.duracionUnidad || 'días'}`;
    } else if (prescripcion.tipo === 'procedimiento_lab') {
      return `LAB: ${prescripcion.nombreProcedimiento || prescripcion.tipoProcedimiento}`;
    } else if (prescripcion.tipo === 'procedimiento_imagen') {
      return `IMG: ${prescripcion.nombreProcedimiento || prescripcion.tipoProcedimiento}`;
    }
    return 'Prescripción';
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Plan de Tratamiento</h3>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Prescripción
          </button>
        )}
      </div>

      {/* Lista de prescripciones */}
      {prescripcionesNormalizadas.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <Pill className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No hay prescripciones registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescripcionesNormalizadas.map((prescripcion, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {prescripcion.tipo === 'medicamento' && (
                      <Pill className="w-5 h-5 text-blue-600" />
                    )}
                    {prescripcion.tipo === 'procedimiento_lab' && (
                      <TestTube className="w-5 h-5 text-green-600" />
                    )}
                    {prescripcion.tipo === 'procedimiento_imagen' && (
                      <Scan className="w-5 h-5 text-purple-600" />
                    )}
                    <span className="font-semibold text-gray-800">
                      {prescripcion.tipo === 'medicamento' ? 'Medicamento' :
                       prescripcion.tipo === 'procedimiento_lab' ? 'Procedimiento de Laboratorio' :
                       'Procedimiento de Imagenología'}
                    </span>
                    {prescripcion.requiereOrden && (prescripcion.tipo === 'procedimiento_lab' || prescripcion.tipo === 'procedimiento_imagen') && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                        Requiere Orden
                      </span>
                    )}
                  </div>

                  {/* Detalles del medicamento */}
                  {prescripcion.tipo === 'medicamento' && (
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                      <div>
                        <span className="font-medium">Nombre:</span> {prescripcion.nombre || prescripcion.nombreGenerico || 'N/A'}
                      </div>
                      {prescripcion.concentracion && (
                        <div>
                          <span className="font-medium">Concentración:</span> {prescripcion.concentracion}
                        </div>
                      )}
                      {prescripcion.formaFarmaceutica && (
                        <div>
                          <span className="font-medium">Forma:</span> {prescripcion.formaFarmaceutica}
                        </div>
                      )}
                      {prescripcion.dosis && (
                        <div>
                          <span className="font-medium">Dosis:</span> {prescripcion.dosis}
                        </div>
                      )}
                      {prescripcion.frecuencia && (
                        <div>
                          <span className="font-medium">Frecuencia:</span> {prescripcion.frecuencia}
                        </div>
                      )}
                      {prescripcion.viaAdministracion && (
                        <div>
                          <span className="font-medium">Vía:</span> {prescripcion.viaAdministracion}
                        </div>
                      )}
                      {prescripcion.duracion && (
                        <div>
                          <span className="font-medium">Duración:</span> {prescripcion.duracion} {prescripcion.duracionUnidad || 'días'}
                        </div>
                      )}
                      {prescripcion.indicaciones && (
                        <div className="col-span-2">
                          <span className="font-medium">Indicaciones:</span> {prescripcion.indicaciones}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detalles del procedimiento */}
                  {(prescripcion.tipo === 'procedimiento_lab' || prescripcion.tipo === 'procedimiento_imagen') && (
                    <div className="text-sm text-gray-700">
                      <div className="mb-1">
                        <span className="font-medium">Procedimiento:</span> {prescripcion.nombreProcedimiento || prescripcion.tipoProcedimiento || 'N/A'}
                      </div>
                      {prescripcion.observaciones && (
                        <div>
                          <span className="font-medium">Observaciones:</span> {prescripcion.observaciones}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resumen para Formulario 008 */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Resumen:</span> {formatPrescripcion(prescripcion)}
                    </p>
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex gap-2 ml-4">
                    <button
                      type="button"
                      onClick={() => handleEdit(index)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario de agregar/editar */}
      {showForm && !readOnly && (
        <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-800">
              {editingIndex !== null ? 'Editar Prescripción' : 'Nueva Prescripción'}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de tipo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Prescripción <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTipoChange('medicamento')}
                className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                  tipoPrescripcion === 'medicamento'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Pill className="w-4 h-4 inline mr-2" />
                Medicamento
              </button>
              <button
                type="button"
                onClick={() => handleTipoChange('procedimiento_lab')}
                className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                  tipoPrescripcion === 'procedimiento_lab'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <TestTube className="w-4 h-4 inline mr-2" />
                Laboratorio
              </button>
              <button
                type="button"
                onClick={() => handleTipoChange('procedimiento_imagen')}
                className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                  tipoPrescripcion === 'procedimiento_imagen'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Scan className="w-4 h-4 inline mr-2" />
                Imagenología
              </button>
            </div>
          </div>

          {/* Campos para medicamento */}
          {tipoPrescripcion === 'medicamento' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Comercial / Vademecum
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Paracetamol 500mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Genérico
                  </label>
                  <input
                    type="text"
                    value={formData.nombreGenerico}
                    onChange={(e) => setFormData({ ...formData, nombreGenerico: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Acetaminofén"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Concentración <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.concentracion}
                    onChange={(e) => setFormData({ ...formData, concentracion: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 500mg, 250mg/5ml"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma Farmacéutica <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.formaFarmaceutica}
                    onChange={(e) => setFormData({ ...formData, formaFarmaceutica: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione...</option>
                    {formasFarmaceuticas.map((forma) => (
                      <option key={forma} value={forma}>{forma}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.dosis}
                    onChange={(e) => setFormData({ ...formData, dosis: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 1 tableta, 5ml"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frecuencia <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.frecuencia}
                    onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione...</option>
                    {frecuenciaOpciones.map((freq) => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vía de Administración <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.viaAdministracion}
                    onChange={(e) => setFormData({ ...formData, viaAdministracion: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione...</option>
                    {viasAdministracion.map((via) => (
                      <option key={via} value={via}>{via}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duración <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.duracion}
                      onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 7"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad
                    </label>
                    <select
                      value={formData.duracionUnidad}
                      onChange={(e) => setFormData({ ...formData, duracionUnidad: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="días">Días</option>
                      <option value="semanas">Semanas</option>
                      <option value="meses">Meses</option>
                    </select>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indicaciones Especiales
                  </label>
                  <textarea
                    value={formData.indicaciones}
                    onChange={(e) => setFormData({ ...formData, indicaciones: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Ej: Tomar con alimentos, evitar alcohol..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Campos para procedimiento de laboratorio */}
          {tipoPrescripcion === 'procedimiento_lab' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Procedimiento <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tipoProcedimiento}
                  onChange={(e) => setFormData({ ...formData, tipoProcedimiento: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Seleccione...</option>
                  {tiposProcedimientoLab.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              {formData.tipoProcedimiento === 'Otro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Procedimiento
                  </label>
                  <input
                    type="text"
                    value={formData.nombreProcedimiento}
                    onChange={(e) => setFormData({ ...formData, nombreProcedimiento: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Especifique el procedimiento"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Indicaciones especiales para el procedimiento..."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiereOrdenLab"
                  checked={formData.requiereOrden}
                  onChange={(e) => setFormData({ ...formData, requiereOrden: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="requiereOrdenLab" className="text-sm text-gray-700">
                  Generar Orden de Laboratorio (Formulario 010)
                </label>
              </div>
            </div>
          )}

          {/* Campos para procedimiento de imagenología */}
          {tipoPrescripcion === 'procedimiento_imagen' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Procedimiento <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tipoProcedimiento}
                  onChange={(e) => setFormData({ ...formData, tipoProcedimiento: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Seleccione...</option>
                  {tiposProcedimientoImagen.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              {formData.tipoProcedimiento === 'Otro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Procedimiento
                  </label>
                  <input
                    type="text"
                    value={formData.nombreProcedimiento}
                    onChange={(e) => setFormData({ ...formData, nombreProcedimiento: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Especifique el procedimiento"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                  placeholder="Indicaciones especiales para el procedimiento..."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiereOrdenImg"
                  checked={formData.requiereOrden}
                  onChange={(e) => setFormData({ ...formData, requiereOrden: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="requiereOrdenImg" className="text-sm text-gray-700">
                  Generar Orden de Imagenología (Formulario 012)
                </label>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleAdd}
              disabled={
                (tipoPrescripcion === 'medicamento' && (!formData.concentracion || !formData.formaFarmaceutica || !formData.dosis || !formData.frecuencia || !formData.viaAdministracion || !formData.duracion)) ||
                ((tipoPrescripcion === 'procedimiento_lab' || tipoPrescripcion === 'procedimiento_imagen') && !formData.tipoProcedimiento)
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {editingIndex !== null ? 'Guardar Cambios' : 'Agregar Prescripción'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Resumen para Formulario 008 */}
      {prescripcionesNormalizadas.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Resumen para Formulario 008:</h4>
          <div className="space-y-1 text-sm text-blue-700">
            {prescripcionesNormalizadas.map((prescripcion, index) => (
              <div key={index}>
                {index + 1}. {formatPrescripcion(prescripcion)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescripcionMedicaEstructurada;
