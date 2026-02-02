import React from 'react';

const TIPOS_D = {
  accidentes: [
    { value: 'ACCIDENTE_TRANSITO', label: 'Accidente de Tránsito' },
    { value: 'ACCIDENTE_CAIDA', label: 'Caída' },
    { value: 'ACCIDENTE_LABORAL', label: 'Accidente Laboral' },
    { value: 'ACCIDENTE_QUEMADURA', label: 'Quemadura' },
    { value: 'ACCIDENTE_APLASTAMIENTO', label: 'Aplastamiento/Contusión' },
    { value: 'ACCIDENTE_OTRO', label: 'Otro Accidente' },
  ],
  violencia: [
    { value: 'VIOLENCIA_INTRAFAMILIAR', label: 'Violencia intrafamiliar' },
    { value: 'VIOLENCIA_SEXUAL', label: 'Violencia sexual' },
    { value: 'VIOLENCIA_ARMA_FUEGO', label: 'Agresión con arma de fuego' },
    { value: 'VIOLENCIA_ARMA_BLANCA', label: 'Agresión con arma blanca / punzocortante' },
    { value: 'VIOLENCIA_RINA', label: 'Agresión por riña' },
    { value: 'VIOLENCIA_PSICOLOGICA', label: 'Presunta violencia psicológica' },
    { value: 'VIOLENCIA_FISICA', label: 'Presunta violencia física' },
  ],
  intoxicaciones: [
    { value: 'INTOX_ALCOHOL', label: 'Intoxicación alcohólica' },
    { value: 'INTOX_DROGAS', label: 'Intoxicación por drogas' },
    { value: 'INTOX_ALIMENTARIA', label: 'Intoxicación alimentaria' },
    { value: 'INTOX_PLAGUICIDAS', label: 'Intoxicación por plaguicidas' },
    { value: 'INTOX_INHALACION_GASES', label: 'Inhalación de gases' },
    { value: 'INTOX_OTRA', label: 'Otra intoxicación' },
  ],
};

const EventoTraumatico = ({ formData, setFormData, handleChange, readOnly }) => {
  const d = formData.tipoAccidenteViolenciaIntoxicacion || {};
  const seleccion = Array.isArray(d.seleccion) ? d.seleccion : [];
  const noAplica = d.noAplica === true;
  const eventoRequerido = seleccion.length > 0 && !noAplica;
  const hayViolencia = seleccion.some(v => String(v).startsWith('VIOLENCIA_'));
  const esTransito = seleccion.includes('ACCIDENTE_TRANSITO');
  const obs = String(formData.observacionesAccidente || '');
  const obsLen = obs.trim().length;

  const handleNoAplicaChange = (e) => {
    const isChecked = e.target.checked;
    
    setFormData(prev => ({
      ...prev,
      tipoAccidenteViolenciaIntoxicacion: {
        ...prev.tipoAccidenteViolenciaIntoxicacion,
        noAplica: isChecked,
        seleccion: isChecked ? [] : (prev.tipoAccidenteViolenciaIntoxicacion?.seleccion || []),
        transito: isChecked ? { consumoSustancias: '', proteccion: { casco: false, cinturon: false } } : (prev.tipoAccidenteViolenciaIntoxicacion?.transito || {})
      },
      // Limpiar campos si aplica
      fechaEvento: isChecked ? '' : prev.fechaEvento,
      horaEvento: isChecked ? '' : prev.horaEvento,
      lugarEvento: isChecked ? '' : prev.lugarEvento,
      direccionEvento: isChecked ? '' : prev.direccionEvento,
      custodiaPolicial: isChecked ? null : prev.custodiaPolicial,
      notificacion: isChecked ? null : prev.notificacion,
      sugestivoAlientoAlcoholico: isChecked ? null : prev.sugestivoAlientoAlcoholico,
      observacionesAccidente: isChecked 
        ? 'No aplica. Motivo del consulta registrado en Atención Inicial.' 
        : prev.observacionesAccidente
    }));
  };

  const toggleTipo = (value) => {
    if (noAplica) return; // No permitir cambios si está en No Aplica
    
    setFormData(prev => {
      const cur = prev.tipoAccidenteViolenciaIntoxicacion || {};
      const sel = Array.isArray(cur.seleccion) ? cur.seleccion : [];
      const existe = sel.includes(value);
      const nextSel = existe ? sel.filter(x => x !== value) : [...sel, value];
      const next = { ...cur, seleccion: nextSel };
      if (existe && value === 'ACCIDENTE_TRANSITO') {
        next.transito = { consumoSustancias: '', proteccion: { casco: false, cinturon: false } };
      }
      return { ...prev, tipoAccidenteViolenciaIntoxicacion: next };
    });
  };

  const setTransito = (patch) => {
    setFormData(prev => {
      const cur = prev.tipoAccidenteViolenciaIntoxicacion || {};
      const base = cur.transito || {};
      const baseProt = (base.proteccion || {});
      const patchProt = (patch.proteccion || {});
      return { ...prev,
        tipoAccidenteViolenciaIntoxicacion: {
          ...cur,
          transito: {
            ...base,
            ...patch,
            proteccion: { ...baseProt, ...patchProt }
          }
        }
      };
    });
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-semibold text-gray-800">Accidente, Violencia, Intoxicación</h2>
            <span className="text-xs text-gray-500">(Sección D)</span>
        </div>
        
        {/* Checkbox Dominante No Aplica */}
        <label className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg border border-gray-300 cursor-pointer shadow-sm hover:bg-gray-200 transition-colors">
            <input 
                type="checkbox" 
                checked={noAplica} 
                onChange={handleNoAplicaChange}
                disabled={readOnly}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-bold text-gray-700">No Aplica (Motivo de Consulta No Traumático)</span>
        </label>
      </div>
      
      <p className="text-sm text-gray-500 mb-5">
        Registro normativo MSP Ecuador y estándares de trauma. Complete el relato con precisión clínica y legal.
      </p>

      {/* Selección por categorías */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 ${noAplica ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        {[
          { title: 'Accidentes', items: TIPOS_D.accidentes, color: 'border-sky-100 bg-sky-50/40' },
          { title: 'Violencia', items: TIPOS_D.violencia, color: 'border-rose-100 bg-rose-50/40' },
          { title: 'Intoxicaciones', items: TIPOS_D.intoxicaciones, color: 'border-amber-100 bg-amber-50/40' },
        ].map((cat) => (
          <div key={cat.title} className={`rounded-xl border p-4 ${cat.color}`}>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">{cat.title}</h3>
            <div className="space-y-2">
              {cat.items.map((it) => (
                <label key={it.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seleccion.includes(it.value)}
                    onChange={() => toggleTipo(it.value)}
                    disabled={readOnly || noAplica}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{it.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Datos requeridos del evento (si se selecciona algún tipo) */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 ${noAplica ? 'opacity-50 pointer-events-none' : ''}`}>
        <div>
          <label htmlFor="fechaEvento" className="block text-gray-700 text-sm font-bold mb-2">
            Fecha del evento{eventoRequerido && <span className="text-red-500"> *</span>}
          </label>
          <input
            type="date"
            id="fechaEvento"
            name="fechaEvento"
            value={formData.fechaEvento || ''}
            onChange={handleChange}
            required={eventoRequerido}
            disabled={readOnly || noAplica}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div>
          <label htmlFor="horaEvento" className="block text-gray-700 text-sm font-bold mb-2">
            Hora del evento{eventoRequerido && <span className="text-red-500"> *</span>}
          </label>
          <input
            type="time"
            id="horaEvento"
            name="horaEvento"
            value={formData.horaEvento || ''}
            onChange={handleChange}
            required={eventoRequerido}
            disabled={readOnly || noAplica}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div>
          <label htmlFor="lugarEvento" className="block text-gray-700 text-sm font-bold mb-2">
            Lugar del evento{eventoRequerido && <span className="text-red-500"> *</span>}
          </label>
          <input
            type="text"
            id="lugarEvento"
            name="lugarEvento"
            value={formData.lugarEvento || ''}
            onChange={handleChange}
            required={eventoRequerido}
            disabled={readOnly || noAplica}
            placeholder="Ej.: Vía pública, domicilio, trabajo, escuela…"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div>
          <label htmlFor="direccionEvento" className="block text-gray-700 text-sm font-bold mb-2">
            Dirección{eventoRequerido && <span className="text-red-500"> *</span>}
          </label>
          <input
            type="text"
            id="direccionEvento"
            name="direccionEvento"
            value={formData.direccionEvento || ''}
            onChange={handleChange}
            required={eventoRequerido}
            disabled={readOnly || noAplica}
            placeholder="Calle, barrio, referencia…"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 ${noAplica ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="p-4 rounded-xl border border-gray-100 bg-white">
          <p className="block text-gray-700 text-sm font-bold mb-2">
            Custodia Policial{eventoRequerido && <span className="text-red-500"> *</span>}
          </p>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                className="form-radio"
                name="custodiaPolicial"
                value="true"
                checked={formData.custodiaPolicial === true}
                onChange={handleChange}
                required={eventoRequerido}
                disabled={readOnly || noAplica}
              />
              <span className="text-sm text-gray-700">Sí</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                className="form-radio"
                name="custodiaPolicial"
                value="false"
                checked={formData.custodiaPolicial === false}
                onChange={handleChange}
                required={eventoRequerido}
                disabled={readOnly || noAplica}
              />
              <span className="text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-white">
          <p className="block text-gray-700 text-sm font-bold mb-2">
            Notificación{eventoRequerido && <span className="text-red-500"> *</span>}
          </p>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                className="form-radio"
                name="notificacion"
                value="true"
                checked={formData.notificacion === true}
                onChange={handleChange}
                required={eventoRequerido}
                disabled={readOnly || noAplica}
              />
              <span className="text-sm text-gray-700">Sí</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                className="form-radio"
                name="notificacion"
                value="false"
                checked={formData.notificacion === false}
                onChange={handleChange}
                required={eventoRequerido}
                disabled={readOnly || noAplica}
              />
              <span className="text-sm text-gray-700">No</span>
            </label>
          </div>
          {hayViolencia && formData.notificacion !== true && !noAplica && (
            <p className="mt-2 text-xs text-rose-700">
              Previsión 094: por tratarse de violencia, se requiere notificación legal obligatoria (registre y coordine según protocolo).
            </p>
          )}
        </div>
      </div>

      {/* Filtro de seguridad vial (protocolos internacionales) */}
      {esTransito && !noAplica && (
        <div className="mb-5 p-4 rounded-2xl border border-sky-200 bg-sky-50">
          <h3 className="text-sm font-semibold text-sky-900 mb-3">Accidente de Tránsito – Seguridad vial</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Consumo de sustancias</label>
              <select
                value={(d.transito && d.transito.consumoSustancias) || ''}
                onChange={(e) => setTransito({ consumoSustancias: e.target.value })}
                disabled={readOnly}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="">Seleccionar…</option>
                <option value="NO">No</option>
                <option value="SI">Sí</option>
                <option value="NO_CONSTA">No consta</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Alineado a registro de trauma: sustancia/alcohol u otras.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Uso de protección</label>
              <div className="flex items-center gap-5 flex-wrap">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!((d.transito && d.transito.proteccion && d.transito.proteccion.casco) || false)}
                    onChange={(e) => setTransito({ proteccion: { casco: e.target.checked } })}
                    disabled={readOnly}
                    className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-sm text-gray-700">Casco</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!((d.transito && d.transito.proteccion && d.transito.proteccion.cinturon) || false)}
                    onChange={(e) => setTransito({ proteccion: { cinturon: e.target.checked } })}
                    disabled={readOnly}
                    className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-sm text-gray-700">Cinturón</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Observaciones periciales (obligatorias si hay violencia) */}
      <div className="mb-4">
        <label htmlFor="observacionesAccidente" className="block text-gray-700 text-sm font-bold mb-2">
          Observaciones{hayViolencia && !noAplica && <span className="text-red-500"> *</span>}
        </label>
        <textarea
          id="observacionesAccidente"
          name="observacionesAccidente"
          value={formData.observacionesAccidente || ''}
          onChange={handleChange}
          minLength={hayViolencia && !noAplica ? 100 : undefined}
          required={hayViolencia && !noAplica}
          disabled={readOnly || noAplica} // Deshabilitar si es "No Aplica" (ya tiene el texto automático)
          placeholder={hayViolencia ? 'Describa el relato pericial (mínimo 100 caracteres): mecanismo, agresor si aplica, tiempo, hallazgos, contexto…' : 'Observaciones clínicas y del evento…'}
          className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
            hayViolencia && !noAplica && obsLen > 0 && obsLen < 100 ? 'border-rose-400' : 'text-gray-700'
          }`}
          rows={5}
        />
        {hayViolencia && !noAplica && (
          <div className="flex justify-between mt-1">
            <span className={`text-xs ${obsLen < 100 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {obsLen < 100 ? `⚠️ Relato insuficiente (${obsLen}/100).` : '✅ Relato pericial completo.'}
            </span>
            <span className="text-xs text-gray-500">Requisito de calidad legal (MSP).</span>
          </div>
        )}
      </div>

      {/* Aliento alcohólico */}
      <div className={`mb-2 ${noAplica ? 'opacity-50 pointer-events-none' : ''}`}>
        <p className="block text-gray-700 text-sm font-bold mb-2">
          Sugestivo de aliento alcohólico{eventoRequerido && <span className="text-red-500"> *</span>}
        </p>
        <div className="flex items-center gap-6">
          <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                className="form-radio"
                name="sugestivoAlientoAlcoholico"
                value="true"
                checked={formData.sugestivoAlientoAlcoholico === true}
                onChange={handleChange}
                required={eventoRequerido}
                disabled={readOnly || noAplica}
              />
              <span className="text-sm text-gray-700">Sí</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                className="form-radio"
                name="sugestivoAlientoAlcoholico"
                value="false"
                checked={formData.sugestivoAlientoAlcoholico === false}
                onChange={handleChange}
                required={eventoRequerido}
                disabled={readOnly || noAplica}
              />
              <span className="text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>
    </div>
  );
};

export default EventoTraumatico;
