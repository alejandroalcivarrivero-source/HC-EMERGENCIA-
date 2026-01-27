/**
 * Extracción de metadatos de certificado .p12 (PKCS#12).
 * Usa node-forge (pure JS, agnóstico a OS: Windows/Linux/macOS).
 * La contraseña NUNCA se guarda; solo se usa en memoria para abrir el .p12.
 * Carga lazy de node-forge para que el backend arranque aunque falte la dependencia.
 */
function getForge() {
  try {
    return require('node-forge');
  } catch (e) {
    throw new Error('Falta la dependencia node-forge. En la carpeta backend ejecute: npm install node-forge');
  }
}

/**
 * Extrae metadatos del certificado sin guardar la clave.
 * @param {Buffer} p12Buffer - Contenido del archivo .p12
 * @param {string} password - Contraseña del .p12 (solo para esta llamada)
 * @returns {{ nombre: string, ci: string, entidadEmisora: string, fechaExpiracion: string }}
 */
function extraerMetadatos(p12Buffer, password) {
  const forge = getForge();
  const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag];
  if (!certBag || !certBag.length) {
    throw new Error('No se encontró certificado en el archivo .p12');
  }
  const cert = certBag[0].cert;
  const subject = cert.subject.attributes;
  const issuer = cert.issuer.attributes;

  const getAttr = (attrs, shortName) => {
    const a = attrs.find(x => x.shortName === shortName);
    return a ? a.value : '';
  };

  const nombre = getAttr(subject, 'commonName') || getAttr(subject, 'CN') || '';
  const ci = getAttr(subject, 'serialNumber') || getAttr(subject, '2.5.4.5') || '';
  const entidadEmisora = getAttr(issuer, 'commonName') || getAttr(issuer, 'O') || '';
  let fechaExpiracionNorm = '';
  if (cert.validity && cert.validity.notAfter) {
    const d = cert.validity.notAfter;
    const y = d.getFullYear();
    const m = String((d.getMonth && d.getMonth()) + 1).padStart(2, '0');
    const day = String((d.getDate && d.getDate()) || d.getUTCDate?.() || 1).padStart(2, '0');
    fechaExpiracionNorm = `${y}-${m}-${day}`;
  }

  return {
    nombre: nombre.trim(),
    ci: String(ci).trim(),
    entidadEmisora: entidadEmisora.trim(),
    fechaExpiracion: fechaExpiracionNorm
  };
}

/**
 * Obtiene clave privada y certificado desde .p12 (para firmar).
 * @param {Buffer} p12Buffer
 * @param {string} password
 * @returns {{ privateKey: object, certificate: object, metadatos: object }}
 */
function abrirP12ParaFirma(p12Buffer, password) {
  const forge = getForge();
  const metadatos = extraerMetadatos(p12Buffer, password);
  const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag];
  if (!keyBag?.length || !certBag?.length) {
    throw new Error('No se pudo extraer clave privada o certificado del .p12');
  }
  return {
    privateKey: keyBag[0].key,
    certificate: certBag[0].cert,
    metadatos
  };
}

module.exports = { extraerMetadatos, abrirP12ParaFirma };
