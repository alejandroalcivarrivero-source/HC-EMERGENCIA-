import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import ExcelJS from 'exceljs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Users, Activity, TrendingUp, Download, Filter, X } from 'lucide-react';

export default function ReportesEnfermeria() {
  const [usuario, setUsuario] = useState(null);
  const [reporteData, setReporteData] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('dia');
  const [categoriaProfesional, setCategoriaProfesional] = useState('todos'); // Nuevo filtro de categoría
  const [usuarioFiltro, setUsuarioFiltro] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // Filtros demográficos
  const [filtroEdad, setFiltroEdad] = useState('');
  const [filtroSexo, setFiltroSexo] = useState('');
  const [filtroEtnia, setFiltroEtnia] = useState('');
  const [filtroSeguro, setFiltroSeguro] = useState('');
  
  const navigate = useNavigate();

  const categoriasEdad = [
    'Menores de 1 año',
    '1-4 años',
    '5-9 años',
    '10-14 años',
    '15-19 años',
    '20-64 años',
    '65 años y más'
  ];

  const sexos = ['Masculino', 'Femenino'];

  const etnias = [
    'Mestizo',
    'Montubio',
    'Afroecuatoriano',
    'Indígena',
    'Blanco',
    'Otros',
    'No especificado'
  ];

  const seguros = [
    'MSP',
    'IESS',
    'ISSFA',
    'ISSPOL',
    'Privado',
    'Sin Seguro'
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsuario(payload);

      if (payload.rol_id === 5) {
        cargarUsuarios();
      }
    } catch (error) {
      console.error('Error al decodificar token:', error);
      localStorage.removeItem('token');
      navigate('/');
    }
  }, [navigate, categoriaProfesional]); // Agregar categoriaProfesional como dependencia

  const cargarUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3001/usuarios', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Filtrar usuarios según la categoría profesional seleccionada
      let usuariosFiltrados = res.data.filter(u => u.activo);
      
      if (categoriaProfesional === 'medicina') {
        usuariosFiltrados = usuariosFiltrados.filter(u => u.rol_id === 1 || u.rol_id === 2); // Médico u Obstetriz
      } else if (categoriaProfesional === 'enfermeria') {
        usuariosFiltrados = usuariosFiltrados.filter(u => u.rol_id === 3); // Enfermería
      } else {
        // Si es 'todos', mostrar todos los profesionales médicos y de enfermería
        usuariosFiltrados = usuariosFiltrados.filter(u => u.rol_id === 1 || u.rol_id === 2 || u.rol_id === 3);
      }
      
      setUsuarios(usuariosFiltrados);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const obtenerReporte = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (fechaInicio && fechaFin) {
        params.append('fechaInicio', fechaInicio);
        params.append('fechaFin', fechaFin);
      } else {
        params.append('tipoFiltro', filtroFecha);
      }

      if (usuario && usuario.rol_id === 5) {
        if (usuarioFiltro !== 'todos') {
          params.append('usuarioIdFiltro', usuarioFiltro);
        }
        // Agregar filtro de categoría profesional para administradores
        if (categoriaProfesional && categoriaProfesional !== 'todos') {
          params.append('categoriaProfesional', categoriaProfesional);
        }
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

  // Aplicar filtros demográficos a los datos
  const datosFiltrados = useMemo(() => {
    let filtrados = [...reporteData];

    if (filtroEdad) {
      filtrados = filtrados.filter(item => item.categoriaEdad === filtroEdad);
    }

    if (filtroSexo) {
      filtrados = filtrados.filter(item => item.sexo === filtroSexo);
    }

    if (filtroEtnia) {
      filtrados = filtrados.filter(item => item.etnia === filtroEtnia);
    }

    if (filtroSeguro) {
      filtrados = filtrados.filter(item => item.seguro === filtroSeguro);
    }

    return filtrados;
  }, [reporteData, filtroEdad, filtroSexo, filtroEtnia, filtroSeguro]);

  // Calcular estadísticas para las tarjetas
  const estadisticas = useMemo(() => {
    if (datosFiltrados.length === 0) {
      return {
        totalPacientes: 0,
        totalProcedimientos: 0,
        promedioDiario: 0,
      };
    }

    const pacientesUnicos = new Set(datosFiltrados.map(item => item.identificacionPaciente));
    const totalPacientes = pacientesUnicos.size;
    const totalProcedimientos = datosFiltrados.length;

    const diasUnicos = new Set(
      datosFiltrados.map(item => {
        const fecha = new Date(item.fechaHora);
        return fecha.toISOString().split('T')[0];
      })
    );
    const numDias = diasUnicos.size || 1;
    const promedioDiario = Math.round((totalProcedimientos / numDias) * 10) / 10;

    return {
      totalPacientes,
      totalProcedimientos,
      promedioDiario,
    };
  }, [datosFiltrados]);

  // Datos para gráfico de barras (Pacientes por Día)
  const datosPacientesPorDia = useMemo(() => {
    const datosPorDia = {};

    datosFiltrados.forEach((item) => {
      const fecha = new Date(item.fechaHora);
      const fechaStr = fecha.toLocaleDateString('es-EC', {
        day: '2-digit',
        month: '2-digit',
      });

      if (!datosPorDia[fechaStr]) {
        datosPorDia[fechaStr] = {
          fecha: fechaStr,
          pacientes: new Set(),
          procedimientos: 0,
        };
      }

      datosPorDia[fechaStr].pacientes.add(item.identificacionPaciente);
      datosPorDia[fechaStr].procedimientos += 1;
    });

    return Object.values(datosPorDia)
      .map(dia => ({
        fecha: dia.fecha,
        pacientes: dia.pacientes.size,
        procedimientos: dia.procedimientos,
      }))
      .sort((a, b) => {
        const fechaA = new Date(a.fecha.split('/').reverse().join('-'));
        const fechaB = new Date(b.fecha.split('/').reverse().join('-'));
        return fechaA - fechaB;
      });
  }, [datosFiltrados]);

  // Datos para gráfico de donut (Distribución de Procedimientos o Diagnósticos según categoría)
  const datosDistribucionProcedimientos = useMemo(() => {
    const distribucion = {};
    const esMedicina = categoriaProfesional === 'medicina' || 
      (categoriaProfesional === 'todos' && datosFiltrados.some(d => d.tipoRegistro === 'consulta'));

    datosFiltrados.forEach((item) => {
      let clave;
      if (esMedicina && item.tipoRegistro === 'consulta') {
        // Para medicina, usar diagnósticos
        clave = item.diagnostico || 'Sin diagnóstico';
      } else if (item.tipoRegistro === 'procedimiento') {
        // Para enfermería, usar procedimientos
        clave = item.tipoProcedimiento || 'Sin procedimiento';
      } else {
        return; // Saltar si no aplica
      }
      
      if (!distribucion[clave]) {
        distribucion[clave] = 0;
      }
      distribucion[clave] += 1;
    });

    return Object.entries(distribucion)
      .map(([nombre, cantidad]) => ({
        name: nombre,
        value: cantidad,
      }))
      .sort((a, b) => b.value - a.value);
  }, [datosFiltrados, categoriaProfesional]);

  const COLORS_PROCEDIMIENTOS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  ];

  const limpiarFiltros = () => {
    setFiltroEdad('');
    setFiltroSexo('');
    setFiltroEtnia('');
    setFiltroSeguro('');
  };

  const tieneFiltrosActivos = filtroEdad || filtroSexo || filtroEtnia || filtroSeguro;

  const exportarAExcel = async () => {
    if (datosFiltrados.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();

      // HOJA 1: DETALLE (cada fila es un procedimiento o consulta)
      const worksheetDetalle = workbook.addWorksheet('Detalle');
      worksheetDetalle.columns = [
        { header: 'Nº Registro', key: 'numero', width: 12 },
        { header: 'Fecha', key: 'fecha', width: 20 },
        { header: 'Cédula', key: 'cedula', width: 15 },
        { header: 'Primer Apellido', key: 'primerApellido', width: 20 },
        { header: 'Segundo Apellido', key: 'segundoApellido', width: 20 },
        { header: 'Primer Nombre', key: 'primerNombre', width: 20 },
        { header: 'Segundo Nombre', key: 'segundoNombre', width: 20 },
        { header: 'Apellidos y Nombres', key: 'nombreCompleto', width: 40 },
        { header: 'Sexo', key: 'sexo', width: 12 },
        { header: 'Edad', key: 'edad', width: 10 },
        { header: 'Etnia', key: 'etnia', width: 20 },
        { header: 'Seguro', key: 'seguro', width: 15 },
        { header: 'Discapacidad', key: 'discapacidad', width: 15 },
        { header: 'Categoría Profesional', key: 'categoriaProfesional', width: 20 },
        { header: 'Especialidad/Rol', key: 'rolProfesional', width: 20 },
        { header: 'Nombre del Procedimiento/Diagnóstico', key: 'procedimiento', width: 30 },
        { header: 'Profesional', key: 'profesional', width: 30 },
        { header: 'Triaje', key: 'triaje', width: 20 },
      ];

      // Estilo para encabezados de Detalle
      worksheetDetalle.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheetDetalle.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      worksheetDetalle.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Agregar datos a Detalle
      datosFiltrados.forEach((item, index) => {
        const fechaHora = new Date(item.fechaHora);
        const procedimientoODiagnostico = item.tipoRegistro === 'consulta' 
          ? (item.diagnostico || 'Sin diagnóstico')
          : (item.tipoProcedimiento || 'Sin procedimiento');
        
        worksheetDetalle.addRow({
          numero: index + 1,
          fecha: fechaHora.toLocaleString('es-EC', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          cedula: item.identificacionPaciente,
          primerApellido: item.primerApellido || '',
          segundoApellido: item.segundoApellido || '',
          primerNombre: item.primerNombre || '',
          segundoNombre: item.segundoNombre || '',
          nombreCompleto: `${item.primerApellido || ''} ${item.segundoApellido || ''} ${item.primerNombre || ''} ${item.segundoNombre || ''}`.trim(),
          sexo: item.sexo || 'N/A',
          edad: item.edad !== null && item.edad !== undefined ? item.edad : 'N/A',
          etnia: item.etnia || 'No especificado',
          seguro: item.seguro || 'Sin seguro',
          discapacidad: item.discapacidad || 'No',
          categoriaProfesional: item.categoriaProfesional || 'N/A',
          rolProfesional: item.rolProfesional || 'N/A',
          procedimiento: procedimientoODiagnostico,
          profesional: item.nombreProfesional,
          triaje: item.triaje || 'N/A',
        });
      });

      // Aplicar bordes a Detalle
      worksheetDetalle.eachRow((row, rowNumber) => {
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

      // HOJA 2: RESUMEN (cada fila es un paciente único)
      const worksheetResumen = workbook.addWorksheet('Resumen');
      const esMedicina = categoriaProfesional === 'medicina' || 
        datosFiltrados.some(d => d.tipoRegistro === 'consulta');
      const columnaTotal = esMedicina ? 'Total Consultas Realizadas' : 'Total Procedimientos Realizados';
      
      worksheetResumen.columns = [
        { header: 'Nº', key: 'numero', width: 8 },
        { header: 'Cédula', key: 'cedula', width: 15 },
        { header: 'Primer Apellido', key: 'primerApellido', width: 20 },
        { header: 'Segundo Apellido', key: 'segundoApellido', width: 20 },
        { header: 'Primer Nombre', key: 'primerNombre', width: 20 },
        { header: 'Segundo Nombre', key: 'segundoNombre', width: 20 },
        { header: 'Apellidos y Nombres', key: 'nombreCompleto', width: 40 },
        { header: 'Sexo', key: 'sexo', width: 12 },
        { header: 'Edad', key: 'edad', width: 10 },
        { header: 'Etnia', key: 'etnia', width: 20 },
        { header: 'Seguro', key: 'seguro', width: 15 },
        { header: 'Discapacidad', key: 'discapacidad', width: 15 },
        { header: columnaTotal, key: 'totalProcedimientos', width: 30 },
      ];

      // Estilo para encabezados de Resumen
      worksheetResumen.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheetResumen.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' },
      };
      worksheetResumen.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Agrupar por paciente y contar procedimientos
      const pacientesMap = new Map();
      datosFiltrados.forEach((item) => {
        const key = item.identificacionPaciente;
        if (!pacientesMap.has(key)) {
          pacientesMap.set(key, {
            ...item,
            totalProcedimientos: 0,
          });
        }
        pacientesMap.get(key).totalProcedimientos += 1;
      });

      // Agregar datos a Resumen
      Array.from(pacientesMap.values()).forEach((paciente, index) => {
        worksheetResumen.addRow({
          numero: index + 1,
          cedula: paciente.identificacionPaciente,
          primerApellido: paciente.primerApellido || '',
          segundoApellido: paciente.segundoApellido || '',
          primerNombre: paciente.primerNombre || '',
          segundoNombre: paciente.segundoNombre || '',
          nombreCompleto: `${paciente.primerApellido || ''} ${paciente.segundoApellido || ''} ${paciente.primerNombre || ''} ${paciente.segundoNombre || ''}`.trim(),
          sexo: paciente.sexo || 'N/A',
          edad: paciente.edad !== null && paciente.edad !== undefined ? paciente.edad : 'N/A',
          etnia: paciente.etnia || 'No especificado',
          seguro: paciente.seguro || 'Sin seguro',
          discapacidad: paciente.discapacidad || 'No',
          totalProcedimientos: paciente.totalProcedimientos,
        });
      });

      // Aplicar bordes a Resumen
      worksheetResumen.eachRow((row, rowNumber) => {
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

      const fechaActual = new Date().toISOString().split('T')[0];
      const nombreArchivo = esAdministrador
        ? `Reportes_Globales_${fechaActual}.xlsx`
        : `Reporte_Produccion_Personal_${fechaActual}.xlsx`;

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

  useEffect(() => {
    if (usuario && (usuario.rol_id === 3 || usuario.rol_id === 5)) {
      obtenerReporte();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroFecha, usuarioFiltro, fechaInicio, fechaFin, categoriaProfesional]);

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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Título y Botón Exportar */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">
                {esAdministrador ? 'Reportes Globales' : 'Dashboard de Producción'}
              </h1>
              <button
                onClick={exportarAExcel}
                disabled={loading || datosFiltrados.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Download size={20} />
                Exportar Excel
              </button>
            </div>

            {/* Filtros Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {esAdministrador && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría Profesional
                    </label>
                    <select
                      value={categoriaProfesional}
                      onChange={(e) => {
                        setCategoriaProfesional(e.target.value);
                        setUsuarioFiltro('todos'); // Resetear filtro de usuario al cambiar categoría
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="todos">Todos</option>
                      <option value="medicina">Medicina</option>
                      <option value="enfermeria">Enfermería</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {categoriaProfesional === 'medicina' ? 'Médico' : categoriaProfesional === 'enfermeria' ? 'Enfermero' : 'Profesional'}
                    </label>
                    <select
                      value={usuarioFiltro}
                      onChange={(e) => setUsuarioFiltro(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="todos">
                        {categoriaProfesional === 'medicina' ? 'Todos los Médicos' : 
                         categoriaProfesional === 'enfermeria' ? 'Todos los Enfermeros' : 
                         'Todos los Profesionales'}
                      </option>
                      {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombres} {u.apellidos}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

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
            </div>

            {/* Filtros Demográficos */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Filter size={20} />
                  Filtros Demográficos
                </h3>
                {tieneFiltrosActivos && (
                  <button
                    onClick={limpiarFiltros}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <X size={16} />
                    Limpiar Filtros
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rango de Edad
                  </label>
                  <select
                    value={filtroEdad}
                    onChange={(e) => setFiltroEdad(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos</option>
                    {categoriasEdad.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sexo
                  </label>
                  <select
                    value={filtroSexo}
                    onChange={(e) => setFiltroSexo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos</option>
                    {sexos.map((sexo) => (
                      <option key={sexo} value={sexo}>
                        {sexo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Autoidentificación Étnica
                  </label>
                  <select
                    value={filtroEtnia}
                    onChange={(e) => setFiltroEtnia(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas</option>
                    {etnias.map((etnia) => (
                      <option key={etnia} value={etnia}>
                        {etnia}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Seguro
                  </label>
                  <select
                    value={filtroSeguro}
                    onChange={(e) => setFiltroSeguro(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos</option>
                    {seguros.map((seguro) => (
                      <option key={seguro} value={seguro}>
                        {seguro}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total de Pacientes</p>
                  <p className="text-3xl font-bold">{estadisticas.totalPacientes}</p>
                </div>
                <Users size={48} className="text-blue-200 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">
                    {esAdministrador && categoriaProfesional === 'medicina' 
                      ? 'Total de Consultas' 
                      : esAdministrador && categoriaProfesional === 'enfermeria'
                      ? 'Total de Procedimientos'
                      : esAdministrador && categoriaProfesional === 'todos'
                      ? 'Total de Actividades'
                      : 'Total de Procedimientos'}
                  </p>
                  <p className="text-3xl font-bold">{estadisticas.totalProcedimientos}</p>
                </div>
                <Activity size={48} className="text-green-200 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Promedio Diario</p>
                  <p className="text-3xl font-bold">{estadisticas.promedioDiario}</p>
                </div>
                <TrendingUp size={48} className="text-purple-200 opacity-80" />
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico de Barras - Pacientes por Día */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Pacientes Atendidos por Día</h2>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">Cargando datos...</p>
                </div>
              ) : datosPacientesPorDia.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">No hay datos para mostrar</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datosPacientesPorDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="fecha"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="pacientes" fill="#3B82F6" name="Pacientes" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="procedimientos" fill="#10B981" name="Procedimientos" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Gráfico de Donut - Distribución de Procedimientos o Diagnósticos */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {categoriaProfesional === 'medicina' || (categoriaProfesional === 'todos' && datosFiltrados.some(d => d.tipoRegistro === 'consulta'))
                  ? 'Distribución de Diagnósticos/Consultas'
                  : 'Distribución de Procedimientos Realizados'}
              </h2>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">Cargando datos...</p>
                </div>
              ) : datosDistribucionProcedimientos.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">No hay datos para mostrar</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={datosDistribucionProcedimientos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {datosDistribucionProcedimientos.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS_PROCEDIMIENTOS[index % COLORS_PROCEDIMIENTOS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tabla de Datos */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalle de Procedimientos</h2>
            {esEnfermero && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Está viendo solo su producción personal.
                </p>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Cargando datos...</p>
              </div>
            ) : datosFiltrados.length === 0 ? (
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
                        Identificación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre Paciente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {categoriaProfesional === 'medicina' || (categoriaProfesional === 'todos' && datosFiltrados.some(d => d.tipoRegistro === 'consulta'))
                          ? 'Diagnóstico'
                          : 'Procedimiento'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Triaje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {datosFiltrados.map((item) => {
                      const fechaHora = new Date(item.fechaHora);
                      const getTriajeColor = (triaje) => {
                        const triajeUpper = triaje?.toUpperCase() || '';
                        if (triajeUpper.includes('EMERGENCIA')) return 'bg-red-100 text-red-800';
                        if (triajeUpper.includes('URGENCIA') && !triajeUpper.includes('MENOR')) return 'bg-orange-100 text-orange-800';
                        if (triajeUpper.includes('MENOR') || triajeUpper.includes('NO URGENTE')) return 'bg-green-100 text-green-800';
                        return 'bg-gray-100 text-gray-800';
                      };

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
                            {item.tipoRegistro === 'consulta' 
                              ? (item.diagnostico || 'Sin diagnóstico')
                              : (item.tipoProcedimiento || 'Sin procedimiento')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTriajeColor(item.triaje)}`}>
                              {item.triaje || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
