import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { AlertCircle, Clock, FileText, User, Calendar } from 'lucide-react';
import Header from '../components/Header';

const DashboardPendientes = () => {
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroMedico, setFiltroMedico] = useState('');
  const [medicos, setMedicos] = useState([]);
  const [rolId, setRolId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Obtener rol del usuario desde localStorage
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    setRolId(usuario.rol_id);

    cargarPendientes();
    if (usuario.rol_id === 5) { // Admin
      cargarMedicos();
    }
  }, [filtroMedico]);

  const cargarPendientes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = filtroMedico 
        ? `http://localhost:3001/api/pendientes-firma?medicoId=${filtroMedico}`
        : 'http://localhost:3001/api/pendientes-firma';
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPendientes(response.data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar pendientes:', err);
      setError('Error al cargar las atenciones pendientes.');
    } finally {
      setLoading(false);
    }
  };

  const cargarMedicos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/reasignacion/medicos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedicos(response.data);
    } catch (err) {
      console.error('Error al cargar médicos:', err);
    }
  };

  const handleContinuarAtencion = (atencion) => {
    navigate(`/atencion-emergencia-page/${atencion.admisionId}`);
  };

  const handleFirmarDirectamente = async (atencion) => {
    // Validar primero si puede ser firmada
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3001/api/diagnosticos/validar-firma/${atencion.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data.puedeFirmar) {
        alert(`No se puede firmar: ${response.data.motivo || 'Debe existir al menos un diagnóstico DEFINITIVO.'}`);
        return;
      }

      // Redirigir a la página de firma
      navigate(`/firmar-atencion/${atencion.id}`);
    } catch (err) {
      console.error('Error al validar firma:', err);
      alert('Error al validar si puede ser firmada.');
    }
  };

  const getAlertaClass = (horasPendientes) => {
    if (horasPendientes >= 24) {
      return 'bg-red-50 border-red-200';
    }
    return 'bg-white border-gray-200';
  };

  const getAlertaIcon = (horasPendientes) => {
    if (horasPendientes >= 24) {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    return <Clock className="w-5 h-5 text-yellow-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="flex items-center justify-center flex-1 py-24">
          <div className="text-lg text-gray-600">Cargando pendientes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Bandeja de Pendientes</h1>
        <p className="text-gray-600">Atenciones pendientes de firma del Formulario 008</p>
      </div>

      {rolId === 5 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Médico:
          </label>
          <select
            value={filtroMedico}
            onChange={(e) => setFiltroMedico(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los médicos</option>
            {medicos.map((medico) => (
              <option key={medico.id} value={medico.id}>
                {medico.nombres} {medico.apellidos}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {pendientes.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No hay atenciones pendientes de firma.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendientes.map((atencion) => {
            const paciente = atencion.Paciente;
            const nombrePaciente = `${paciente.primer_nombre} ${paciente.segundo_nombre || ''} ${paciente.primer_apellido} ${paciente.segundo_apellido || ''}`.trim();
            const horasPendientes = atencion.horasPendientes || 0;
            const fechaCreacion = new Date(atencion.createdAt);

            return (
              <div
                key={atencion.id}
                className={`border rounded-lg p-6 ${getAlertaClass(horasPendientes)} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getAlertaIcon(horasPendientes)}
                      {horasPendientes >= 24 && (
                        <span className="text-red-600 font-semibold text-sm">
                          Pendiente por más de 24 horas
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-700">Paciente:</span>
                        </div>
                        <p className="text-gray-900">{nombrePaciente}</p>
                        <p className="text-sm text-gray-600">ID: {paciente.numero_identificacion}</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-700">Fecha de Atención:</span>
                        </div>
                        <p className="text-gray-900">
                          {format(fechaCreacion, 'dd/MM/yyyy')} - {atencion.horaAtencion}
                        </p>
                        <p className="text-sm text-gray-600">
                          Pendiente desde: {format(fechaCreacion, 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>

                      {atencion.UsuarioResponsable && (
                        <div>
                          <span className="font-semibold text-gray-700">Médico Responsable:</span>
                          <p className="text-gray-900">
                            {atencion.UsuarioResponsable.nombres} {atencion.UsuarioResponsable.apellidos}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleContinuarAtencion(atencion)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Continuar Atención
                      </button>
                      <button
                        onClick={() => handleFirmarDirectamente(atencion)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Firmar Directamente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </main>
    </div>
  );
};

export default DashboardPendientes;
