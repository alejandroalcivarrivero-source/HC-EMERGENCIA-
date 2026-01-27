const AtencionEmergencia = require('../models/atencionEmergencia');
const DetalleDiagnosticos = require('../models/detalleDiagnosticos');
const Paciente = require('../models/pacientes');
const Admision = require('../models/admisiones');
const Usuario = require('../models/usuario');
const fs = require('fs').promises;
const path = require('path');
const { prepararDocumentoParaToken } = require('../services/xadesService');
const tokenFirmaService = require('../services/tokenFirmaService');

// Nota: Se requiere instalar las siguientes dependencias:
// npm install pdfkit pdf-lib node-forge
// npm install --save-dev @types/node-forge (si usas TypeScript)

/**
 * Validar que una atención puede ser firmada
 * Usa el servicio de validación pre-firma que valida Anamnesis y Diagnósticos
 */
async function validarPuedeFirmar(atencionId) {
  const { validarPreFirmaFormulario008 } = require('../services/validacionPreFirmaService');
  const validacion = await validarPreFirmaFormulario008(atencionId);
  
  return {
    puedeFirmar: validacion.puedeFirmar,
    motivo: validacion.motivo,
    errores: validacion.errores
  };
}

/**
 * Generar PDF del Formulario 008
 */
async function generarPDFFormulario008(atencionId) {
  try {
    // Importar dinámicamente pdfkit solo cuando sea necesario
    const PDFDocument = require('pdfkit');
    
    const atencion = await AtencionEmergencia.findByPk(atencionId, {
      include: [
        {
          model: Paciente,
          as: 'Paciente',
          attributes: ['primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identificacion', 'fecha_nacimiento', 'sexo']
        },
        {
          model: Admision,
          as: 'AdmisionAtencion',
          attributes: ['id', 'fecha_hora_admision']
        },
        {
          model: Usuario,
          as: 'Usuario',
          attributes: ['nombres', 'apellidos', 'cedula']
        }
      ]
    });

    if (!atencion) {
      throw new Error('Atención no encontrada.');
    }

    const diagnosticos = await DetalleDiagnosticos.findAll({
      where: { atencionEmergenciaId: atencionId },
      include: [{
        model: require('../models/catCie10'),
        as: 'CIE10',
        attributes: ['codigo', 'descripcion']
      }],
      order: [['orden', 'ASC']]
    });

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {});

    // Encabezado
    doc.fontSize(16).text('FORMULARIO 008 - ATENCIÓN DE EMERGENCIA', { align: 'center' });
    doc.moveDown();

    // Datos del paciente
    doc.fontSize(12).text('DATOS DEL PACIENTE', { underline: true });
    doc.fontSize(10);
    doc.text(`Nombre: ${atencion.Paciente.primer_nombre} ${atencion.Paciente.segundo_nombre || ''} ${atencion.Paciente.primer_apellido} ${atencion.Paciente.segundo_apellido || ''}`);
    doc.text(`Identificación: ${atencion.Paciente.numero_identificacion}`);
    doc.text(`Fecha de Nacimiento: ${atencion.Paciente.fecha_nacimiento}`);
    doc.text(`Sexo: ${atencion.Paciente.sexo}`);
    doc.moveDown();

    // Datos de la atención
    doc.fontSize(12).text('DATOS DE LA ATENCIÓN', { underline: true });
    doc.fontSize(10);
    doc.text(`Fecha de Atención: ${atencion.fechaAtencion}`);
    doc.text(`Hora de Atención: ${atencion.horaAtencion}`);
    doc.text(`Condición de Llegada: ${atencion.condicionLlegada}`);
    doc.text(`Motivo de Atención: ${atencion.motivoAtencion || 'N/A'}`);
    doc.moveDown();

    // Diagnósticos
    doc.fontSize(12).text('DIAGNÓSTICOS', { underline: true });
    doc.fontSize(10);
    diagnosticos.forEach((diag, index) => {
      doc.text(`${index + 1}. CIE-10: ${diag.CIE10.codigo} - ${diag.CIE10.descripcion}`);
      doc.text(`   Tipo: ${diag.tipoDiagnostico}`);
      if (diag.descripcion) {
        doc.text(`   Descripción: ${diag.descripcion}`);
      }
      doc.moveDown(0.5);
    });

    // Enfermedad o problema actual
    if (atencion.enfermedadProblemaActual) {
      doc.fontSize(12).text('ENFERMEDAD O PROBLEMA ACTUAL', { underline: true });
      doc.fontSize(10);
      doc.text(atencion.enfermedadProblemaActual);
      doc.moveDown();
    }

    // Plan de tratamiento
    if (atencion.planTratamiento) {
      doc.fontSize(12).text('PLAN DE TRATAMIENTO', { underline: true });
      doc.fontSize(10);
      const plan = JSON.parse(atencion.planTratamiento);
      
      plan.forEach((item, index) => {
        // Compatibilidad: si es formato antiguo (sin tipo)
        if (!item.tipo || item.tipo === 'medicamento' || (item.medicamento && !item.tipo)) {
          // Formato antiguo o medicamento
          const nombre = item.nombre || item.nombreGenerico || item.medicamento || 'N/A';
          const concentracion = item.concentracion || '';
          const forma = item.formaFarmaceutica || '';
          const dosis = item.dosis || 'N/A';
          const frecuencia = item.frecuencia || item.posologia || 'N/A';
          const via = item.viaAdministracion || item.via || 'N/A';
          const duracion = item.duracion ? `${item.duracion} ${item.duracionUnidad || 'días'}` : (item.dias ? `${item.dias} días` : 'N/A');
          
          doc.text(`${index + 1}. ${nombre} ${concentracion} ${forma}`);
          doc.text(`   Dosis: ${dosis} - Frecuencia: ${frecuencia} - Vía: ${via} - Duración: ${duracion}`);
          if (item.indicaciones) {
            doc.text(`   Indicaciones: ${item.indicaciones}`);
          }
        } else if (item.tipo === 'procedimiento_lab') {
          // Procedimiento de laboratorio
          const nombreProc = item.nombreProcedimiento || item.tipoProcedimiento || 'N/A';
          doc.text(`${index + 1}. [LABORATORIO] ${nombreProc}`);
          if (item.observaciones) {
            doc.text(`   Observaciones: ${item.observaciones}`);
          }
          if (item.requiereOrden) {
            doc.text(`   ⚠ Requiere Orden de Laboratorio (Formulario 010)`);
          }
        } else if (item.tipo === 'procedimiento_imagen') {
          // Procedimiento de imagenología
          const nombreProc = item.nombreProcedimiento || item.tipoProcedimiento || 'N/A';
          doc.text(`${index + 1}. [IMAGENOLOGÍA] ${nombreProc}`);
          if (item.observaciones) {
            doc.text(`   Observaciones: ${item.observaciones}`);
          }
          if (item.requiereOrden) {
            doc.text(`   ⚠ Requiere Orden de Imagenología (Formulario 012)`);
          }
        }
        doc.moveDown(0.5);
      });
      
      // Observaciones adicionales
      if (atencion.observacionesPlanTratamiento) {
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').text('Observaciones Adicionales:', { continued: false });
        doc.font('Helvetica').text(atencion.observacionesPlanTratamiento);
      }
    }

    // Profesional responsable
    doc.moveDown();
    doc.fontSize(12).text('PROFESIONAL RESPONSABLE', { underline: true });
    doc.fontSize(10);
    doc.text(`Nombre: ${atencion.Usuario.nombres} ${atencion.Usuario.apellidos}`);
    doc.text(`Cédula: ${atencion.Usuario.cedula}`);

    // Finalizar PDF
    doc.end();

    // Esperar a que se complete la generación
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
    });
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  }
}

/**
 * Firmar PDF con certificado .p12
 */
async function firmarPDF(pdfBuffer, certificadoP12, password) {
  try {
    // Nota: Esta es una implementación básica. Para producción, se recomienda usar
    // bibliotecas más robustas como pdf-lib con node-forge o pdf-signer
    const forge = require('node-forge');
    const { PDFDocument } = require('pdf-lib');

    // Cargar el certificado P12
    const p12Asn1 = forge.asn1.fromDer(certificadoP12.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    // Obtener la clave privada y el certificado
    const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag];
    const privateKey = keyBag[0].key;

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag];
    const certificate = certBag[0].cert;

    // Cargar el PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Agregar la firma al PDF
    // Nota: pdf-lib no tiene soporte nativo para firmas digitales
    // Se requiere una biblioteca adicional como pdf-signer o implementar manualmente
    // Por ahora, retornamos el PDF sin firmar con una nota
    
    // TODO: Implementar firma digital real con pdf-signer o similar
    // const signedPdf = await signPdf(pdfDoc, privateKey, certificate);
    
    // Por ahora, retornamos el PDF original
    // En producción, implementar la firma real
    const pdfBytes = await pdfDoc.save();
    
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error al firmar PDF:', error);
    throw new Error('Error al procesar el certificado .p12 o firmar el PDF.');
  }
}

/**
 * Endpoint para preparar documento a firmar (para token USB)
 * Genera el digest XAdES y prepara la solicitud para el agente externo
 */
exports.prepararDocumentoFirma = async (req, res) => {
  try {
    const { atencionId } = req.params;
    const usuarioId = req.userId; // Del middleware validarToken

    // Validar que puede ser firmada
    const validacion = await validarPuedeFirmar(atencionId);
    if (!validacion.puedeFirmar) {
      return res.status(400).json({ 
        message: validacion.motivo || 'La atención no cumple los requisitos para ser firmada',
        errores: validacion.errores || []
      });
    }

    // Verificar que la atención existe y está pendiente
    const atencion = await AtencionEmergencia.findByPk(atencionId);
    if (!atencion) {
      return res.status(404).json({ message: 'Atención no encontrada.' });
    }

    if (atencion.estadoFirma === 'FIRMADO') {
      return res.status(400).json({ message: 'Esta atención ya ha sido firmada.' });
    }

    // Obtener datos del usuario
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Generar PDF
    const pdfBuffer = await generarPDFFormulario008(atencionId);

    // Preparar documento para firma con token
    const documentoPreparado = prepararDocumentoParaToken(pdfBuffer, atencionId, usuario);

    // Crear solicitud de firma pendiente
    const solicitudToken = tokenFirmaService.crearSolicitudFirma(documentoPreparado.documentoId, documentoPreparado);

    // Retornar datos para el agente externo
    res.json({
      solicitudToken,
      documentoPreparado: {
        documentoId: documentoPreparado.documentoId,
        digest: documentoPreparado.digest,
        digestBase64: documentoPreparado.digestBase64,
        algoritmo: documentoPreparado.algoritmo,
        metadatos: documentoPreparado.metadatos,
        protocolo: documentoPreparado.protocolo,
        callbackUrl: documentoPreparado.callbackUrl
      },
      instrucciones: {
        metodo: 'TOKEN',
        mensaje: 'Conecte su token USB y use el agente de firma para completar la firma.',
        protocolo: 'firmaec://',
        agenteRequerido: true
      }
    });
  } catch (error) {
    console.error('Error al preparar documento para firma:', error);
    res.status(500).json({ message: 'Error al preparar documento para firma.', error: error.message });
  }
};

/**
 * Endpoint callback para recibir la firma del agente externo (token USB)
 */
exports.callbackFirmaToken = async (req, res) => {
  try {
    const { atencionId } = req.params;
    const { solicitudToken, firmaBase64, certificadoInfo } = req.body;

    if (!solicitudToken || !firmaBase64) {
      return res.status(400).json({ 
        message: 'Faltan datos requeridos: solicitudToken y firmaBase64' 
      });
    }

    // Obtener solicitud
    const solicitud = tokenFirmaService.obtenerSolicitud(solicitudToken);
    if (!solicitud) {
      return res.status(404).json({ 
        message: 'Solicitud no encontrada o expirada' 
      });
    }

    // Verificar que la solicitud corresponde a esta atención
    if (solicitud.datosDocumento.atencionId !== parseInt(atencionId)) {
      return res.status(400).json({ 
        message: 'La solicitud no corresponde a esta atención' 
      });
    }

    // Completar solicitud
    tokenFirmaService.completarSolicitudFirma(solicitudToken, firmaBase64, certificadoInfo);

    // Obtener el PDF original
    const pdfBuffer = await generarPDFFormulario008(atencionId);

    // TODO: Aplicar la firma al PDF usando la firmaBase64 recibida
    // Por ahora, marcamos como firmado (en producción, aplicar firma real)
    const atencion = await AtencionEmergencia.findByPk(atencionId);
    await atencion.update({
      estadoFirma: 'FIRMADO'
    });

    // Retornar PDF firmado (en producción, aplicar firma real)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="formulario_008_${atencionId}_firmado.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error en callback de firma token:', error);
    res.status(500).json({ message: 'Error al procesar firma del token.', error: error.message });
  }
};

/**
 * Endpoint para verificar estado de solicitud de firma
 */
exports.verificarEstadoFirma = async (req, res) => {
  try {
    const { solicitudToken } = req.params;

    const solicitud = tokenFirmaService.obtenerSolicitud(solicitudToken);
    
    if (!solicitud) {
      return res.status(404).json({ 
        message: 'Solicitud no encontrada o expirada',
        estado: 'NO_ENCONTRADA'
      });
    }

    res.json({
      estado: solicitud.estado,
      fechaCreacion: solicitud.fechaCreacion,
      fechaExpiracion: solicitud.fechaExpiracion,
      completada: solicitud.estado === 'COMPLETADA',
      tieneFirma: !!solicitud.firmaBase64
    });
  } catch (error) {
    console.error('Error al verificar estado de firma:', error);
    res.status(500).json({ message: 'Error al verificar estado.', error: error.message });
  }
};

/**
 * Endpoint para firmar una atención (método ARCHIVO .p12)
 */
exports.firmarAtencion = async (req, res) => {
  try {
    const { atencionId } = req.params;
    const { password } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Debe proporcionar el archivo .p12 del certificado.' });
    }

    // Validar que puede ser firmada (incluye validación de Anamnesis y Diagnósticos)
    const validacion = await validarPuedeFirmar(atencionId);
    if (!validacion.puedeFirmar) {
      return res.status(400).json({ 
        message: validacion.motivo || 'La atención no cumple los requisitos para ser firmada',
        errores: validacion.errores || []
      });
    }

    // Verificar que la atención existe y está pendiente
    const atencion = await AtencionEmergencia.findByPk(atencionId);
    if (!atencion) {
      return res.status(404).json({ message: 'Atención no encontrada.' });
    }

    if (atencion.estadoFirma === 'FIRMADO') {
      return res.status(400).json({ message: 'Esta atención ya ha sido firmada.' });
    }

    // Leer el certificado .p12 desde el buffer
    const certificadoP12 = req.file.buffer;

    // Generar el PDF
    const pdfBuffer = await generarPDFFormulario008(atencionId);

    // Firmar el PDF
    const pdfFirmado = await firmarPDF(pdfBuffer, certificadoP12, password);

    // Guardar el PDF firmado (opcional, según requerimientos)
    // const rutaPDF = path.join(__dirname, '../uploads/formularios', `formulario_008_${atencionId}.pdf`);
    // await fs.mkdir(path.dirname(rutaPDF), { recursive: true });
    // await fs.writeFile(rutaPDF, pdfFirmado);

    // Actualizar el estado de la atención
    await atencion.update({
      estadoFirma: 'FIRMADO'
    });

    // Retornar el PDF firmado
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="formulario_008_${atencionId}_firmado.pdf"`);
    res.send(pdfFirmado);
  } catch (error) {
    console.error('Error al firmar atención:', error);
    res.status(500).json({ message: 'Error al firmar la atención.', error: error.message });
  }
};

/**
 * Obtener PDF del formulario sin firmar (vista previa)
 */
exports.getPDFPreview = async (req, res) => {
  try {
    const { atencionId } = req.params;

    const pdfBuffer = await generarPDFFormulario008(atencionId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="formulario_008_${atencionId}_preview.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF preview:', error);
    res.status(500).json({ message: 'Error al generar PDF preview.', error: error.message });
  }
};

module.exports = exports;
