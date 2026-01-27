/**
 * Servicio para preparar documentos según estándar XAdES
 * Genera el digest/hash del documento para firma electrónica
 * Compatible con tokens PKCS#11 (Linux Mint/Windows)
 */
const crypto = require('crypto');

/**
 * Genera el digest (hash) del documento PDF según estándar XAdES
 * @param {Buffer} pdfBuffer - Buffer del PDF a firmar
 * @param {string} algoritmo - Algoritmo de hash (default: SHA-256)
 * @returns {object} Objeto con digest, algoritmo y metadatos
 */
function generarDigestXAdES(pdfBuffer, algoritmo = 'sha256') {
  try {
    // Validar algoritmo
    const algoritmosValidos = ['sha1', 'sha256', 'sha384', 'sha512'];
    if (!algoritmosValidos.includes(algoritmo.toLowerCase())) {
      throw new Error(`Algoritmo no válido. Use uno de: ${algoritmosValidos.join(', ')}`);
    }

    // Generar hash del documento
    const hash = crypto.createHash(algoritmo);
    hash.update(pdfBuffer);
    const digest = hash.digest('hex');

    // Metadatos del documento
    const metadatos = {
      algoritmo: algoritmo.toUpperCase(),
      tamaño: pdfBuffer.length,
      timestamp: new Date().toISOString(),
      formato: 'PDF',
      estandar: 'XAdES'
    };

    return {
      digest,
      algoritmo: algoritmo.toUpperCase(),
      metadatos,
      // Base64 para transmisión
      digestBase64: Buffer.from(digest, 'hex').toString('base64')
    };
  } catch (error) {
    console.error('Error al generar digest XAdES:', error);
    throw new Error(`Error al generar digest: ${error.message}`);
  }
}

/**
 * Valida que un digest sea válido
 * @param {string} digest - Digest a validar
 * @param {Buffer} pdfBuffer - Buffer original del PDF
 * @param {string} algoritmo - Algoritmo usado
 * @returns {boolean} True si el digest es válido
 */
function validarDigest(digest, pdfBuffer, algoritmo = 'sha256') {
  try {
    const hash = crypto.createHash(algoritmo);
    hash.update(pdfBuffer);
    const digestCalculado = hash.digest('hex');
    return digest.toLowerCase() === digestCalculado.toLowerCase();
  } catch (error) {
    console.error('Error al validar digest:', error);
    return false;
  }
}

/**
 * Prepara el documento para firma con token USB
 * Retorna el digest y metadatos necesarios para el agente externo
 * @param {Buffer} pdfBuffer - Buffer del PDF
 * @param {string} atencionId - ID de la atención
 * @param {object} usuario - Datos del usuario que firma
 * @returns {object} Documento preparado para firma
 */
function prepararDocumentoParaToken(pdfBuffer, atencionId, usuario) {
  const digestData = generarDigestXAdES(pdfBuffer, 'sha256');
  
  return {
    documentoId: `FORM_008_${atencionId}_${Date.now()}`,
    tipoDocumento: 'FORMULARIO_008',
    atencionId: atencionId,
    usuario: {
      cedula: usuario.cedula,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos
    },
    digest: digestData.digest,
    digestBase64: digestData.digestBase64,
    algoritmo: digestData.algoritmo,
    metadatos: digestData.metadatos,
    // Información para el agente externo
    protocolo: 'firmaec://',
    callbackUrl: `http://localhost:3001/api/firma-electronica/token/callback/${atencionId}`
  };
}

module.exports = {
  generarDigestXAdES,
  validarDigest,
  prepararDocumentoParaToken
};
