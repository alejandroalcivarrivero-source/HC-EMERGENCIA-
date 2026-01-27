const { Op } = require('sequelize');
const sequelize = require('../config/database');
const ProcedimientoEmergencia = require('../models/procedimientoEmergencia');
const Paciente = require('../models/pacientes');
const Usuario = require('../models/usuario');
const Admision = require('../models/admisiones');
const CatTriaje = require('../models/cat_triaje');
const DatosAdicionalesPaciente = require('../models/datos_adicionales_paciente');
const Sexo = require('../models/cat_sexos');
const AutoidentificacionEtnica = require('../models/cat_autoidentificacion_etnica');
const SeguroSalud = require('../models/cat_seguros_salud');
const TieneDiscapacidad = require('../models/cat_tiene_discapacidad');

const procedimientosPermitidos = [
  'Inyección Intravenosa',
  'Inyección Dérmica',
  'Inyección Subcutánea',
  'Inyección Intramuscular',
  'Hidratación',
  'Curaciones',
  'Sutura',
  'Retiro de Puntos',
  'Nebulización',
  'Canalización',
  'Glicemia',
  'Medicación Vía Oral',
  'Medio Físico',
  'Medicación Intrarrectal',
  'Involución Uterina',
  'Drenaje de Acceso',
  'Colocación de Sonda',
  'Oxígeno',
  'Retiro de Cuerpo Extraño',
  'Colocación de Sonda Vesical',
  'Vacunación',
  'Pruebas Rápidas',
  'Medicación Inhalatoria',
  'Medicina Intravaginal',
  'Toma de Signos Vitales' // Añadido para permitir el registro automático
];

exports.createProcedimientoEmergencia = async (req, res) => {
  const { pacienteId, admisionId, nombreProcedimiento, horaRealizacion, observacion } = req.body;
  const usuarioId = req.userId; // El ID del usuario se adjunta a req.userId en el middleware validarToken

  console.log('Datos recibidos para crear procedimiento:', { pacienteId, admisionId, nombreProcedimiento, horaRealizacion, observacion, usuarioId });

  try {
    // Verificar si el paciente existe
    const paciente = await Paciente.findByPk(pacienteId);
    if (!paciente) {
      console.log('Paciente no encontrado:', pacienteId);
      return res.status(404).json({ message: 'Paciente no encontrado.' });
    }

    // Verificar si el paciente ha sido admitido
    let admision;
    if (admisionId) {
      admision = await Admision.findByPk(admisionId);
      console.log('Admisión encontrada por ID:', admision ? admision.toJSON() : 'No encontrada');
      if (!admision || admision.pacienteId !== pacienteId) {
        console.log('ID de admisión no válido para este paciente. AdmisionId:', admisionId, 'PacienteId:', pacienteId, 'Admision.pacienteId:', admision ? admision.pacienteId : 'N/A');
        return res.status(400).json({ message: 'ID de admisión no válido para este paciente.' });
      }
    } else {
      // Si no se proporciona admisionId, buscar la admisión activa del paciente
      admision = await Admision.findOne({
        where: { pacienteId: pacienteId, fecha_hora_retiro: null, fecha_hora_fallecimiento: null }
      });
      console.log('Admisión activa encontrada (sin admisionId proporcionado):', admision ? admision.toJSON() : 'No encontrada');
    }

    if (admision && admision.estado_paciente === 'FALLECIDO') {
      console.log('Intento de registrar procedimiento para paciente fallecido. Admision ID:', admision.id);
      return res.status(400).json({ message: 'No se pueden registrar procedimientos para un paciente fallecido.' });
    }

    if (!admision) {
      console.log('Paciente sin admisión activa para registrar procedimientos. Paciente ID:', pacienteId);
      return res.status(400).json({ message: 'El paciente debe tener una admisión activa para registrar procedimientos.' });
    }

    // Validar que el nombre del procedimiento sea uno de los permitidos
    if (!procedimientosPermitidos.includes(nombreProcedimiento)) {
      console.log('Nombre de procedimiento no válido:', nombreProcedimiento);
      return res.status(400).json({ message: 'Nombre de procedimiento no válido.' });
    }

    const procedimiento = await ProcedimientoEmergencia.create({
      pacienteId,
      admisionId: admision.id, // Usar el ID de la admisión encontrada o proporcionada
      usuarioId,
      nombreProcedimiento,
      horaRealizacion,
      observacion
    });
    console.log('Procedimiento creado exitosamente:', procedimiento.toJSON());

    // Actualizar fecha_ultima_actividad en la admisión
    await admision.update({ fecha_ultima_actividad: new Date() });
    console.log(`Fecha de última actividad para admisión ${admision.id} actualizada.`);




    res.status(201).json(procedimiento);
  } catch (error) {
    console.error('Error al crear el procedimiento de emergencia:', error);
    res.status(500).json({ message: 'Error al crear el procedimiento de emergencia.' });
  }
};

exports.getProcedimientosByPaciente = async (req, res) => {
  const { pacienteId } = req.params;
  const { admisionId, historial } = req.query; // Permitir filtrar por admisionId y un nuevo parámetro 'historial'

  try {
    console.log('Parámetros recibidos en getProcedimientosByPaciente:', { pacienteId, admisionId, historial });
    let whereClause = { pacienteId };

    // Si 'historial' está presente en la query (incluso si es una cadena vacía o 'undefined' como string),
    // se asume que se quiere el historial completo y no se aplica el filtro de 24 horas.
    // Si 'historial' no está presente, se aplica el filtro de 24 horas.
    if (!historial) { // Si historial no está presente en la query
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      whereClause.horaRealizacion = {
        [Op.gte]: twentyFourHoursAgo
      };
    }

    // Si admisionId está presente, siempre se aplica el filtro por admisionId.
    if (admisionId) {
      whereClause.admisionId = admisionId;
    }

    const procedimientos = await ProcedimientoEmergencia.findAll({
      where: whereClause,
      order: [['horaRealizacion', 'DESC']], // Ordenar por fecha de realización descendente
      include: [
        { model: Paciente, as: 'Paciente', attributes: ['primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identificacion'] },
        { model: Admision, as: 'AdmisionParaProcedimiento', attributes: ['id', 'fecha_hora_admision'] }, // Incluir datos de la admisión y su alias
        { model: Usuario, as: 'UsuarioProcedimiento', attributes: ['nombres', 'apellidos'] } // Incluir datos del usuario que registró el procedimiento
      ]
    });
    console.log('Procedimientos encontrados:', procedimientos.map(p => p.toJSON()));
    res.status(200).json(procedimientos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los procedimientos del paciente.' });
  }
};

exports.updateProcedimientoEmergencia = async (req, res) => {
  const { id } = req.params;
  const { nombreProcedimiento, horaRealizacion, observacion } = req.body;

  try {
    const procedimiento = await ProcedimientoEmergencia.findByPk(id);
    if (!procedimiento) {
      return res.status(404).json({ message: 'Procedimiento no encontrado.' });
    }

    // Validar que el nombre del procedimiento sea uno de los permitidos si se intenta actualizar
    if (nombreProcedimiento && !procedimientosPermitidos.includes(nombreProcedimiento)) {
      return res.status(400).json({ message: 'Nombre de procedimiento no válido.' });
    }

    procedimiento.nombreProcedimiento = nombreProcedimiento || procedimiento.nombreProcedimiento;
    procedimiento.horaRealizacion = horaRealizacion || procedimiento.horaRealizacion;
    procedimiento.observacion = observacion !== undefined ? observacion : procedimiento.observacion;

    await procedimiento.save();

    // Actualizar fecha_ultima_actividad en la admisión
    const admision = await Admision.findByPk(procedimiento.admisionId);
    if (admision) {
      await admision.update({ fecha_ultima_actividad: new Date() });
      console.log(`Fecha de última actividad para admisión ${procedimiento.admisionId} actualizada.`);
    }

    res.status(200).json(procedimiento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el procedimiento de emergencia.' });
  }
};

exports.deleteProcedimientoEmergencia = async (req, res) => {
  const { id } = req.params;

  try {
    const procedimiento = await ProcedimientoEmergencia.findByPk(id);
    if (!procedimiento) {
      return res.status(404).json({ message: 'Procedimiento no encontrado.' });
    }

    await procedimiento.destroy();
    res.status(204).json({ message: 'Procedimiento eliminado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el procedimiento de emergencia.' });
  }
};

// Reporte de Producción con Control de Acceso (RBAC) - Unificado para Enfermería y Medicina
exports.getReporteProduccion = async (req, res) => {
  try {
    const usuarioId = req.userId;
    const rolId = req.rolId;
    const { fechaInicio, fechaFin, usuarioIdFiltro, tipoFiltro, categoriaProfesional } = req.query;

    // Validación de seguridad según rol
    let whereClause = {};
    if (rolId === 3) { // Rol de Enfermero
      whereClause.usuarioId = usuarioId;
    } else if (rolId === 5) { // Rol de Administrador
      if (usuarioIdFiltro && usuarioIdFiltro !== 'todos') {
        whereClause.usuarioId = parseInt(usuarioIdFiltro);
      }
    } else if (rolId === 1 || rolId === 2) { // Médico u Obstetriz
      whereClause.usuarioId = usuarioId;
    } else {
      return res.status(403).json({ message: 'Acceso denegado. Solo personal médico y administrativo pueden acceder a este reporte.' });
    }

    // Aplicar filtros de fecha
    if (fechaInicio && fechaFin) {
      whereClause.horaRealizacion = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
      };
    } else if (tipoFiltro) {
      const ahora = new Date();
      let fechaInicioFiltro, fechaFinFiltro;

      switch (tipoFiltro) {
        case 'dia':
          fechaInicioFiltro = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
          fechaFinFiltro = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
          break;
        case 'semana':
          const inicioSemana = new Date(ahora);
          inicioSemana.setDate(ahora.getDate() - ahora.getDay());
          inicioSemana.setHours(0, 0, 0, 0);
          fechaInicioFiltro = inicioSemana;
          fechaFinFiltro = new Date(inicioSemana);
          fechaFinFiltro.setDate(inicioSemana.getDate() + 6);
          fechaFinFiltro.setHours(23, 59, 59, 999);
          break;
        case 'mes':
          fechaInicioFiltro = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
          fechaInicioFiltro.setHours(0, 0, 0, 0);
          fechaFinFiltro = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
          fechaFinFiltro.setHours(23, 59, 59, 999);
          break;
        default:
          break;
      }

      if (fechaInicioFiltro && fechaFinFiltro) {
        whereClause.horaRealizacion = {
          [Op.between]: [fechaInicioFiltro, fechaFinFiltro]
        };
      }
    }

    // Determinar qué datos obtener según categoría profesional (solo para admin)
    const reporteData = [];
    
    // Si es admin y selecciona categoría específica, filtrar por rol
    let rolesFiltro = [];
    if (rolId === 5 && categoriaProfesional) {
      if (categoriaProfesional === 'medicina') {
        rolesFiltro = [1, 2]; // Médico y Obstetriz
      } else if (categoriaProfesional === 'enfermeria') {
        rolesFiltro = [3]; // Enfermería
      }
    }

    // Obtener procedimientos (si aplica)
    if (!categoriaProfesional || categoriaProfesional === 'enfermeria' || categoriaProfesional === 'todos') {
      const procedimientos = await ProcedimientoEmergencia.findAll({
        where: whereClause,
        order: [['horaRealizacion', 'DESC']],
        include: [
          {
            model: Paciente,
            as: 'ProcedimientoPaciente',
            attributes: ['id', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identificacion', 'fecha_nacimiento'],
            include: [
              {
                model: Sexo,
                as: 'Sexo',
                attributes: ['nombre'],
                required: false
              },
              {
                model: DatosAdicionalesPaciente,
                as: 'DatosAdicionalesPaciente',
                attributes: ['autoidentificacionEtnicaId', 'seguroSaludId', 'tieneDiscapacidadId'],
                required: false,
                include: [
                  {
                    model: AutoidentificacionEtnica,
                    as: 'AutoidentificacionEtnica',
                    attributes: ['nombre'],
                    required: false
                  },
                  {
                    model: SeguroSalud,
                    as: 'SeguroSalud',
                    attributes: ['nombre'],
                    required: false
                  },
                  {
                    model: TieneDiscapacidad,
                    as: 'TieneDiscapacidadPaciente',
                    attributes: ['nombre'],
                    required: false
                  }
                ]
              }
            ]
          },
          {
            model: Usuario,
            as: 'UsuarioProcedimiento',
            attributes: ['id', 'nombres', 'apellidos', 'cedula', 'rol_id'],
            required: false
          },
          {
            model: Admision,
            as: 'AdmisionParaProcedimiento',
            attributes: ['id', 'triajeDefinitivoId', 'triajePreliminarId'],
            include: [
              {
                model: CatTriaje,
                as: 'TriajeDefinitivo',
                attributes: ['nombre', 'color'],
                required: false
              },
              {
                model: CatTriaje,
                as: 'TriajePreliminar',
                attributes: ['nombre', 'color'],
                required: false
              }
            ]
          }
        ]
      });

      // Filtrar por rol si es necesario
      let procedimientosFiltrados = procedimientos;
      if (rolesFiltro.length > 0) {
        procedimientosFiltrados = procedimientos.filter(p => {
          const usuario = p.UsuarioProcedimiento;
          return usuario && rolesFiltro.includes(usuario.rol_id);
        });
      }

      // Formatear procedimientos
      const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return null;
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
          edad--;
        }
        return edad;
      };

      const categorizarEdad = (edad) => {
        if (edad === null || edad === undefined) return null;
        if (edad < 1) return 'Menores de 1 año';
        if (edad >= 1 && edad <= 4) return '1-4 años';
        if (edad >= 5 && edad <= 9) return '5-9 años';
        if (edad >= 10 && edad <= 14) return '10-14 años';
        if (edad >= 15 && edad <= 19) return '15-19 años';
        if (edad >= 20 && edad <= 64) return '20-64 años';
        if (edad >= 65) return '65 años y más';
        return 'Sin clasificar';
      };

      procedimientosFiltrados.forEach(proc => {
        const paciente = proc.ProcedimientoPaciente;
        const usuario = proc.UsuarioProcedimiento;
        const admision = proc.AdmisionParaProcedimiento;
        const datosAdicionales = paciente?.DatosAdicionalesPaciente;
        
        const triaje = admision?.TriajeDefinitivo || admision?.TriajePreliminar;
        const nombreTriaje = triaje ? triaje.nombre : 'No asignado';
        
        const edad = calcularEdad(paciente?.fecha_nacimiento);
        const categoriaEdad = categorizarEdad(edad);
        
        reporteData.push({
          id: proc.id,
          tipoRegistro: 'procedimiento',
          categoriaProfesional: usuario?.rol_id === 3 ? 'Enfermería' : 'Medicina',
          rolProfesional: usuario?.rol_id === 1 ? 'Médico' : usuario?.rol_id === 2 ? 'Obstetriz' : usuario?.rol_id === 3 ? 'Enfermería' : 'N/A',
          fechaHora: proc.horaRealizacion,
          nombreProfesional: usuario ? `${usuario.nombres} ${usuario.apellidos}` : 'N/A',
          identificacionPaciente: paciente?.numero_identificacion || 'N/A',
          nombrePaciente: paciente ? `${paciente.primer_nombre || ''} ${paciente.segundo_nombre || ''} ${paciente.primer_apellido || ''} ${paciente.segundo_apellido || ''}`.trim() : 'N/A',
          primerNombre: paciente?.primer_nombre || '',
          segundoNombre: paciente?.segundo_nombre || '',
          primerApellido: paciente?.primer_apellido || '',
          segundoApellido: paciente?.segundo_apellido || '',
          fechaNacimiento: paciente?.fecha_nacimiento || null,
          edad: edad,
          categoriaEdad: categoriaEdad,
          sexo: paciente?.Sexo?.nombre || 'N/A',
          etnia: datosAdicionales?.AutoidentificacionEtnica?.nombre || 'No especificado',
          seguro: datosAdicionales?.SeguroSalud?.nombre || 'Sin seguro',
          discapacidad: datosAdicionales?.TieneDiscapacidadPaciente?.nombre || 'No',
          tipoProcedimiento: proc.nombreProcedimiento,
          diagnostico: null, // No aplica para procedimientos
          triaje: nombreTriaje,
          observacion: proc.observacion
        });
      });
    }

    // Obtener atenciones médicas (si aplica)
    if (!categoriaProfesional || categoriaProfesional === 'medicina' || categoriaProfesional === 'todos') {
      const AtencionEmergencia = require('../models/atencionEmergencia');
      
      // Ajustar whereClause para atenciones (usar fechaAtencion y horaAtencion)
      let whereAtencion = {};
      if (whereClause.usuarioId) {
        whereAtencion.usuarioId = whereClause.usuarioId;
      }
      
      // Construir filtro de fecha para atenciones
      if (fechaInicio && fechaFin) {
        const fechaInicioObj = new Date(fechaInicio);
        const fechaFinObj = new Date(fechaFin);
        fechaFinObj.setHours(23, 59, 59, 999);
        
        whereAtencion.fechaAtencion = {
          [Op.between]: [fechaInicioObj.toISOString().split('T')[0], fechaFinObj.toISOString().split('T')[0]]
        };
      } else if (tipoFiltro) {
        const ahora = new Date();
        let fechaInicioFiltro, fechaFinFiltro;

        switch (tipoFiltro) {
          case 'dia':
            fechaInicioFiltro = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
            fechaFinFiltro = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
            break;
          case 'semana':
            const inicioSemana = new Date(ahora);
            inicioSemana.setDate(ahora.getDate() - ahora.getDay());
            fechaInicioFiltro = inicioSemana;
            fechaFinFiltro = new Date(inicioSemana);
            fechaFinFiltro.setDate(inicioSemana.getDate() + 6);
            break;
          case 'mes':
            fechaInicioFiltro = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            fechaFinFiltro = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
            break;
          default:
            break;
        }

        if (fechaInicioFiltro && fechaFinFiltro) {
          whereAtencion.fechaAtencion = {
            [Op.between]: [fechaInicioFiltro.toISOString().split('T')[0], fechaFinFiltro.toISOString().split('T')[0]]
          };
        }
      }

      const atenciones = await AtencionEmergencia.findAll({
        where: whereAtencion,
        order: [['fechaAtencion', 'DESC'], [sequelize.literal('horaAtencion'), 'DESC']],
        include: [
          {
            model: Paciente,
            as: 'Paciente',
            attributes: ['id', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identificacion', 'fecha_nacimiento'],
            include: [
              {
                model: Sexo,
                as: 'Sexo',
                attributes: ['nombre'],
                required: false
              },
              {
                model: DatosAdicionalesPaciente,
                as: 'DatosAdicionalesPaciente',
                attributes: ['autoidentificacionEtnicaId', 'seguroSaludId', 'tieneDiscapacidadId'],
                required: false,
                include: [
                  {
                    model: AutoidentificacionEtnica,
                    as: 'AutoidentificacionEtnica',
                    attributes: ['nombre'],
                    required: false
                  },
                  {
                    model: SeguroSalud,
                    as: 'SeguroSalud',
                    attributes: ['nombre'],
                    required: false
                  },
                  {
                    model: TieneDiscapacidad,
                    as: 'TieneDiscapacidadPaciente',
                    attributes: ['nombre'],
                    required: false
                  }
                ]
              }
            ]
          },
          {
            model: Usuario,
            as: 'Usuario',
            attributes: ['id', 'nombres', 'apellidos', 'cedula', 'rol_id'],
            required: false
          },
          {
            model: Admision,
            as: 'AdmisionAtencion',
            attributes: ['id', 'triajeDefinitivoId', 'triajePreliminarId'],
            include: [
              {
                model: CatTriaje,
                as: 'TriajeDefinitivo',
                attributes: ['nombre', 'color'],
                required: false
              },
              {
                model: CatTriaje,
                as: 'TriajePreliminar',
                attributes: ['nombre', 'color'],
                required: false
              }
            ]
          }
        ]
      });

      // Filtrar por rol si es necesario
      let atencionesFiltradas = atenciones;
      if (rolesFiltro.length > 0) {
        atencionesFiltradas = atenciones.filter(a => {
          const usuario = a.Usuario;
          return usuario && rolesFiltro.includes(usuario.rol_id);
        });
      }

      // Formatear atenciones
      const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return null;
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
          edad--;
        }
        return edad;
      };

      const categorizarEdad = (edad) => {
        if (edad === null || edad === undefined) return null;
        if (edad < 1) return 'Menores de 1 año';
        if (edad >= 1 && edad <= 4) return '1-4 años';
        if (edad >= 5 && edad <= 9) return '5-9 años';
        if (edad >= 10 && edad <= 14) return '10-14 años';
        if (edad >= 15 && edad <= 19) return '15-19 años';
        if (edad >= 20 && edad <= 64) return '20-64 años';
        if (edad >= 65) return '65 años y más';
        return 'Sin clasificar';
      };

      atencionesFiltradas.forEach(atencion => {
        const paciente = atencion.Paciente;
        const usuario = atencion.Usuario;
        const admision = atencion.AdmisionAtencion;
        const datosAdicionales = paciente?.DatosAdicionalesPaciente;
        
        const triaje = admision?.TriajeDefinitivo || admision?.TriajePreliminar;
        const nombreTriaje = triaje ? triaje.nombre : 'No asignado';
        
        const edad = calcularEdad(paciente?.fecha_nacimiento);
        const categoriaEdad = categorizarEdad(edad);
        
        // Extraer diagnósticos definitivos
        let diagnosticos = 'Sin diagnóstico';
        try {
          if (atencion.diagnosticosDefinitivos) {
            const diagArray = JSON.parse(atencion.diagnosticosDefinitivos);
            if (Array.isArray(diagArray) && diagArray.length > 0) {
              diagnosticos = diagArray.map(d => d.descripcion || d.cie || '').filter(Boolean).join(', ');
            }
          }
        } catch (e) {
          console.error('Error al parsear diagnósticos:', e);
        }
        
        // Crear fecha/hora combinada
        const fechaHoraCompleta = new Date(`${atencion.fechaAtencion}T${atencion.horaAtencion}:00`);
        
        reporteData.push({
          id: atencion.id,
          tipoRegistro: 'consulta',
          categoriaProfesional: usuario?.rol_id === 1 ? 'Medicina' : usuario?.rol_id === 2 ? 'Medicina' : 'Enfermería',
          rolProfesional: usuario?.rol_id === 1 ? 'Médico' : usuario?.rol_id === 2 ? 'Obstetriz' : usuario?.rol_id === 3 ? 'Enfermería' : 'N/A',
          fechaHora: fechaHoraCompleta,
          nombreProfesional: usuario ? `${usuario.nombres} ${usuario.apellidos}` : 'N/A',
          identificacionPaciente: paciente?.numero_identificacion || 'N/A',
          nombrePaciente: paciente ? `${paciente.primer_nombre || ''} ${paciente.segundo_nombre || ''} ${paciente.primer_apellido || ''} ${paciente.segundo_apellido || ''}`.trim() : 'N/A',
          primerNombre: paciente?.primer_nombre || '',
          segundoNombre: paciente?.segundo_nombre || '',
          primerApellido: paciente?.primer_apellido || '',
          segundoApellido: paciente?.segundo_apellido || '',
          fechaNacimiento: paciente?.fecha_nacimiento || null,
          edad: edad,
          categoriaEdad: categoriaEdad,
          sexo: paciente?.Sexo?.nombre || 'N/A',
          etnia: datosAdicionales?.AutoidentificacionEtnica?.nombre || 'No especificado',
          seguro: datosAdicionales?.SeguroSalud?.nombre || 'Sin seguro',
          discapacidad: datosAdicionales?.TieneDiscapacidadPaciente?.nombre || 'No',
          tipoProcedimiento: null, // No aplica para consultas
          diagnostico: diagnosticos,
          triaje: nombreTriaje,
          observacion: atencion.motivoAtencion || ''
        });
      });
    }

    // Ordenar todos los datos por fecha descendente
    reporteData.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));

    res.status(200).json(reporteData);
  } catch (error) {
    console.error('Error al obtener reporte de producción:', error);
    res.status(500).json({ message: 'Error al obtener el reporte de producción.' });
  }
};