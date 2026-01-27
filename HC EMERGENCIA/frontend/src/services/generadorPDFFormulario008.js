/**
 * Generador de PDF para Formulario 008 - Emergencia
 * SNS-MSP / HCU-form.008
 * Cumple con la norma técnica del MSP Ecuador
 */
import jsPDF from 'jspdf';
// Importación de jspdf-autotable (extiende jsPDF automáticamente)
import 'jspdf-autotable';

// Configuración de la institución (Centro de Salud Chone Tipo C)
const CONFIG_INSTITUCION = {
  institucion: 'SERVICIO NACIONAL DE SALUD',
  unidadOperativa: 'CENTRO DE SALUD CHONE TIPO C',
  canton: 'CHONE',
  provincia: 'MANABÍ',
  // El número de historia clínica se obtendrá del paciente
};

/**
 * Genera el PDF del Formulario 008
 * @param {object} datos - Datos completos de la atención
 * @returns {jsPDF} Documento PDF generado
 */
export function generarPDFFormulario008(datos) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Configurar fuente
  doc.setFont('helvetica');

  // Función auxiliar para dibujar línea diagonal en espacios en blanco
  const dibujarLineaDiagonal = (x, y, width, height) => {
    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200);
    doc.line(x, y, x + width, y + height);
  };

  // ============================================
  // ENCABEZADO OFICIAL
  // ============================================
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SNS-MSP / HCU-form.008 / 2008', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;

  doc.setFontSize(10);
  doc.text('FORMULARIO 008 - ATENCIÓN DE EMERGENCIA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;

  // Información de la institución
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Institución: ${CONFIG_INSTITUCION.institucion}`, margin, yPosition);
  doc.text(`Unidad Operativa: ${CONFIG_INSTITUCION.unidadOperativa}`, margin + 100, yPosition);
  yPosition += 4;

  doc.text(`Cantón: ${CONFIG_INSTITUCION.canton}`, margin, yPosition);
  doc.text(`Provincia: ${CONFIG_INSTITUCION.provincia}`, margin + 100, yPosition);
  yPosition += 4;
  
  // Número de Historia Clínica (usar ID del paciente)
  const numeroHC = datos.paciente?.id || datos.admision?.pacienteId || datos.admision?.id || 'N/A';
  doc.text(`N° Historia Clínica: ${numeroHC}`, margin, yPosition);
  
  yPosition += 6;

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // ============================================
  // BLOQUE 1: DATOS DEL PACIENTE
  // ============================================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DATOS DEL PACIENTE', margin, yPosition);
  yPosition += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  const paciente = datos.paciente || datos.admision?.Paciente || {};
  const nombreCompleto = `${paciente.primer_nombre || ''} ${paciente.segundo_nombre || ''} ${paciente.primer_apellido || ''} ${paciente.segundo_apellido || ''}`.trim();
  
  doc.text(`Nombre Completo: ${nombreCompleto || 'N/A'}`, margin, yPosition);
  doc.text(`Identificación: ${paciente.numero_identificacion || 'N/A'}`, margin + 100, yPosition);
  yPosition += 4;

  // Formatear fecha de nacimiento
  let fechaNacimiento = paciente.fecha_nacimiento || 'N/A';
  if (fechaNacimiento !== 'N/A' && fechaNacimiento) {
    try {
      const fecha = new Date(fechaNacimiento);
      fechaNacimiento = fecha.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      // Mantener el valor original si no se puede parsear
    }
  }

  doc.text(`Fecha de Nacimiento: ${fechaNacimiento}`, margin, yPosition);
  
  // Obtener sexo (puede venir como string o como objeto)
  const sexo = paciente.sexo || paciente.Sexo?.nombre || (paciente.sexo_id ? 'N/A' : 'N/A');
  doc.text(`Sexo: ${sexo}`, margin + 100, yPosition);
  yPosition += 6;

  // ============================================
  // BLOQUE 2: DATOS DE ADMISIÓN
  // ============================================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DATOS DE ADMISIÓN', margin, yPosition);
  yPosition += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  const admision = datos.admision || {};
  let fechaAdmision = 'N/A';
  if (admision.fecha_hora_admision) {
    try {
      const fecha = new Date(admision.fecha_hora_admision);
      fechaAdmision = fecha.toLocaleString('es-EC', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      fechaAdmision = admision.fecha_hora_admision;
    }
  }
  
  doc.text(`Fecha y Hora de Admisión: ${fechaAdmision}`, margin, yPosition);
  yPosition += 4;

  if (admision.formaLlegada || admision.FormaLlegada) {
    const formaLlegada = admision.formaLlegada || admision.FormaLlegada?.nombre || 'N/A';
    doc.text(`Forma de Llegada: ${formaLlegada}`, margin, yPosition);
    yPosition += 4;
  }

  yPosition += 2;

  // ============================================
  // BLOQUE 3: MOTIVO DE CONSULTA
  // ============================================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('3. MOTIVO DE CONSULTA', margin, yPosition);
  yPosition += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  const motivoConsulta = datos.motivoConsulta || datos.atencion?.motivoAtencion || 'N/A';
  doc.text(motivoConsulta, margin, yPosition, { maxWidth: contentWidth });
  yPosition += 8;

  // ============================================
  // BLOQUE 4: TRIAGE
  // ============================================
  if (datos.triaje && (datos.triaje.nombre || datos.triaje.prioridad)) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('4. TRIAGE', margin, yPosition);
    yPosition += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const triaje = datos.triaje;
    doc.text(`Nivel de Prioridad: ${triaje.nombre || triaje.prioridad || 'N/A'}`, margin, yPosition);
    yPosition += 4;
    
    if (triaje.observaciones) {
      doc.text(`Observaciones: ${triaje.observaciones}`, margin, yPosition, { maxWidth: contentWidth });
      yPosition += 6;
    } else {
      yPosition += 2;
    }
  } else {
    // Espacio en blanco marcado
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('4. TRIAGE', margin, yPosition);
    yPosition += 5;
    // Línea diagonal para espacio en blanco
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    dibujarLineaDiagonal(margin, yPosition - 2, contentWidth, 8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('(No aplica)', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 6;
  }

  // ============================================
  // BLOQUE 5: SIGNOS VITALES
  // ============================================
  // NOTA TÉCNICA: Los signos vitales se mapean automáticamente desde el header del paciente
  // (extraídos de enfermería). No requieren entrada manual del médico.
  // Campos mapeados: PA, FC, FR, Temperatura, SpO₂
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('5. SIGNOS VITALES', margin, yPosition);
  yPosition += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const signosVitales = datos.signosVitales || {};
  
  if (signosVitales.sin_constantes_vitales) {
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('Sin constantes vitales registradas', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 4;
  } else {
    // Tabla de signos vitales - Mapeo automático desde el header del paciente
    const signosData = [];
    
    // Temperatura (desde enfermería)
    if (signosVitales.temperatura != null && signosVitales.temperatura !== '') {
      const temp = parseFloat(signosVitales.temperatura);
      if (!isNaN(temp)) {
        signosData.push(['Temperatura', `${temp} °C`]);
      }
    }
    
    // Presión Arterial (desde enfermería) - viene como string "120/80"
    if (signosVitales.presion_arterial) {
      // Si viene como string "120/80", usarlo directamente
      const pa = signosVitales.presion_arterial.toString().trim();
      if (pa) {
        signosData.push(['Presión Arterial', `${pa} mmHg`]);
      }
    } else if (signosVitales.presion_arterial_sistolica && signosVitales.presion_arterial_diastolica) {
      // Compatibilidad con formato separado (si existe)
      signosData.push(['Presión Arterial', `${signosVitales.presion_arterial_sistolica}/${signosVitales.presion_arterial_diastolica} mmHg`]);
    }
    
    // Frecuencia Cardíaca (desde enfermería)
    if (signosVitales.frecuencia_cardiaca != null && signosVitales.frecuencia_cardiaca !== '') {
      const fc = parseInt(signosVitales.frecuencia_cardiaca);
      if (!isNaN(fc)) {
        signosData.push(['Frecuencia Cardíaca', `${fc} lpm`]);
      }
    }
    
    // Frecuencia Respiratoria (desde enfermería)
    if (signosVitales.frecuencia_respiratoria != null && signosVitales.frecuencia_respiratoria !== '') {
      const fr = parseInt(signosVitales.frecuencia_respiratoria);
      if (!isNaN(fr)) {
        signosData.push(['Frecuencia Respiratoria', `${fr} rpm`]);
      }
    }
    
    // Saturación de Oxígeno / SpO₂ (desde enfermería)
    if (signosVitales.saturacion_oxigeno != null && signosVitales.saturacion_oxigeno !== '') {
      const spo2 = parseFloat(signosVitales.saturacion_oxigeno);
      if (!isNaN(spo2)) {
        signosData.push(['Saturación de Oxígeno (SpO₂)', `${spo2}%`]);
      }
    }
    
    // Glicemia Capilar (opcional, desde enfermería)
    if (signosVitales.glicemia_capilar != null && signosVitales.glicemia_capilar !== '') {
      const glic = parseFloat(signosVitales.glicemia_capilar);
      if (!isNaN(glic)) {
        signosData.push(['Glicemia Capilar', `${glic} mg/dL`]);
      }
    }

    if (signosData.length > 0) {
      doc.autoTable({
        startY: yPosition,
        head: [['Signo Vital', 'Valor']],
        body: signosData,
        theme: 'grid',
        headStyles: { fontSize: 8, fontStyle: 'bold', fillColor: [240, 240, 240] },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 40 } },
        margin: { left: margin, right: margin },
        styles: { cellPadding: 2 }
      });
      yPosition = doc.lastAutoTable.finalY + 3;
    } else {
      // Espacio en blanco marcado con línea diagonal
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      dibujarLineaDiagonal(margin, yPosition - 2, contentWidth, 8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text('(No registrados)', margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 4;
    }
  } else {
    // Espacio en blanco marcado con línea diagonal
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    dibujarLineaDiagonal(margin, yPosition - 2, contentWidth, 8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('(No registrados)', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 4;
  }

  yPosition += 2;

  // ============================================
  // BLOQUE 6: EXAMEN FÍSICO
  // ============================================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('6. EXAMEN FÍSICO', margin, yPosition);
  yPosition += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const examenFisico = datos.atencion?.examenFisico 
    ? (typeof datos.atencion.examenFisico === 'string' 
        ? JSON.parse(datos.atencion.examenFisico) 
        : datos.atencion.examenFisico)
    : {};

  if (Object.keys(examenFisico).length > 0) {
    const examenesData = [];
    
    // Campos del examen físico
    const camposExamen = [
      { key: 'piel_faneras', label: 'Piel y Faneras' },
      { key: 'cabeza', label: 'Cabeza' },
      { key: 'ojos', label: 'Ojos' },
      { key: 'oidos', label: 'Oídos' },
      { key: 'nariz', label: 'Nariz' },
      { key: 'boca', label: 'Boca' },
      { key: 'orofaringe', label: 'Orofaringe' },
      { key: 'cuello', label: 'Cuello' },
      { key: 'torax', label: 'Tórax' },
      { key: 'abdomen', label: 'Abdomen' },
      { key: 'miembros_superiores', label: 'Miembros Superiores' },
      { key: 'miembros_inferiores', label: 'Miembros Inferiores' }
    ];

    camposExamen.forEach(campo => {
      if (examenFisico[campo.key] && examenFisico[campo.key].trim()) {
        examenesData.push([campo.label, examenFisico[campo.key]]);
      }
    });

    // Escala de Glasgow
    if (examenFisico.glasgow_ocular || examenFisico.glasgow_verbal || examenFisico.glasgow_motora) {
      const glasgow = `Ocular: ${examenFisico.glasgow_ocular || 'N/A'}, Verbal: ${examenFisico.glasgow_verbal || 'N/A'}, Motora: ${examenFisico.glasgow_motora || 'N/A'}`;
      examenesData.push(['Escala de Glasgow', glasgow]);
    }

    if (examenesData.length > 0) {
      doc.autoTable({
        startY: yPosition,
        head: [['Sistema', 'Hallazgos']],
        body: examenesData,
        theme: 'grid',
        headStyles: { fontSize: 8, fontStyle: 'bold', fillColor: [240, 240, 240] },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 140 } },
        margin: { left: margin, right: margin },
        styles: { cellPadding: 2 }
      });
      yPosition = doc.lastAutoTable.finalY + 3;
    } else {
      // Espacio en blanco marcado con línea diagonal
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      dibujarLineaDiagonal(margin, yPosition - 2, contentWidth, 8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text('(No registrado)', margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 4;
    }
  } else {
    // Espacio en blanco marcado con línea diagonal
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    dibujarLineaDiagonal(margin, yPosition - 2, contentWidth, 8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('(No registrado)', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 4;
  }

  yPosition += 2;

  // ============================================
  // BLOQUE 7: ANAMNESIS (ENFERMEDAD ACTUAL)
  // ============================================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('7. ANAMNESIS (ENFERMEDAD O PROBLEMA ACTUAL)', margin, yPosition);
  yPosition += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const anamnesis = datos.atencion?.enfermedadProblemaActual || 'N/A';
  if (anamnesis && anamnesis !== 'N/A') {
    const lines = doc.splitTextToSize(anamnesis, contentWidth);
    doc.text(lines, margin, yPosition);
      yPosition += (lines.length * 4);
  } else {
    // Espacio en blanco marcado con línea diagonal
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    dibujarLineaDiagonal(margin, yPosition - 2, contentWidth, 8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('(No registrado)', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 4;
  }

  yPosition += 3;

  // ============================================
  // BLOQUE 8: ANTECEDENTES PATOLÓGICOS
  // ============================================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('8. ANTECEDENTES PATOLÓGICOS', margin, yPosition);
  yPosition += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const antecedentes = datos.atencion?.antecedentesPatologicos
    ? (typeof datos.atencion.antecedentesPatologicos === 'string'
        ? JSON.parse(datos.atencion.antecedentesPatologicos)
        : datos.atencion.antecedentesPatologicos)
    : {};

  if (Object.keys(antecedentes).length > 0) {
    const antecedentesData = [];
    const tiposAntecedentes = [
      { key: 'alergicos', label: 'Alérgicos' },
      { key: 'clinicos', label: 'Clínicos' },
      { key: 'quirurgicos', label: 'Quirúrgicos' },
      { key: 'traumaticos', label: 'Traumáticos' },
      { key: 'farmacologicos', label: 'Farmacológicos' },
      { key: 'familiares', label: 'Familiares' },
      { key: 'otros', label: 'Otros' }
    ];

    tiposAntecedentes.forEach(tipo => {
      if (antecedentes[tipo.key] && antecedentes[tipo.key].trim()) {
        antecedentesData.push([tipo.label, antecedentes[tipo.key]]);
      }
    });

    if (antecedentesData.length > 0) {
      doc.autoTable({
        startY: yPosition,
        head: [['Tipo', 'Descripción']],
        body: antecedentesData,
        theme: 'grid',
        headStyles: { fontSize: 8, fontStyle: 'bold', fillColor: [240, 240, 240] },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 140 } },
        margin: { left: margin, right: margin },
        styles: { cellPadding: 2 }
      });
      yPosition = doc.lastAutoTable.finalY + 3;
    } else {
      // Espacio en blanco marcado con línea diagonal
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      dibujarLineaDiagonal(margin, yPosition - 2, contentWidth, 8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'italic');
      doc.text('(No registrados)', margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 4;
    }
  } else {
    // Espacio en blanco marcado con línea diagonal
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    dibujarLineaDiagonal(margin, yPosition - 2, contentWidth, 8);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    dibujarLineaDiagonal(margin, yPosition - 2, contentWidth, 8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('(No registrados)', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 4;
  }

  yPosition += 2;

  // ============================================
  // BLOQUE 9: EVENTO TRAUMÁTICO (si aplica)
  // ============================================
  const eventoTraumatico = datos.atencion?.tipoAccidenteViolenciaIntoxicacion
    ? (typeof datos.atencion.tipoAccidenteViolenciaIntoxicacion === 'string'
        ? JSON.parse(datos.atencion.tipoAccidenteViolenciaIntoxicacion)
        : datos.atencion.tipoAccidenteViolenciaIntoxicacion)
    : [];

  if (eventoTraumatico && eventoTraumatico.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('9. EVENTO TRAUMÁTICO', margin, yPosition);
    yPosition += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tipo: ${eventoTraumatico.join(', ')}`, margin, yPosition);
    yPosition += 4;

    if (datos.atencion?.lugarEvento) {
      doc.text(`Lugar: ${datos.atencion.lugarEvento}`, margin, yPosition);
      yPosition += 4;
    }

    if (datos.atencion?.observacionesAccidente) {
      const obsLines = doc.splitTextToSize(datos.atencion.observacionesAccidente, contentWidth);
      doc.text(obsLines, margin, yPosition);
      yPosition += (obsLines.length * 4);
    }

    yPosition += 2;
  }

  // ============================================
  // BLOQUE 10: DIAGNÓSTICOS CIE-10
  // ============================================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('10. DIAGNÓSTICOS CIE-10', margin, yPosition);
  yPosition += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const diagnosticos = datos.diagnosticos || [];
  
  if (diagnosticos.length > 0) {
    const diagnosticosData = diagnosticos.map((diag, index) => [
      index + 1,
      diag.CIE10?.codigo || diag.codigoCIE10 || 'N/A',
      diag.CIE10?.descripcion || diag.descripcion || 'N/A',
      diag.tipo_diagnostico || diag.tipoDiagnostico || 'N/A'
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['#', 'Código CIE-10', 'Descripción', 'Tipo']],
      body: diagnosticosData,
      theme: 'grid',
      headStyles: { fontSize: 8, fontStyle: 'bold', fillColor: [240, 240, 240] },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 30 },
        2: { cellWidth: 100 },
        3: { cellWidth: 50 }
      },
      margin: { left: margin, right: margin },
      styles: { cellPadding: 2 }
    });
    yPosition = doc.lastAutoTable.finalY + 3;
  } else {
    // Espacio en blanco marcado con línea diagonal
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    dibujarLineaDiagonal(margin, yPosition - 2, contentWidth, 8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('(No registrados)', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 4;
  }

  yPosition += 2;

  // ============================================
  // BLOQUE 11: PLAN DE TRATAMIENTO
  // ============================================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('11. PLAN DE TRATAMIENTO', margin, yPosition);
  yPosition += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const planTratamiento = datos.atencion?.planTratamiento
    ? (typeof datos.atencion.planTratamiento === 'string'
        ? JSON.parse(datos.atencion.planTratamiento)
        : datos.atencion.planTratamiento)
    : [];

  if (planTratamiento && planTratamiento.length > 0) {
    const prescripcionesData = [];

    planTratamiento.forEach((prescripcion, index) => {
      if (prescripcion.tipo === 'medicamento') {
        // Formato para medicamento
        const nombre = prescripcion.nombre || prescripcion.nombreGenerico || prescripcion.medicamento || 'N/A';
        const concentracion = prescripcion.concentracion || '';
        const forma = prescripcion.formaFarmaceutica || '';
        const dosis = prescripcion.dosis || 'N/A';
        const frecuencia = prescripcion.frecuencia || prescripcion.posologia || 'N/A';
        const via = prescripcion.viaAdministracion || prescripcion.via || 'N/A';
        const duracion = prescripcion.duracion 
          ? `${prescripcion.duracion} ${prescripcion.duracionUnidad || 'días'}`
          : (prescripcion.dias ? `${prescripcion.dias} días` : 'N/A');

        prescripcionesData.push([
          index + 1,
          `${nombre} ${concentracion} ${forma}`.trim(),
          dosis,
          frecuencia,
          via,
          duracion
        ]);
      } else if (prescripcion.tipo === 'procedimiento_lab') {
        // Formato para procedimiento de laboratorio
        const nombreProc = prescripcion.nombreProcedimiento || prescripcion.tipoProcedimiento || 'N/A';
        prescripcionesData.push([
          index + 1,
          `[LAB] ${nombreProc}`,
          '-',
          '-',
          '-',
          prescripcion.requiereOrden ? 'Requiere Orden 010' : '-'
        ]);
      } else if (prescripcion.tipo === 'procedimiento_imagen') {
        // Formato para procedimiento de imagenología
        const nombreProc = prescripcion.nombreProcedimiento || prescripcion.tipoProcedimiento || 'N/A';
        prescripcionesData.push([
          index + 1,
          `[IMG] ${nombreProc}`,
          '-',
          '-',
          '-',
          prescripcion.requiereOrden ? 'Requiere Orden 012' : '-'
        ]);
      } else {
        // Formato antiguo (compatibilidad)
        const nombre = prescripcion.medicamento || prescripcion.nombre || 'N/A';
        prescripcionesData.push([
          index + 1,
          nombre,
          prescripcion.dosis || '-',
          prescripcion.posologia || prescripcion.frecuencia || '-',
          prescripcion.via || prescripcion.viaAdministracion || '-',
          prescripcion.dias ? `${prescripcion.dias} días` : (prescripcion.duracion || '-')
        ]);
      }
    });

    doc.autoTable({
      startY: yPosition,
      head: [['#', 'Medicamento/Procedimiento', 'Dosis', 'Frecuencia', 'Vía', 'Duración']],
      body: prescripcionesData,
      theme: 'grid',
      headStyles: { fontSize: 8, fontStyle: 'bold', fillColor: [240, 240, 240] },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 60 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 35 }
      },
      margin: { left: margin, right: margin },
      styles: { cellPadding: 2 }
    });
    yPosition = doc.lastAutoTable.finalY + 3;

    // Observaciones adicionales
    if (datos.atencion?.observacionesPlanTratamiento) {
      yPosition += 2;
      doc.setFont('helvetica', 'bold');
      doc.text('Observaciones:', margin, yPosition);
      yPosition += 4;
      doc.setFont('helvetica', 'normal');
      const obsLines = doc.splitTextToSize(datos.atencion.observacionesPlanTratamiento, contentWidth);
      doc.text(obsLines, margin, yPosition);
      yPosition += (obsLines.length * 4);
    }
  } else {
    // Espacio en blanco marcado con línea diagonal
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    dibujarLineaDiagonal(margin, yPosition - 2, contentWidth, 8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('(No registrado)', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 4;
  }

  yPosition += 3;

  // Verificar si necesitamos nueva página para la firma
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = margin;
  }

  // ============================================
  // BLOQUE 12: FIRMA ELECTRÓNICA
  // ============================================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FIRMA DEL PROFESIONAL RESPONSABLE', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const medico = datos.medico || datos.atencion?.Usuario || datos.atencion?.usuario || {};
  const nombreMedico = `${medico.nombres || 'Andrés Alejandro'} ${medico.apellidos || 'Alcívar Rivero'}`.trim();
  const cedulaMedico = medico.cedula || medico.numero_identificacion || 'N/A';

  doc.text(`Nombre: ${nombreMedico}`, margin, yPosition);
  yPosition += 4;
  doc.text(`Cédula: ${cedulaMedico}`, margin, yPosition);
  yPosition += 6;

  // Espacio para firma electrónica / QR
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  doc.rect(margin, yPosition, 60, 20);
  
  if (datos.atencion?.estadoFirma === 'FIRMADO') {
    // Si está firmado, mostrar indicador
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 128, 0);
    doc.text('✓ FIRMADO ELECTRÓNICAMENTE', margin + 65, yPosition + 10);
    const fechaFirma = datos.atencion.fechaFirma 
      ? new Date(datos.atencion.fechaFirma).toLocaleDateString('es-EC')
      : new Date().toLocaleDateString('es-EC');
    doc.text(`Fecha: ${fechaFirma}`, margin + 65, yPosition + 16);
    doc.setTextColor(0, 0, 0);
  } else {
    // Si no está firmado, línea diagonal y texto
    dibujarLineaDiagonal(margin, yPosition, 60, 20);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Firma Electrónica / Código QR', margin + 2, yPosition + 12);
    doc.setTextColor(0, 0, 0);
  }

  yPosition += 25;

  // ============================================
  // PIE DE PÁGINA
  // ============================================
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('SNS-MSP / HCU-form.008 / 2008', pageWidth / 2, pageHeight - 5, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  return doc;
}

/**
 * Genera y descarga el PDF del Formulario 008
 * @param {object} datos - Datos completos de la atención
 * @param {string} nombreArchivo - Nombre del archivo (opcional)
 */
export function descargarPDFFormulario008(datos, nombreArchivo = null) {
  const doc = generarPDFFormulario008(datos);
  const nombre = nombreArchivo || `Formulario_008_${datos.paciente?.numero_identificacion || 'N/A'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nombre);
}

/**
 * Genera y abre el PDF en una nueva ventana para impresión
 * @param {object} datos - Datos completos de la atención
 */
export function imprimirPDFFormulario008(datos) {
  const doc = generarPDFFormulario008(datos);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const ventana = window.open(pdfUrl, '_blank');
  
  if (ventana) {
    ventana.onload = () => {
      ventana.print();
    };
  }
}
