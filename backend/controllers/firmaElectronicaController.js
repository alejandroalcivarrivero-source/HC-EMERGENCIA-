const AtencionEmergencia = require("../models/atencionEmergencia");
const DetalleDiagnostico = require("../models/DetalleDiagnostico");
const CertificadoFirma = require("../models/certificadoFirma");
const TemporalGuardado = require("../models/temporal_guardado"); // Nueva importación
const Paciente = require("../models/pacientes");
const Admision = require("../models/Admision"); // MODIFICADO: Usar el nuevo modelo Admision
const Usuario = require("../models/usuario");
const { encrypt, decrypt } = require("../utils/cryptoFirma");
const { extraerMetadatos, abrirP12ParaFirma } = require("../utils/p12Metadatos");
const { contenidoAFirmarForm008, firmarConClavePrivada, crearSelloDigital } = require("../utils/selloDigital");
const { esCodigoST, esCausaExternaRango } = require("../utils/validacionesCIE10");

/**
 * Validar que una atención puede ser firmada
 * Debe tener al menos un diagnóstico DEFINITIVO (excepto códigos Z)
 */
exports.validarPuedeFirmar = async (atencionId) => { // Exportar directamente
  const diagnosticos = await DetalleDiagnostico.findAll({
    where: { atencionEmergenciaId: atencionId }, // Usar atencionEmergenciaId
  });

  if (diagnosticos.length === 0) {
    return { puedeFirmar: false, motivo: "No hay diagnósticos registrados." };
  }

  // Verificar si hay al menos un diagnóstico DEFINITIVO o código Z con NO APLICA
  const tieneDefinitivo = diagnosticos.some((d) => {
    const esCodigoZ = String(d.codigoCIE10).toUpperCase().startsWith("Z"); // Corregido a codigoCIE10
    return d.tipoDiagnostico === "DEFINITIVO" || (esCodigoZ && d.condicion === "NO APLICA"); // Corregido a tipoDiagnostico y condicion
  });

  if (!tieneDefinitivo) {
    return {
      puedeFirmar: false,
      motivo: "Debe existir al menos un diagnóstico DEFINITIVO (excepto códigos Z).",
    };
  }

  // Validación de Trauma (S o T) requiere Causa Externa (V-Y)
  const hayCodigoST = diagnosticos.some(d => esCodigoST(d.codigoCIE10));
  const tieneCausaExterna = diagnosticos.some(d => esCausaExternaRango(d.codigoCIE10));

  if (hayCodigoST && !tieneCausaExterna) {
    return {
      puedeFirmar: false,
      motivo: "Existe diagnóstico de Trauma (S o T). Debe agregar al menos un diagnóstico de Causa Externa (V00-V99, W00-X59, X60-Y09, Y35-Y84) para poder firmar."
    };
  }

  // Previsión 094: si hay violencia en Sección D, Observaciones obligatorias (mín. 100 caracteres)
  const atencion = await AtencionEmergencia.findByPk(atencionId, {
    attributes: ["tipoAccidenteViolenciaIntoxicacion", "observacionesAccidente"],
  });
  if (atencion && atencion.tipoAccidenteViolenciaIntoxicacion) {
    let tipoD;
    try {
      tipoD =
        typeof atencion.tipoAccidenteViolenciaIntoxicacion === "string"
          ? JSON.parse(atencion.tipoAccidenteViolenciaIntoxicacion)
          : atencion.tipoAccidenteViolenciaIntoxicacion;
    } catch {
      tipoD = { seleccion: [] };
    }
    const sel = Array.isArray(tipoD?.seleccion) ? tipoD.seleccion : [];
    const hayViolencia = sel.some((v) => {
      const s = String(v || "").toUpperCase();
      return s.startsWith("VIOLENCIA_") || s.includes("VIOLENCIA");
    });
    if (hayViolencia && (atencion.observacionesAccidente || "").trim().length < 100) {
      return {
        puedeFirmar: false,
        motivo: "Por tratarse de violencia, las Observaciones de la Sección D (Accidente, Violencia, Intoxicación) deben tener al menos 100 caracteres para cumplir el relato pericial (Previsión 094).",
      };
    }
  }

  return { puedeFirmar: true };
};

/**
 * Generar PDF del Formulario 008
 */
async function generarPDFFormulario008(atencionId, isPreliminar = false, rawFormData = null) {
  try {
    const PDFDocument = require("pdfkit");
    const QRCode = require("qrcode"); // Importar QRCode aquí también para preliminar si se usa.

    let atencion;
    let diagnosticos = [];

    if (rawFormData) {
      // Si se proporcionan datos del formulario (borrador)
      atencion = { ...rawFormData };
      // Deserializar campos que normalmente son JSON strings en la BD
      atencion.tipoAccidenteViolenciaIntoxicacion =
        typeof atencion.tipoAccidenteViolenciaIntoxicacion === "string"
          ? JSON.parse(atencion.tipoAccidenteViolenciaIntoxicacion)
          : atencion.tipoAccidenteViolenciaIntoxicacion;
      atencion.antecedentesPatologicos =
        typeof atencion.antecedentesPatologicos === "string"
          ? JSON.parse(atencion.antecedentesPatologicos)
          : atencion.antecedentesPatologicos;
      atencion.examenFisico =
        typeof atencion.examenFisico === "string"
          ? JSON.parse(atencion.examenFisico)
          : atencion.examenFisico;
      atencion.embarazoParto =
        typeof atencion.embarazoParto === "string"
          ? JSON.parse(atencion.embarazoParto)
          : atencion.embarazoParto;
      atencion.examenesComplementarios =
        typeof atencion.examenesComplementarios === "string"
          ? JSON.parse(atencion.examenesComplementarios)
          : atencion.examenesComplementarios;
      atencion.planTratamiento =
        typeof atencion.planTratamiento === "string"
          ? JSON.parse(atencion.planTratamiento)
          : atencion.planTratamiento;
      // Establecer un estado de firma para el borrador, si no se obtiene de la BD
      if (!atencion.estadoFirma) atencion.estadoFirma = "BORRADOR";

      // Si los diagnósticos vienen con rawFormData, usarlos. Si no, se buscarán en la BD por atencionId
      diagnosticos = rawFormData.diagnosticos || []; // Podría venir como un array de objetos de diagnóstico ya parseados
    }

    if (!atencion || !Object.keys(atencion).length) {
      // Si no tenemos datos de atención del borrador, buscar en la BD
      const fetchedAtencion = await AtencionEmergencia.findByPk(atencionId, {
        include: [
          {
            model: Paciente,
            as: "Paciente",
            attributes: [
              "primer_nombre",
              "segundo_nombre",
              "primer_apellido",
              "segundo_apellido",
              "numero_identificacion",
              "fecha_nacimiento",
              "sexo",
            ],
          },
          {
            model: Admision,
            as: "AdmisionAtencion",
            attributes: ["id", "fecha_hora_admision"],
          },
          {
            model: Usuario,
            as: "Usuario",
            attributes: ["nombres", "apellidos", "cedula"],
          },
        ],
      });
      if (!fetchedAtencion) {
        throw new Error("Atención no encontrada.");
      }
      atencion = fetchedAtencion.get({ plain: true }); // Obtener objeto plano
    }

    // Cargar diagnósticos si no vinieron con rawFormData o si atencionId es diferente
    if (diagnosticos.length === 0 && atencionId) {
      diagnosticos = await DetalleDiagnostico.findAll({
        where: { atencionEmergenciaId: atencionId }, // Usar atencionEmergenciaId
        include: [
          {
            model: require("../models/catCie10"),
            as: "CIE10",
            attributes: ["codigo", "descripcion"],
          },
          {
            model: DetalleDiagnostico,
            as: "CausaExternaPadre",
            attributes: ["id", "codigoCIE10", "tipoDiagnostico", "condicion", "esCausaExterna"],
            required: false,
          },
        ],
        order: [["id", "ASC"]], // Ordenar por ID para consistencia
      });
    }

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {});

    // Lógica de marca de agua
    const estadoFirma = atencion.estadoFirma || atencion.estado_firma;
    let watermarkText = "";
    if (isPreliminar && estadoFirma !== "FINALIZADO_FIRMADO") {
      watermarkText = "DOCUMENTO PRELIMINAR - NO FIRMADO";
    }
    // Solo si no es preliminar y es BORRADOR, mostrar el watermark de BORRADOR
    else if (!isPreliminar && estadoFirma === "BORRADOR") {
      watermarkText = "BORRADOR NO VÁLIDO";
    }

    if (watermarkText) {
      doc.save();
      doc.opacity(0.28);
      doc.fillColor("red");
      doc.fontSize(42);
      const cx = doc.page.width / 2;
      const cy = doc.page.height / 2;
      doc.translate(cx, cy);
      doc.rotate(-35, { origin: [0, 0] });
      doc.text(watermarkText, -200, -14, { width: 400, align: "center" });
      doc.restore();
      doc.opacity(1);
      doc.fillColor("black");
    }

    doc.fontSize(16).text("FORMULARIO 008 - ATENCIÓN DE EMERGENCIA", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text("DATOS DEL PACIENTE", { underline: true });
    doc.fontSize(10);
    doc.text(
      `Nombre: ${atencion.Paciente.primer_nombre} ${atencion.Paciente.segundo_nombre || ""} ${atencion.Paciente.primer_apellido} ${atencion.Paciente.segundo_apellido || ""}`
    );
    doc.text(`Identificación: ${atencion.Paciente.numero_identificacion}`);
    doc.text(`Fecha de Nacimiento: ${atencion.Paciente.fecha_nacimiento}`);
    doc.text(`Sexo: ${atencion.Paciente.sexo}`);
    doc.moveDown();

    // Datos de la atención
    doc.fontSize(12).text("DATOS DE LA ATENCIÓN", { underline: true });
    doc.fontSize(10);
    doc.text(`Fecha de Atención: ${atencion.fechaAtencion}`);
    doc.text(`Hora de Atención: ${atencion.horaAtencion}`);
    doc.text(`Condición de Llegada: ${atencion.condicionLlegada}`);
    doc.text(`Motivo de Atención: ${atencion.motivoAtencion || "N/A"}`);
    doc.moveDown();

    // Diagnósticos — Filtro Formulario 008: solo morbilidad, máx. 3 Presuntivos (L) y 3 Definitivos (M).
    // Excluir: códigos Z (NO APLICA), causas externas (V–Y) y códigos con padre_id.
    const esCodigoZPdf = (cod) => String(cod || "").toUpperCase().startsWith("Z");
    const esCausaExternaPdf = (d) =>
      /^[VWXY]/.test(String(d.codigoCIE10 || "").toUpperCase()) || d.padreId != null; // Corregido a camelCase
    const morbilidad = diagnosticos.filter(
      (d) => !esCodigoZPdf(d.codigoCIE10) && !esCausaExternaPdf(d) // Corregido a camelCase
    );
    const presuntivosPdf = morbilidad
      .filter((d) => d.tipoDiagnostico === "PRESUNTIVO")
      .slice(0, 3); // Corregido a camelCase
    const definitivosPdf = morbilidad
      .filter((d) => d.tipoDiagnostico === "DEFINITIVO")
      .slice(0, 3); // Corregido a camelCase
    const diagnosticosParaPdf = [...presuntivosPdf, ...definitivosPdf];

    doc.fontSize(12).text("DIAGNÓSTICOS", { underline: true });
    doc.fontSize(10);
    diagnosticosParaPdf.forEach((diag, index) => {
      const cod = diag.CIE10?.codigo || diag.codigoCIE10 || ""; // Corregido a camelCase
      const desc = diag.CIE10?.descripcion || diag.descripcion || "";
      doc.text(`${index + 1}. CIE-10: ${cod} - ${desc}`);
      doc.text(`   Tipo: ${diag.tipoDiagnostico}, Condición: ${diag.condicion}`); // Añadida condición
      if (diag.descripcion && diag.descripcion !== desc) {
        doc.text(`   Observaciones: ${diag.descripcion}`);
      }
      doc.moveDown(0.5);
    });

    // Enfermedad o problema actual
    if (atencion.enfermedadProblemaActual) {
      doc.fontSize(12).text("ENFERMEDAD O PROBLEMA ACTUAL", { underline: true });
      doc.fontSize(10);
      doc.text(atencion.enfermedadProblemaActual);
      doc.moveDown();
    }

    // Plan de tratamiento
    if (atencion.planTratamiento && atencion.planTratamiento.length > 0) {
      // Verificar longitud
      doc.fontSize(12).text("PLAN DE TRATAMIENTO", { underline: true });
      doc.fontSize(10);
      const plan =
        typeof atencion.planTratamiento === "string"
          ? JSON.parse(atencion.planTratamiento)
          : atencion.planTratamiento; // Puede ser objeto ya parseado
      plan.forEach((item, index) => {
        doc.text(`${index + 1}. ${item.medicamento || "N/A"}`);
        doc.text(
          `   Vía: ${item.via || "N/A"}, Dosis: ${item.dosis || "N/A"}, Posología: ${item.posologia || "N/A"}, Días: ${item.dias || "N/A"}`
        );
        doc.moveDown(0.5);
      });
    }

    doc.moveDown();
    doc.fontSize(12).text("PROFESIONAL RESPONSABLE", { underline: true });
    doc.fontSize(10);
    doc.text(`Nombre: ${atencion.Usuario.nombres} ${atencion.Usuario.apellidos}`);
    doc.text(`Cédula: ${atencion.Usuario.cedula}`);

    // Firma electrónica / Sello digital (formato legal MSP) — solo si ya fue firmado (FINALIZADO_FIRMADO)
    const selloRaw = atencion.selloDigital || atencion.sello_digital;
    if (selloRaw && estadoFirma === "FINALIZADO_FIRMADO") {
      // Solo mostrar sello si está FINALIZADO_FIRMADO
      try {
        const sello = typeof selloRaw === "string" ? JSON.parse(selloRaw) : selloRaw;
        doc.moveDown();
        doc.fontSize(12).text("FIRMA ELECTRÓNICA / SELLO DIGITAL (MSP)", { underline: true });
        doc.fontSize(10);
        doc.text(`Titular del certificado: ${sello.nombre || "—"}`);
        doc.text(`Cédula/CI: ${sello.ci || "—"}`);
        doc.text(`Entidad emisora del certificado: ${sello.entidadEmisora || "—"}`);
        doc.text(`Fecha y hora de firma: ${sello.fechaFirma || "—"}`);
        doc.text(`Algoritmo: ${sello.algoritmo || "SHA256withRSA"}`);
        doc.fontSize(9).fillColor("gray");
        doc.text(`Digest (SHA-256): ${(sello.digestBase64 || "").slice(0, 56)}...`);
        doc.fillColor("black").fontSize(10);
        // QR de validación (solo en documento oficial FINALIZADO_FIRMADO)
        try {
          const verificationPayload = `HC-CHONE|FORM008|${atencionId}|${(sello.digestBase64 || "").slice(
            0,
            32
          )}`;
          const qrDataUrl = await QRCode.toDataURL(verificationPayload, { margin: 1, width: 120 });
          doc.moveDown(0.5);
          doc.fontSize(10).text("Código QR de validación:", doc.x, doc.y);
          const qrY = doc.y + 4;
          doc.image(qrDataUrl, doc.x, qrY, { width: 80 });
          doc.y = qrY + 84;
        } catch (_) {
          /* si falla, se omite el QR */
        }
      } catch (_) {
        /* ignorar si el sello no es JSON válido */
      }
    }

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);
    });
  } catch (error) {
    console.error("Error al generar PDF:", error);
    throw error;
  }
}

/**
 * Endpoint para firmar una atención (subiendo .p12 en el momento)
 */
exports.firmarAtencion = async (req, res) => { // Ahora es exports.firmarAtencion
  try {
    const { atencionId } = req.params;
    const password = (req.body && req.body.password) ? String(req.body.password).trim() : '';

    if (!req.file) {
      return res.status(400).json({ message: 'Debe proporcionar el archivo .p12 del certificado.' });
    }

    const validacion = await exports.validarPuedeFirmar(atencionId); // Usar exports.validarPuedeFirmar
    if (!validacion.puedeFirmar) {
      return res.status(400).json({ message: validacion.motivo });
    }

    // INICIO: Lógica modificada para validar Admision y estado
    const atencion = await AtencionEmergencia.findByPk(atencionId);
    if (!atencion) {
      return res.status(404).json({ message: 'Atención no encontrada.' });
    }

    const admision = await Admision.findByPk(atencion.admisionId);
    if (!admision) {
      return res.status(404).json({ message: 'Admisión asociada no encontrada.' });
    }

    // Validación Legal: Admision debe existir y tener un estado válido
    // Un estado válido para firmar es cualquier estado que no sea 'EGRESADO'
    // Primero obtenemos el nombre del estado si tenemos el ID
    let estadoNombre = 'DESCONOCIDO';
    if (admision.estado_paciente_id) {
        // Importar CatEstadoPaciente localmente si es necesario o asumir que ya está cargado si usamos include
        // Aquí haremos una consulta rápida si no vino con include
        const CatEstadoPaciente = require("../models/cat_estado_paciente");
        const estadoObj = await CatEstadoPaciente.findByPk(admision.estado_paciente_id);
        if (estadoObj) estadoNombre = estadoObj.nombre;
    }

    if (estadoNombre === 'EGRESADO') {
      return res.status(400).json({ message: `No se puede firmar una atención con estado de Admisión: ${estadoNombre}.` });
    }
    // FIN: Lógica modificada para validar Admision y estado

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

    // MODIFICADO: Actualizar el nuevo modelo Admision con los nuevos campos (camelCase)
    await admision.update({
      firmaDigitalHash: sello.digestBase64,
      fechaFirma: new Date()
    });
    // FIN MODIFICADO

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
 * Obtener PDF preview del formulario sin firmar (vista previa)
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

    // Obtener usuario para validar CI
    const usuario = await Usuario.findByPk(userId);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const p12Buffer = req.file.buffer;
    const password = req.body.password.trim();
    const meta = extraerMetadatos(p12Buffer, password);

    // Validación: La cédula del certificado debe coincidir con la del usuario registrado
    if (meta.ci !== usuario.cedula) {
      return res.status(400).json({
        message: `El certificado pertenece a la cédula ${meta.ci}, pero su usuario está registrado con ${usuario.cedula}. No se puede guardar.`
      });
    }

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
      return res.status(400).json({ message: 'Debe enviar la contraseña del certificado (clave de firma).'
    });
  }

    const validacion = await exports.validarPuedeFirmar(atencionId);
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
    
    // Validar integridad del buffer descifrado
    if (!p12Buffer || p12Buffer.length === 0) {
        throw new Error('Error al descifrar el certificado: buffer vacío o clave incorrecta.');
    }
    const { privateKey, metadatos } = abrirP12ParaFirma(p12Buffer, String(password).trim());

    // INICIO: Lógica modificada para validar Admision y estado
    const atencion = await AtencionEmergencia.findByPk(atencionId);
    if (!atencion) {
      return res.status(404).json({ message: 'Atención no encontrada.' });
    }

    const admision = await Admision.findByPk(atencion.admisionId);
    if (!admision) {
        return res.status(404).json({ message: 'Admisión asociada no encontrada.' });
    }

    // Validación Legal: Admision debe existir y tener un estado válido
    let estadoNombre = 'DESCONOCIDO';
    if (admision.estado_paciente_id) {
        const CatEstadoPaciente = require("../models/cat_estado_paciente");
        const estadoObj = await CatEstadoPaciente.findByPk(admision.estado_paciente_id);
        if (estadoObj) estadoNombre = estadoObj.nombre;
    }

    if (estadoNombre === 'EGRESADO') {
        return res.status(400).json({ message: `No se puede firmar una atención con estado de Admisión: ${estadoNombre}.` });
    }
    // FIN: Lógica modificada para validar Admision y estado

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

    // MODIFICADO: Actualizar el nuevo modelo Admision con los nuevos campos (camelCase)
    await admision.update({
      firmaDigitalHash: sello.digestBase64,
      fechaFirma: new Date()
    });
    // FIN MODIFICADO

    return res.json({ ok: true, sello });
  } catch (error) {
    if (error.message && (error.message.includes('Invalid password') || error.message.includes('pkcs12') || error.message.includes('keyBag'))) {
      return res.status(400).json({ message: 'Contraseña del certificado incorrecta.' });
    }
    return res.status(500).json({ message: error.message || 'Error al firmar.' });
  }
};

/**
 * Generar PDF Preliminar del Formulario 008 (sin firmar, con datos del borrador si existen)
 */
exports.getPDFPreliminar = async (req, res) => {
  try {
    const { admisionId } = req.params;
    const userId = req.userId;

    let atencionPrincipal = await AtencionEmergencia.findOne({
      where: { admisionId: admisionId },
      include: [
        { model: Paciente, as: 'Paciente' },
        { model: Usuario, as: 'Usuario' }
      ]
    });

    let formDataFromBorrador = null;
    let diagnosticosFromBorrador = [];
    let atencionIdParaBorrador = atencionPrincipal?.id || parseInt(admisionId, 10);

    if (!atencionPrincipal || atencionPrincipal.estadoFirma !== 'FINALIZADO_FIRMADO') {
      const borrador = await TemporalGuardado.findOne({
        where: { idAtencion: atencionIdParaBorrador },
        order: [['createdAt', 'DESC']]
      });

      if (borrador && borrador.datos) {
        formDataFromBorrador = JSON.parse(borrador.datos);

        let effectiveAtencionIdForDiagnosticos = atencionPrincipal?.id || atencionIdParaBorrador;

        diagnosticosFromBorrador = await DetalleDiagnostico.findAll({
          where: { atencionEmergenciaId: effectiveAtencionIdForDiagnosticos },
          include: [{
            model: require('../models/catCie10'),
            as: 'CIE10',
            attributes: ['codigo', 'descripcion']
          }, {
            model: DetalleDiagnostico,
            as: 'CausaExternaPadre',
            attributes: ['id', 'codigoCIE10', 'tipoDiagnostico', 'condicion', 'esCausaExterna'],
            required: false
          }],
          order: [['id', 'ASC']]
        });

        const finalAtencionData = atencionPrincipal ? { ...atencionPrincipal.get({ plain: true }), ...formDataFromBorrador } : formDataFromBorrador;
        if (!finalAtencionData.Paciente && atencionPrincipal?.Paciente) finalAtencionData.Paciente = atencionPrincipal.Paciente;
        if (!finalAtencionData.Usuario && atencionPrincipal?.Usuario) finalAtencionData.Usuario = atencionPrincipal.Usuario;
        if (!finalAtencionData.Usuario && userId) {
            const user = await Usuario.findByPk(userId);
            finalAtencionData.Usuario = { nombres: user?.nombres, apellidos: user?.apellidos, cedula: user?.cedula };
        }
        if (!finalAtencionData.Paciente && admisionId) {
            const adm = await Admision.findByPk(admisionId, { include: [{ model: Paciente, as: 'Paciente' }] });
            finalAtencionData.Paciente = adm?.Paciente;
        }

        const pdfBuffer = await generarPDFFormulario008(atencionIdParaBorrador, true, { ...finalAtencionData, diagnosticos: diagnosticosFromBorrador });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="formulario_008_preliminar_${admisionId}.pdf"`);
        return res.send(pdfBuffer);
      }
    }
    
    if (atencionPrincipal && atencionPrincipal.estadoFirma === 'FINALIZADO_FIRMADO') {
      return res.status(400).json({ message: 'La atención ya está finalizada y firmada. Use la opción de descarga de PDF oficial.' });
    }
    
    return res.status(404).json({ message: 'No se encontró una atención o borrador válido para generar el preliminar.' });

  } catch (error) {
    console.error('Error al generar PDF Preliminar:', error);
    res.status(500).json({ message: 'Error al generar PDF Preliminar.', error: error.message });
  }
};

module.exports = {
  validarPuedeFirmar: exports.validarPuedeFirmar, // Ahora se exporta explícitamente desde exports
  firmarAtencion: exports.firmarAtencion,         // Ahora se exporta explícitamente desde exports
  getPDFPreview: exports.getPDFPreview,
  validarP12: exports.validarP12,
  guardarCertificado: exports.guardarCertificado,
  getCertificadoInfo: exports.getCertificadoInfo,
  firmarConCertificadoGuardado: exports.firmarConCertificadoGuardado,
  getPDFPreliminar: exports.getPDFPreliminar,
};
