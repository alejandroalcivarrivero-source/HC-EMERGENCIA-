/**
 * Generación del Sello Digital para firma electrónica.
 * Contenido firmado = JSON canónico de la atención (Form 008) o párrafo de evolución (005).
 * Algoritmo: SHA-256 sobre el contenido + firma RSA. Formato agnóstico a OS (node-forge).
 * Carga lazy de node-forge para que el backend arranque aunque falte la dependencia.
 */
const crypto = require('crypto');

const ALGORITMO_DIGEST = 'SHA256';
const ALGORITMO_FIRMA = 'sha256';

/**
 * Construye el contenido canónico a firmar para Form 008 (atención de emergencia).
 * Orden estable para que el digest sea reproducible en cualquier SO.
 * @param {object} atencion - Objeto atención (sin sello_digital)
 * @returns {string} JSON string estable
 */
function contenidoAFirmarForm008(atencion) {
  const copy = { ...atencion };
  delete copy.selloDigital;
  delete copy.sello_digital;
  delete copy.updatedAt;
  delete copy.createdAt;
  const keys = Object.keys(copy).sort();
  const obj = {};
  keys.forEach(k => { obj[k] = copy[k]; });
  return JSON.stringify(obj);
}

/**
 * Genera digest SHA-256 en base64 del contenido.
 * @param {string} contenido
 * @returns {string}
 */
function digestBase64(contenido) {
  const buf = Buffer.from(contenido, 'utf8');
  const hash = crypto.createHash('sha256').update(buf).digest();
  return hash.toString('base64');
}

/**
 * Firma el digest (o el contenido) con la clave privada RSA del .p12.
 * node-forge espera una firma en formato PKCS#1 v1.5 para RSA.
 * @param {string} contenido - Contenido a firmar (se hashea internamente si se usa md)
 * @param {object} privateKey - forge.pki.PrivateKey
 * @returns {string} Firma en base64
 */
function firmarConClavePrivada(contenido, privateKey) {
  let forge;
  try {
    forge = require('node-forge');
  } catch (e) {
    throw new Error('Falta la dependencia node-forge. En la carpeta backend ejecute: npm install node-forge');
  }
  const md = forge.md.sha256.create();
  md.update(contenido, 'utf8');
  const signature = privateKey.sign(md);
  return forge.util.encode64(signature);
}

/**
 * Arma el objeto Sello Digital para almacenar y para que el PDF lo muestre en formato legal MSP.
 * @param {{ nombre: string, ci: string, entidadEmisora: string }} metadatos
 * @param {string} contenidoCanonico - JSON string del contenido firmado
 * @param {string} firmaBase64 - Firma en base64
 * @returns {object}
 */
function crearSelloDigital(metadatos, contenidoCanonico, firmaBase64) {
  const digest = digestBase64(contenidoCanonico);
  const fechaFirma = new Date().toISOString();
  return {
    nombre: metadatos.nombre,
    ci: metadatos.ci,
    entidadEmisora: metadatos.entidadEmisora,
    fechaFirma,
    digestBase64: digest,
    firmaBase64,
    algoritmo: 'SHA256withRSA'
  };
}

module.exports = {
  contenidoAFirmarForm008,
  digestBase64,
  firmarConClavePrivada,
  crearSelloDigital
};
