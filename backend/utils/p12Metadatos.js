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


  const getAttrValue = (attrs, identifier) => {
    // identifier can be name, shortName or type (OID)
    const attr = attrs.find(a => a.name === identifier || a.shortName === identifier || a.type === identifier);
    return attr ? attr.value : '';
  };

  const nombre = getAttrValue(subject, 'commonName') || getAttrValue(subject, 'CN') || '';

  // Lógica de extracción de Cédula Robustecida (Universal Ecuador)
  let ci = '';
  
  // Buscar también en serialNumber (OID 2.5.4.5) que suele contener la cédula en certificados de persona física
  const serialNumber = getAttrValue(subject, 'serialNumber') || getAttrValue(subject, 'SN');

  const extraerDigitosCedula = (val) => {
    if (!val || typeof val !== 'string') return null;
    let s = val.trim();
    
    // 1. Limpieza de prefijos comunes en certificados
    if (s.toUpperCase().startsWith('CED-')) s = s.substring(4);
    else if (s.toUpperCase().startsWith('PAS-')) s = s.substring(4);
    else if (s.toUpperCase().startsWith('RUC-')) s = s.substring(4);
    
    // 2. Intentar extraer los primeros 10 dígitos encontrados
    const match = s.match(/\d{10}/);
    return match ? match[0] : null;
  };

  // 1. Estrategia Exhaustiva: Extensiones (Prioridad Banco Central y BCE)
  // Se busca en OIDs conocidos donde se almacena la cédula/RUC en certificados ecuatorianos.
  if (cert.extensions) {
    const oidsBCE = [
      '1.3.6.1.4.1.37947.3.11',  // OID identificado en depuración (Banco Central)
      '1.3.6.1.4.1.37947.3.1.1'  // Variante común antigua
    ];

    for (const oid of oidsBCE) {
      const ext = cert.extensions.find(e => e.id === oid);
      if (ext && ext.value) {
        // La extensión contiene datos binarios (o ASN.1). Buscamos el primer patrón de 10 dígitos.
        // Esto captura la Cédula incluso si viene dentro de un RUC (primeros 10 dígitos).
        const match = ext.value.match(/\d{10}/);
        if (match) {
          ci = match[0];
          break; // Detener búsqueda si ya encontramos la cédula
        }
      }
    }
  }

  // 2. Estrategia: Buscar explícitamente en serialNumber (si existe)
  if (!ci && serialNumber) {
      const match = serialNumber.match(/\d{10}/);
      if (match) ci = match[0];
  }

  // 3. Estrategia de Respaldo: Búsqueda profunda en Subject
  // Si no se encontró en extensiones ni serialNumber, busca en cualquier atributo del subject que contenga 10 dígitos.
  if (!ci) {
    for (const attr of subject) {
      if (attr.value && typeof attr.value === 'string') {
        const match = attr.value.match(/\d{10}/);
        if (match) {
          ci = match[0];
          break;
        }
      }
    }
  }

  const entidadEmisora = getAttrValue(issuer, 'commonName') || getAttrValue(issuer, 'O') || '';
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
