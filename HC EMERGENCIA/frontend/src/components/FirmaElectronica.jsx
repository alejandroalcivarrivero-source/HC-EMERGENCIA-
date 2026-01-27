import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Upload, AlertCircle, Download, PenLine, Usb, File, Loader, CheckCircle2 } from 'lucide-react';

const FirmaElectronica = ({ atencionId }) => {
  const [certificado, setCertificado] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validacion, setValidacion] = useState(null);
  const [metodoFirma, setMetodoFirma] = useState('ARCHIVO'); // ARCHIVO o TOKEN
  const [cargandoMetodo, setCargandoMetodo] = useState(true);
  
  // Estados para firma con token
  const [solicitudToken, setSolicitudToken] = useState(null);
  const [estadoFirmaToken, setEstadoFirmaToken] = useState(null); // PENDIENTE, COMPLETADA, ERROR
  const [intervaloVerificacion, setIntervaloVerificacion] = useState(null);

  // Cargar método de firma del usuario al montar
  useEffect(() => {
    cargarMetodoFirma();
  }, []);

  // Validar si puede ser firmada al cargar el componente
  useEffect(() => {
    validarFirma();
  }, [atencionId]);

  // Revalidar cuando el componente se vuelve visible (por si se actualizaron datos)
  useEffect(() => {
    if (validacion && !validacion.puedeFirmar) {
      const interval = setInterval(() => {
        validarFirma();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [validacion]);

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (intervaloVerificacion) {
        clearInterval(intervaloVerificacion);
      }
    };
  }, [intervaloVerificacion]);

  const cargarMetodoFirma = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:3001/api/usuarios/metodo-firma',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMetodoFirma(response.data.metodoFirma || 'ARCHIVO');
    } catch (error) {
      console.error('Error al cargar método de firma:', error);
      // Usar ARCHIVO por defecto si hay error
      setMetodoFirma('ARCHIVO');
    } finally {
      setCargandoMetodo(false);
    }
  };

  const validarFirma = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3001/api/diagnosticos/validar-firma/${atencionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setValidacion(response.data);
    } catch (error) {
      console.error('Error al validar firma:', error);
      setError('Error al validar los requisitos de firma. Intente de nuevo.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.p12') || file.name.endsWith('.pfx')) {
        setCertificado(file);
        setError(null);
      } else {
        setError('Por favor seleccione un archivo .p12 o .pfx');
        setCertificado(null);
      }
    }
  };

  // ============================================
  // FIRMA CON ARCHIVO .p12 (Método actual)
  // ============================================
  const handleFirmarArchivo = async () => {
    if (!certificado) {
      setError('Por favor seleccione el archivo del certificado.');
      return;
    }

    if (!password) {
      setError('Por favor ingrese la contraseña del certificado.');
      return;
    }

    if (!validacion?.puedeFirmar) {
      const motivo = validacion?.motivo || 'La atención no cumple los requisitos para ser firmada.';
      setError(`No se puede firmar: ${motivo}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('certificado', certificado);
      formData.append('password', password);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:3001/api/firma-electronica/firmar/${atencionId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          responseType: 'blob'
        }
      );

      // Crear un enlace de descarga para el PDF firmado
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `formulario_008_${atencionId}_firmado.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('Formulario firmado exitosamente. El PDF se ha descargado.');
      window.location.reload();
    } catch (error) {
      console.error('Error al firmar:', error);
      if (error.response?.data) {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            const errorData = JSON.parse(reader.result);
            setError(errorData.message || 'Error al firmar el formulario.');
          };
          reader.readAsText(error.response.data);
        } catch {
          setError('Error al firmar el formulario. Verifique que el certificado y la contraseña sean correctos.');
        }
      } else {
        setError('Error al firmar el formulario. Verifique que el certificado y la contraseña sean correctos.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FIRMA CON TOKEN USB (Nuevo método)
  // ============================================
  const handlePrepararFirmaToken = async () => {
    if (!validacion?.puedeFirmar) {
      const motivo = validacion?.motivo || 'La atención no cumple los requisitos para ser firmada.';
      setError(`No se puede firmar: ${motivo}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setEstadoFirmaToken('PENDIENTE');

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:3001/api/firma-electronica/preparar/${atencionId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { solicitudToken: tokenSolicitud, documentoPreparado, instrucciones } = response.data;
      setSolicitudToken(tokenSolicitud);

      // Intentar abrir el agente externo mediante protocolo personalizado
      const protocoloUrl = `firmaec://firmar?token=${tokenSolicitud}&digest=${documentoPreparado.digestBase64}&callback=${encodeURIComponent(documentoPreparado.callbackUrl)}`;
      
      // Intentar abrir el agente
      try {
        window.location.href = protocoloUrl;
      } catch (e) {
        console.warn('No se pudo abrir el agente automáticamente:', e);
        // Mostrar instrucciones manuales
        setError(`Agente de firma no detectado. Por favor, abra el agente de firma manualmente y use el token: ${tokenSolicitud}`);
      }

      // Iniciar verificación periódica del estado
      iniciarVerificacionEstado(tokenSolicitud);
    } catch (error) {
      console.error('Error al preparar firma con token:', error);
      setError(error.response?.data?.message || 'Error al preparar la firma con token.');
      setEstadoFirmaToken('ERROR');
      setLoading(false);
    }
  };

  const iniciarVerificacionEstado = (token) => {
    // Verificar estado cada 2 segundos
    const interval = setInterval(async () => {
      try {
        const tokenAuth = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:3001/api/firma-electronica/token/estado/${token}`,
          { headers: { Authorization: `Bearer ${tokenAuth}` } }
        );

        if (response.data.completada) {
          // Firma completada
          clearInterval(interval);
          setIntervaloVerificacion(null);
          setEstadoFirmaToken('COMPLETADA');
          setLoading(false);
          
          // Descargar PDF firmado
          await descargarPDFFirmado();
        } else if (response.data.estado === 'ERROR') {
          clearInterval(interval);
          setIntervaloVerificacion(null);
          setEstadoFirmaToken('ERROR');
          setLoading(false);
          setError('Error al procesar la firma del token.');
        }
      } catch (error) {
        console.error('Error al verificar estado:', error);
      }
    }, 2000);

    setIntervaloVerificacion(interval);

    // Timeout de 5 minutos
    setTimeout(() => {
      clearInterval(interval);
      if (estadoFirmaToken === 'PENDIENTE') {
        setEstadoFirmaToken('ERROR');
        setLoading(false);
        setError('Tiempo de espera agotado. La firma no se completó.');
      }
    }, 300000);
  };

  const descargarPDFFirmado = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3001/api/firma-electronica/preview/${atencionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `formulario_008_${atencionId}_firmado.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('Formulario firmado exitosamente con token USB. El PDF se ha descargado.');
      window.location.reload();
    } catch (error) {
      console.error('Error al descargar PDF firmado:', error);
      setError('Error al descargar el PDF firmado.');
    }
  };

  const handlePreviewPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3001/api/firma-electronica/preview/${atencionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error al generar preview:', error);
      alert('Error al generar la vista previa del PDF.');
    }
  };

  if (cargandoMetodo) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-5 h-5 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Cargando configuración de firma...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Selector de método de firma (solo si el usuario puede cambiarlo) */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {metodoFirma === 'ARCHIVO' ? (
              <File className="w-4 h-4 text-blue-600" />
            ) : (
              <Usb className="w-4 h-4 text-blue-600" />
            )}
            <span className="text-sm font-medium text-blue-900">
              Método de firma: <strong>{metodoFirma === 'ARCHIVO' ? 'Archivo .p12' : 'Token USB'}</strong>
            </span>
          </div>
          <a
            href="/perfil"
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Cambiar en perfil
          </a>
        </div>
      </div>

      {validacion && !validacion.puedeFirmar && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold text-sm">No se puede firmar - Requisitos incompletos</span>
          </div>
          
          <p className="text-red-600 text-sm font-medium mb-3">
            {validacion.motivo || 'La atención no cumple los requisitos para ser firmada.'}
          </p>

          {validacion.erroresCriticos && validacion.erroresCriticos.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs font-semibold text-red-700 uppercase">Errores encontrados:</p>
              <ul className="list-disc list-inside space-y-1">
                {validacion.erroresCriticos.map((error, index) => (
                  <li key={index} className="text-xs text-red-600">
                    <span className="font-medium">{error.bloque === 'anamnesis' ? 'Anamnesis' : 
                      error.bloque === 'diagnosticos' ? 'Diagnósticos CIE-10' : 
                      error.bloque === 'planTratamiento' ? 'Plan de Tratamiento' : 'General'}:</span> {error.mensaje}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validacion.detalles && (
            <div className="mt-3 pt-3 border-t border-red-200 space-y-2">
              {validacion.detalles.anamnesis && (
                <div className="text-xs">
                  <span className="font-semibold text-red-700">Anamnesis:</span>
                  <span className={`ml-2 ${validacion.detalles.anamnesis.valido ? 'text-green-600' : 'text-red-600'}`}>
                    {validacion.detalles.anamnesis.valido ? '✓ Completa' : '✗ Incompleta'}
                  </span>
                </div>
              )}

              {validacion.detalles.diagnosticos && (
                <div className="text-xs">
                  <span className="font-semibold text-red-700">Diagnósticos:</span>
                  <span className={`ml-2 ${validacion.detalles.diagnosticos.valido ? 'text-green-600' : 'text-red-600'}`}>
                    {validacion.detalles.diagnosticos.valido ? '✓ Válidos' : '✗ Inválidos'}
                  </span>
                </div>
              )}

              {validacion.detalles.planTratamiento && (
                <div className="text-xs">
                  <span className="font-semibold text-red-700">Plan de Tratamiento:</span>
                  <span className={`ml-2 ${validacion.detalles.planTratamiento.valido ? 'text-green-600' : 'text-red-600'}`}>
                    {validacion.detalles.planTratamiento.valido ? '✓ Completo' : '✗ Incompleto'}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-red-200">
            <p className="text-xs text-red-600 mb-2">
              <strong>Acción requerida:</strong> Complete los bloques de <strong>Anamnesis</strong>, <strong>Diagnósticos CIE-10</strong> y <strong>Plan de Tratamiento</strong> 
              antes de poder firmar el formulario.
            </p>
            <button
              onClick={validarFirma}
              className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Revalidar requisitos
            </button>
          </div>
        </div>
      )}

      {validacion && validacion.puedeFirmar && (
        <>
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <FileText className="w-4 h-4" />
              <span className="font-semibold text-sm">Listo para firmar</span>
            </div>
            <p className="text-emerald-600 text-sm">
              La atención cumple los requisitos para firma digital.
            </p>
          </div>

          {/* FIRMA CON ARCHIVO .p12 */}
          {metodoFirma === 'ARCHIVO' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificado Digital (.p12):
                </label>
                <label className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors bg-gray-50/50">
                  <Upload className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
                  <span className="text-gray-700 font-medium">
                    {certificado ? certificado.name : 'Seleccionar archivo .p12'}
                  </span>
                  <input
                    type="file"
                    accept=".p12,.pfx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña del Certificado:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese la contraseña del certificado"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 text-base bg-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handlePreviewPDF}
                  className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium border border-gray-200"
                >
                  <Download className="w-4 h-4" />
                  Vista previa
                </button>
                <button
                  onClick={handleFirmarArchivo}
                  disabled={loading || !certificado || !password}
                  className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-bold text-base shadow-sm hover:shadow-md"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Firmando...</span>
                    </>
                  ) : (
                    <>
                      <PenLine className="w-5 h-5 shrink-0" />
                      <span>Finalizar y Firmar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* FIRMA CON TOKEN USB */}
          {metodoFirma === 'TOKEN' && (
            <div className="space-y-4">
              {estadoFirmaToken === null && (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Usb className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                          Firma con Token USB
                        </p>
                        <p className="text-xs text-blue-700 mb-3">
                          Asegúrese de tener conectado su token USB y que el agente de firma esté instalado y ejecutándose.
                        </p>
                        <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                          <li>Conecte su token USB al equipo</li>
                          <li>Verifique que el agente de firma esté activo</li>
                          <li>Haga clic en "Iniciar Firma con Token"</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handlePreviewPDF}
                      className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium border border-gray-200"
                    >
                      <Download className="w-4 h-4" />
                      Vista previa
                    </button>
                    <button
                      onClick={handlePrepararFirmaToken}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-bold text-base shadow-sm hover:shadow-md"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Preparando...</span>
                        </>
                      ) : (
                        <>
                          <Usb className="w-5 h-5 shrink-0" />
                          <span>Iniciar Firma con Token</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {estadoFirmaToken === 'PENDIENTE' && (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader className="w-5 h-5 text-amber-600 animate-spin" />
                    <span className="font-semibold text-amber-900">Esperando firma del token...</span>
                  </div>
                  <p className="text-sm text-amber-700 mb-2">
                    Por favor, complete la firma en el agente de firma externo.
                  </p>
                  {solicitudToken && (
                    <p className="text-xs text-amber-600 font-mono bg-amber-100 p-2 rounded">
                      Token de solicitud: {solicitudToken}
                    </p>
                  )}
                  <p className="text-xs text-amber-600 mt-3">
                    El sistema verificará automáticamente cuando la firma esté lista.
                  </p>
                </div>
              )}

              {estadoFirmaToken === 'COMPLETADA' && (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-900">Firma completada exitosamente</span>
                  </div>
                </div>
              )}

              {estadoFirmaToken === 'ERROR' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700 font-medium">
                    Error al procesar la firma. Intente nuevamente.
                  </p>
                  <button
                    onClick={() => {
                      setEstadoFirmaToken(null);
                      setSolicitudToken(null);
                      setError(null);
                    }}
                    className="mt-3 text-xs px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="mt-5 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
        <p className="text-xs text-gray-600">
          {metodoFirma === 'ARCHIVO' ? (
            <>
              <strong>Nota:</strong> El certificado .p12 se procesa en memoria. Tras firmar, el formulario quedará bloqueado.
            </>
          ) : (
            <>
              <strong>Nota:</strong> El agente de firma debe estar instalado y ejecutándose. Compatible con Linux Mint y Windows mediante PKCS#11.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default FirmaElectronica;
