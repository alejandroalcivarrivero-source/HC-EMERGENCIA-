import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Upload, AlertCircle, Download, PenLine } from 'lucide-react';

const FirmaElectronica = ({ atencionId }) => {
  const [certificado, setCertificado] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validacion, setValidacion] = useState(null);

  // Validar si puede ser firmada al cargar el componente
  React.useEffect(() => {
    validarFirma();
  }, [atencionId]);

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
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea un archivo .p12 o .pfx
      if (file.name.endsWith('.p12') || file.name.endsWith('.pfx')) {
        setCertificado(file);
        setError(null);
      } else {
        setError('Por favor seleccione un archivo .p12 o .pfx');
        setCertificado(null);
      }
    }
  };

  const handleFirmar = async () => {
    if (!certificado) {
      setError('Por favor seleccione el archivo del certificado.');
      return;
    }

    if (!password) {
      setError('Por favor ingrese la contraseña del certificado.');
      return;
    }

    if (!validacion?.puedeFirmar) {
      setError('No se puede firmar: Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z).');
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
          responseType: 'blob' // Para recibir el PDF
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
      
      // Recargar la página o actualizar el estado
      window.location.reload();
    } catch (error) {
      console.error('Error al firmar:', error);
      if (error.response?.data) {
        // Intentar leer el mensaje de error si es JSON
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

  return (
    <div>
      {validacion && !validacion.puedeFirmar && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-2 text-red-700 mb-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold text-sm">No se puede firmar</span>
          </div>
          <p className="text-red-600 text-sm">
            {validacion.motivo || 'Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z).'}
          </p>
          <p className="text-xs text-red-500 mt-1">Diagnósticos: {validacion.totalDiagnosticos || 0}</p>
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
              {/* Botón de oro: único color sólido vibrante (esmeralda) + icono pluma */}
              <button
                onClick={handleFirmar}
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
        </>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="mt-5 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
        <p className="text-xs text-gray-600">
          <strong>Nota:</strong> El certificado .p12 se procesa en memoria. Tras firmar, el formulario quedará bloqueado.
        </p>
      </div>
    </div>
  );
};

export default FirmaElectronica;
