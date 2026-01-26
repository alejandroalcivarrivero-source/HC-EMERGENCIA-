import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import ExcelJS from 'exceljs';

export default function ReportesProduccion() {
  const [usuario, setUsuario] = useState(null);
  const [reporteData, setReporteData] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('dia'); // 'dia', 'semana', 'mes'
  const [usuarioFiltro, setUsuarioFiltro] = useState('todos'); // 'todos' o ID de usuario
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsuario(payload);

      // Si es administrador, cargar lista de usuarios
      if (payload.rol_id === 5) {
        cargarUsuarios();
      }
    } catch (error) {
      console.error('Error al decodificar token:', error);
      localStorage.removeItem('token');
      navigate('/');
    }
  }, [navigate]);

  const cargarUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3001/usuarios', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Filtrar solo usuarios activos
      const usuariosActivos = res.data.filter(u => u.activo);
      setUsuarios(usuariosActivos);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const obtenerReporte = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      // Si hay fechas específicas, usarlas; si no, usar el filtro de tipo
      if (fechaInicio && fechaFin) {
        params.append('fechaInicio', fechaInicio);
        params.append('fechaFin', fechaFin);
      } else {
        params.append('tipoFiltro', filtroFecha);
      }

      // Solo agregar filtro de usuario si es administrador y no es 'todos'
      if (usuario && usuario.rol_id === 5 && usuarioFiltro !== 'todos') {
        params.append('usuarioIdFiltro', usuarioFiltro);
      }

      const res = await axios.get(`http://localhost:3001/procedimientos-emergencia/reportes/produccion?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setReporteData(res.data);
    } catch (error) {
      console.error('Error al obtener reporte:', error);
      alert('Error al obtener el reporte. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const exportarAExcel = async () => {
    if (reporteData.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte de Producción');

      // Definir columnas
      worksheet.columns = [
        { header: 'Fecha y Hora', key: 'fechaHora', width: 20 },
        { header: 'Nombre del Profesional', key: 'nombreProfesional', width: 30 },
        { header: 'Identificación del Paciente', key: 'identificacionPaciente', width: 20 },
        { header: 'Nombre del Paciente', key: 'nombrePaciente', width: 35 },
        { header: 'Tipo de Procedimiento', key: 'tipoProcedimiento', width: 30 },
        { header: 'Clasificación de Triaje', key: 'triaje', width: 20 },
        { header: 'Observación', key: 'observacion', width: 40 },
      ];

      // Estilo para encabezados
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Agregar datos
      reporteData.forEach((item) => {
        const fechaHora = new Date(item.fechaHora);
        worksheet.addRow({
          fechaHora: fechaHora.toLocaleString('es-EC', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          nombreProfesional: item.nombreProfesional,
          identificacionPaciente: item.identificacionPaciente,
          nombrePaciente: item.nombrePaciente,
          tipoProcedimiento: item.tipoProcedimiento,
          triaje: item.triaje,
          observacion: item.observacion || '',
        });
      });

      // Aplicar bordes a todas las celdas con datos
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          if (rowNumber > 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          }
        });
      });

      // Generar nombre del archivo
      const fechaActual = new Date().toISOString().split('T')[0];
      const nombreArchivo = usuario && usuario.rol_id === 5 && usuarioFiltro !== 'todos'
        ? `Reporte_Produccion_${fechaActual}.xlsx`
        : `Reporte_Produccion_Personal_${fechaActual}.xlsx`;

      // Descargar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar el archivo. Por favor, intente nuevamente.');
    }
  };

  // Cargar reporte automáticamente al cambiar filtros (solo cuando usuario está disponible)
  useEffect(() => {
    if (usuario && (usuario.rol_id === 3 || usuario.rol_id === 5)) {
      obtenerReporte();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroFecha, usuarioFiltro, fechaInicio, fechaFin]);

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="p-8">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Verificar que el usuario tenga acceso (Enfermero o Administrador)
  if (usuario.rol_id !== 3 && usuario.rol_id !== 5) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="p-8">
          <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
            <p className="text-gray-600">No tiene permisos para acceder a este módulo.</p>
          </div>
        </div>
      </div>
    );
  }

  const esAdministrador = usuario.rol_id === 5;
  const esEnfermero = usuario.rol_id === 3;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="p-8">
        <div className="max-w-7xl mx-auto bg-white p-6 rounded shadow">
          <h1 className="text-2xl font-bold text-gray-700 mb-6">Reportes de Producción</h1>

          {/* Filtros */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro de Usuario (solo para Administradores) */}
            {esAdministrador && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profesional
                </label>
                <select
                  value={usuarioFiltro}
                  onChange={(e) => setUsuarioFiltro(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="todos">Total Global</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombres} {u.apellidos}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro de Tipo de Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={filtroFecha}
                onChange={(e) => {
                  setFiltroFecha(e.target.value);
                  setFechaInicio('');
                  setFechaFin('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="dia">Hoy</option>
                <option value="semana">Esta Semana</option>
                <option value="mes">Este Mes</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>

            {/* Filtros de Fecha Personalizada */}
            {filtroFecha === 'personalizado' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {/* Botón de Exportar */}
            <div className="flex items-end">
              <button
                onClick={exportarAExcel}
                disabled={loading || reporteData.length === 0}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                📊 Exportar a Excel
              </button>
            </div>
          </div>

          {/* Información del Usuario */}
          {esEnfermero && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Está viendo solo su producción personal. No puede acceder a datos de otros profesionales.
              </p>
            </div>
          )}

          {/* Tabla de Resultados */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Cargando datos...</p>
            </div>
          ) : reporteData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No se encontraron datos para el período seleccionado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    {esAdministrador && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profesional
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Identificación Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Procedimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Triaje
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observación
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reporteData.map((item) => {
                    const fechaHora = new Date(item.fechaHora);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {fechaHora.toLocaleString('es-EC', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        {esAdministrador && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.nombreProfesional}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.identificacionPaciente}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.nombrePaciente}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.tipoProcedimiento}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.triaje}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {item.observacion || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Resumen */}
          {reporteData.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Total de registros:</strong> {reporteData.length}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
