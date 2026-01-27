/**
 * Cifrado AES-256-GCM para certificados .p12 en reposo.
 * Solo se usa la clave del servidor (FERME_ENCRYPTION_KEY). La contraseña del
 * médico NUNCA se almacena (cumplimiento normativo).
 * Librería: Node crypto (built-in), agnóstica a OS (Windows/Linux/macOS).
 */
const crypto = require('crypto');

const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const KEY_LEN = 32;
const TAG_LEN = 16;

function getEncryptionKey() {
  const raw = process.env.FERME_ENCRYPTION_KEY;
  if (!raw || raw.length < 16) {
    throw new Error('FERME_ENCRYPTION_KEY debe tener al menos 16 caracteres en .env');
  }
  return crypto.scryptSync(raw, 'hc-emergencia-ferme-salt', KEY_LEN);
}

/**
 * Cifra un buffer (p. ej. .p12) con AES-256-GCM.
 * @param {Buffer} plain - Datos en claro
 * @returns {{ cipher: Buffer, iv: Buffer }}
 */
function encrypt(plain) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALG, key, iv, { authTagLength: TAG_LEN });
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { cipher: Buffer.concat([enc, tag]), iv };
}

/**
 * Descifra un blob producido por encrypt().
 * @param {Buffer} cipherWithTag - Buffer de cipher + authTag
 * @param {Buffer} iv - Vector de inicialización
 * @returns {Buffer}
 */
function decrypt(cipherWithTag, iv) {
  const key = getEncryptionKey();
  const tag = cipherWithTag.subarray(-TAG_LEN);
  const enc = cipherWithTag.subarray(0, -TAG_LEN);
  const decipher = crypto.createDecipheriv(ALG, key, iv, { authTagLength: TAG_LEN });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}

module.exports = { encrypt, decrypt, IV_LEN, TAG_LEN };
