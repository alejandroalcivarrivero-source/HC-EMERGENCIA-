/**
 * Componente Botón para Imprimir Formulario 008
 * Genera y abre el PDF en ventana de impresión
 */
import React, { useState } from 'react';
import { Printer, FileText, Loader } from 'lucide-react';
import axios from 'axios';

const BotonImprimirFormulario008 = ({ 
  atencionId, 
  admisionId,
  paciente,
  admision,
  atencion,
  signosVitales,
  triaje,
  motivoConsulta
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarDatosCompletos = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      // Obtener diagnósticos
      const diagnosticosResponse = await axios.get(
        `http://localhost:3001/api/diagnosticos/atencion/${atencionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const diagnosticos = diagnosticosResponse.data || [];

      // Obtener datos del médico desde la atención completa
      let medico = null;
      try {
        // Obtener la atención completa con Usuario incluido
        const atencionCompletaResponse = await axios.get(
          `http://localhost:3001/api/atencion-emergencia/${atencionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (atencionCompletaResponse.data?.Usuario) {
          medico = atencionCompletaResponse.data.Usuario;
        } else if (atencion?.Usuario) {
          medico = atencion.Usuario;
        }
      } catch (err) {
        console.warn('No se pudo obtener datos del médico:', err);
        // Usar datos por defecto si no se puede obtener
        medico = {
          nombres: 'Andrés Alejandro',
          apellidos: 'Alcívar Rivero',
          cedula: 'N/A'
        };
      }

      // Estructurar datos para el PDF
      // Asegurar que atencion incluya Usuario si viene de la respuesta
      const atencionCompleta = atencion || {};
      if (medico && !atencionCompleta.Usuario) {
        atencionCompleta.Usuario = medico;
      }

      const datosPDF = {
        paciente: paciente || {},
        admision: admision || {},
        atencion: atencionCompleta,
        signosVitales: signosVitales || {},
        triaje: triaje || null,
        motivoConsulta: motivoConsulta || atencion?.motivoAtencion || '',
        diagnosticos: diagnosticos,
        medico: medico
      };

      return datosPDF;
    } catch (error) {
      console.error('Error al cargar datos para PDF:', error);
      throw new Error('Error al cargar los datos necesarios para generar el PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleImprimir = async () => {
    try {
      const datosPDF = await cargarDatosCompletos();
      // Importación dinámica para evitar errores al cargar la página
      const { imprimirPDFFormulario008 } = await import('../services/generadorPDFFormulario008');
      imprimirPDFFormulario008(datosPDF);
    } catch (err) {
      console.error('Error al imprimir PDF:', err);
      setError(err.message || 'Error al generar el PDF');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDescargar = async () => {
    try {
      setLoading(true);
      const datosPDF = await cargarDatosCompletos();
      const { descargarPDFFormulario008 } = await import('../services/generadorPDFFormulario008');
      descargarPDFFormulario008(datosPDF);
    } catch (err) {
      setError(err.message || 'Error al descargar el PDF');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleImprimir}
          disabled={loading || !atencionId}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Generando...</span>
            </>
          ) : (
            <>
              <Printer className="w-4 h-4" />
              <span>Imprimir Formulario 008</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDescargar}
          disabled={loading || !atencionId}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Descargar PDF</span>
        </button>
      </div>
    </div>
  );
};

export default BotonImprimirFormulario008;
