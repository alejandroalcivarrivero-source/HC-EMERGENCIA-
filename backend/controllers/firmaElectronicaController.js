const AtencionEmergencia = require('../models/atencionEmergencia');
const DetalleDiagnosticos = require('../models/detalleDiagnosticos');
const CertificadoFirma = require('../models/certificadoFirma');
const Paciente = require('../models/pacientes');
const Admision = require('../models/admisiones');
const Usuario = require('../models/usuario');
const { encrypt, decrypt } = require('../utils/cryptoFirma');
const { extraerMetadatos, abrirP12ParaFirma } = require('../utils/p12Metadatos');
const { contenidoAFirmarForm008, firmarConClavePrivada, crearSelloDigital } = require('../utils/selloDigital');

/**
 * Validar que una atención puede ser firmada
 * Debe tener al menos un diagnóstico DEFINITIVO (excepto códigos Z)
 */
async function validarPuedeFirmar(atencionId) {
  const diagnosticos = await DetalleDiagnosticos.findAll({
    where: { atencionEmergenciaId: atencionId }
  });

  if (diagnosticos.length === 0) {
    return { puedeFirmar: false, motivo: 'No hay diagnósticos registrados.' };
  }

  // Verificar si hay al menos un diagnóstico DEFINITIVO o código Z con NO APLICA
  const tieneDefinitivo = diagnosticos.some(d => {
    const esCodigoZ = d.codigoCIE10.toUpperCase().startsWith('Z');
    return d.tipoDiagnostico === 'DEFINITIVO' || (esCodigoZ && d.tipoDiagnostico === 'NO APLICA');
  });

  if (!tieneDefinitivo) {
    return { puedeFirmar: false, motivo: 'Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z).' };
  }

  // Previsión 094: si hay violencia en Sección D, Observaciones obligatorias (mín. 100 caracteres)
  const atencion = await AtencionEmergencia.findByPk(atencionId, {
    attributes: ['tipoAccidenteViolenciaIntoxicacion', 'observacionesAccidente']
  });
  if (atencion && atencion.tipoAccidenteViolenciaIntoxicacion) {
    let tipoD;
    try {
      tipoD = typeof atencion.tipoAccidenteViolenciaIntoxicacion === 'string'
        ? JSON.parse(atencion.tipoAccidenteViolenciaIntoxicacion)
        : atencion.tipoAccidenteViolenciaIntoxicacion;
    } catch {
      tipoD = { seleccion: [] };
    }
    const sel = Array.isArray(tipoD?.seleccion) ? tipoD.seleccion : [];
    const hayViolencia = sel.some(v => {
      const s = String(v || '').toUpperCase();
      return s.startsWith('VIOLENCIA_') || s.includes('VIOLENCIA');
    });
    if (hayViolencia && (atencion.observacionesAccidente || '').trim().length < 100) {
      return {
        puedeFirmar: false,
        motivo: 'Por tratarse de violencia, las Observaciones de la Sección D (Accidente, Violencia, Intoxicación) deben tener al menos 100 caracteres para cumplir el relato pericial (Previsión 094).'
      };
    }
  }

  return { puedeFirmar: true };
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

    // Marca de agua "BORRADOR NO VÁLIDO" cuando el estado es BORRADOR (seguridad jurídica)
    const estadoFirma = atencion.estadoFirma || atencion.estado_firma;
    if (estadoFirma === 'BORRADOR') {
      doc.save();
      doc.opacity(0.28);
      doc.fillColor('red');
      doc.fontSize(42);
      const cx = doc.page.width / 2;
      const cy = doc.page.height / 2;
      doc.translate(cx, cy);
      doc.rotate(-35, { origin: [0, 0] });
      doc.text('BORRADOR NO VÁLIDO', -200, -14, { width: 400, align: 'center' });
      doc.restore();
      doc.opacity(1);
      doc.fillColor('black');
    }

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

    // Diagnósticos — Filtro Formulario 008: solo morbilidad, máx. 3 Presuntivos (L) y 3 Definitivos (M).
    // Excluir: códigos Z (NO APLICA), causas externas (V–Y) y códigos con padre_id.
    const esCodigoZPdf = (cod) => String(cod || '').toUpperCase().startsWith('Z');
    const esCausaExternaPdf = (d) => /^[VWXY]/.test(String(d.codigoCIE10 || '').toUpperCase()) || d.padreId != null;
    const morbilidad = diagnosticos.filter(d => !esCodigoZPdf(d.codigoCIE10) && !esCausaExternaPdf(d));
    const presuntivosPdf = morbilidad.filter(d => d.tipoDiagnostico === 'PRESUNTIVO').slice(0, 3);
    const definitivosPdf = morbilidad.filter(d => d.tipoDiagnostico === 'DEFINITIVO').slice(0, 3);
    const diagnosticosParaPdf = [...presuntivosPdf, ...definitivosPdf];

    doc.fontSize(12).text('DIAGNÓSTICOS', { underline: true });
    doc.fontSize(10);
    diagnosticosParaPdf.forEach((diag, index) => {
      const cod = diag.CIE10?.codigo || diag.codigoCIE10 || '';
      const desc = diag.CIE10?.descripcion || diag.descripcion || '';
      doc.text(`${index + 1}. CIE-10: ${cod} - ${desc}`);
      doc.text(`   Condición: ${diag.tipoDiagnostico}`);
      if (diag.descripcion && diag.descripcion !== desc) {
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
        doc.text(`${index + 1}. ${item.medicamento || 'N/A'}`);
        doc.text(`   Vía: ${item.via || 'N/A'}, Dosis: ${item.dosis || 'N/A'}, Posología: ${item.posologia || 'N/A'}, Días: ${item.dias || 'N/A'}`);
        doc.moveDown(0.5);
      });
    }

    // Profesional responsable
    doc.moveDown();
    doc.fontSize(12).text('PROFESIONAL RESPONSABLE', { underline: true });
    doc.fontSize(10);
    doc.text(`Nombre: ${atencion.Usuario.nombres} ${atencion.Usuario.apellidos}`);
    doc.text(`Cédula: ${atencion.Usuario.cedula}`);

    // Firma electrónica / Sello digital (formato legal MSP) — solo si ya fue firmado (FINALIZADO_FIRMADO)
    const selloRaw = atencion.selloDigital || atencion.sello_digital;
    if (selloRaw) {
      try {
        const sello = typeof selloRaw === 'string' ? JSON.parse(selloRaw) : selloRaw;
        doc.moveDown();
        doc.fontSize(12).text('FIRMA ELECTRÓNICA / SELLO DIGITAL (MSP)', { underline: true });
        doc.fontSize(10);
        doc.text(`Titular del certificado: ${sello.nombre || '—'}`);
        doc.text(`Cédula/CI: ${sello.ci || '—'}`);
        doc.text(`Entidad emisora del certificado: ${sello.entidadEmisora || '—'}`);
        doc.text(`Fecha y hora de firma: ${sello.fechaFirma || '—'}`);
        doc.text(`Algoritmo: ${sello.algoritmo || 'SHA256withRSA'}`);
        doc.fontSize(9).fillColor('gray');
        doc.text(`Digest (SHA-256): ${(sello.digestBase64 || '').slice(0, 56)}...`);
        doc.fillColor('black').fontSize(10);
        // QR de validación (solo en documento oficial FINALIZADO_FIRMADO)
        if (estadoFirma === 'FINALIZADO_FIRMADO') {
          try {
            const QRCode = require('qrcode');
            const verificationPayload = `HC-CHONE|FORM008|${atencionId}|${(sello.digestBase64 || '').slice(0, 32)}`;
            const qrDataUrl = await QRCode.toDataURL(verificationPayload, { margin: 1, width: 120 });
            doc.moveDown(0.5);
            doc.fontSize(10).text('Código QR de validación:', doc.x, doc.y);
            const qrY = doc.y + 4;
            doc.image(qrDataUrl, doc.x, qrY, { width: 80 });
            doc.y = qrY + 84;
          } catch (_) { /* si falta qrcode o falla, se omite el QR */ }
        }
      } catch (_) { /* ignorar si el sello no es JSON válido */ }
    }

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
 * Endpoint para firmar una atención (subiendo .p12 en el momento)
 */
exports.firmarAtencion = async (req, res) => {
  try {
    const { atencionId } = req.params;
    const password = (req.body && req.body.password) ? String(req.body.password).trim() : '';

    if (!req.file) {
      return res.status(400).json({ message: 'Debe proporcionar el archivo .p12 del certificado.' });
    }

    // Validar que puede ser firmada
    const validacion = await validarPuedeFirmar(atencionId);
    if (!validacion.puedeFirmar) {
      return res.status(400).json({ message: validacion.motivo });
    }

    // Verificar que la atención existe y está pendiente
    const atencion = await AtencionEmergencia.findByPk(atencionId);
    if (!atencion) {
      return res.status(404).json({ message: 'Atención no encontrada.' });
    }

    if (atencion.estadoFirma === 'FINALIZADO_FIRMADO') {
      return res.status(400).json({ message: 'Esta atención ya ha sido firmada.' });
    }

    const p12Buffer = req.file.buffer;
    const { privateKey, metadatos } = abrirP12ParaFirma(p12Buffer, password);
    const plain = atencion.get ? atencion.get({ plain: true }) : atencion;
    const contenido = contenidoAFirmarForm008(plain);
    const firmaBase64 = firmarConClavePrivada(contenido, privateKey);
    const sello = crearSelloDigital(metadatos, contenido, firmaBase64);

    await atencion.update({
      estadoFirma: 'FINALIZADO_FIRMADO',
      selloDigital: JSON.stringify(sello)
    });

    const pdfBuffer = await generarPDFFormulario008(atencionId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="formulario_008_${atencionId}_firmado.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    if (error.message && (error.message.includes('Invalid password') || error.message.includes('pkcs12'))) {
      return res.status(400).json({ message: 'Contraseña incorrecta o archivo .p12 inválido.' });
    }
    return res.status(500).json({ message: error.message || 'Error al firmar la atención.' });
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

/** Validar .p12 y devolver solo metadatos (sin guardar clave). */
exports.validarP12 = async (req, res) => {
  try {
    if (!req.file || !req.body.password) {
      return res.status(400).json({ message: 'Debe enviar el archivo .p12 y la contraseña.' });
    }
    const meta = extraerMetadatos(req.file.buffer, req.body.password.trim());
    return res.json(meta);
  } catch (error) {
    if (error.message && (error.message.includes('Invalid password') || error.message.includes('pkcs12'))) {
      return res.status(400).json({ message: 'Contraseña incorrecta o archivo .p12 inválido.' });
    }
    return res.status(400).json({ message: error.message || 'Error al leer el certificado.' });
  }
};

/** Guardar certificado .p12 cifrado (AES-256) para el usuario actual. */
exports.guardarCertificado = async (req, res) => {
  try {
    const userId = req.userId;
    if (!req.file || !req.body.password) {
      return res.status(400).json({ message: 'Debe enviar el archivo .p12 y la contraseña.' });
    }
    const p12Buffer = req.file.buffer;
    const password = req.body.password.trim();
    const meta = extraerMetadatos(p12Buffer, password);
    const { cipher, iv } = encrypt(p12Buffer);
    const [row] = await CertificadoFirma.findOrCreate({
      where: { usuarioId: userId },
      defaults: {
        p12Cifrado: cipher,
        iv,
        algoritmoCifrado: 'aes-256-gcm',
        nombreTitular: meta.nombre,
        ciTitular: meta.ci,
        entidadEmisora: meta.entidadEmisora,
        fechaExpiracion: meta.fechaExpiracion || null
      }
    });
    if (!row) return res.status(500).json({ message: 'Error al guardar.' });
    if (!row.isNewRecord) {
      await row.update({
        p12Cifrado: cipher,
        iv,
        algoritmoCifrado: 'aes-256-gcm',
        nombreTitular: meta.nombre,
        ciTitular: meta.ci,
        entidadEmisora: meta.entidadEmisora,
        fechaExpiracion: meta.fechaExpiracion || null
      });
    }
    return res.json({ ok: true, metadatos: meta });
  } catch (error) {
    if (error.message && (error.message.includes('Invalid password') || error.message.includes('pkcs12'))) {
      return res.status(400).json({ message: 'Contraseña incorrecta o archivo .p12 inválido.' });
    }
    if (error.message && error.message.includes('FERME_ENCRYPTION_KEY')) {
      return res.status(500).json({ message: 'Configuración de cifrado faltante en el servidor.' });
    }
    return res.status(500).json({ message: error.message || 'Error al guardar el certificado.' });
  }
};

/** Información del certificado guardado (solo metadatos, sin blob). */
exports.getCertificadoInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const row = await CertificadoFirma.findOne({
      where: { usuarioId: userId },
      attributes: ['nombreTitular', 'ciTitular', 'entidadEmisora', 'fechaExpiracion']
    });
    const tieneCertificado = !!row;
    const metadatos = row ? {
      nombre: row.nombreTitular,
      ci: row.ciTitular,
      entidadEmisora: row.entidadEmisora,
      fechaExpiracion: row.fechaExpiracion
    } : null;
    return res.json({ tieneCertificado, metadatos });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error al obtener el certificado.' });
  }
};

/** Firmar atención con certificado guardado (modal solicita solo la clave). */
exports.firmarConCertificadoGuardado = async (req, res) => {
  try {
    const userId = req.userId;
    const { atencionId } = req.params;
    const { password } = req.body || {};
    if (!password || !String(password).trim()) {
      return res.status(400).json({ message: 'Debe enviar la contraseña del certificado (clave de firma).' });
    }

    const validacion = await validarPuedeFirmar(atencionId);
    if (!validacion.puedeFirmar) {
      return res.status(400).json({ message: validacion.motivo });
    }

    const certRow = await CertificadoFirma.findOne({ where: { usuarioId: userId } });
    if (!certRow) {
      return res.status(400).json({ message: 'No tiene un certificado guardado. Cargue uno en Ajustes > Firma Electrónica.' });
    }

    const p12Buffer = decrypt(
      Buffer.isBuffer(certRow.p12Cifrado) ? certRow.p12Cifrado : Buffer.from(certRow.p12Cifrado),
      Buffer.isBuffer(certRow.iv) ? certRow.iv : Buffer.from(certRow.iv)
    );
    const { privateKey, metadatos } = abrirP12ParaFirma(p12Buffer, String(password).trim());

    const atencion = await AtencionEmergencia.findByPk(atencionId);
    if (!atencion) {
      return res.status(404).json({ message: 'Atención no encontrada.' });
    }
    if (atencion.estadoFirma === 'FINALIZADO_FIRMADO') {
      return res.status(400).json({ message: 'Esta atención ya ha sido firmada.' });
    }

    const plain = atencion.get ? atencion.get({ plain: true }) : atencion;
    const contenido = contenidoAFirmarForm008(plain);
    const firmaBase64 = firmarConClavePrivada(contenido, privateKey);
    const sello = crearSelloDigital(metadatos, contenido, firmaBase64);

    await atencion.update({
      estadoFirma: 'FINALIZADO_FIRMADO',
      selloDigital: JSON.stringify(sello)
    });

    return res.json({ ok: true, sello });
  } catch (error) {
    if (error.message && (error.message.includes('Invalid password') || error.message.includes('pkcs12') || error.message.includes('keyBag'))) {
      return res.status(400).json({ message: 'Contraseña del certificado incorrecta.' });
    }
    return res.status(500).json({ message: error.message || 'Error al firmar.' });
  }
};

module.exports = exports;
