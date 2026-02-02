const esCodigoZ = (codigo) => {
  return /^Z/i.test(String(codigo || '').trim());
};

const esCodigoST = (codigo) => {
  return /^[ST]/i.test(String(codigo || '').trim());
};

const esCausaExternaRango = (codigo) => {
  return /^[VWXY]\d{2}/i.test(String(codigo || '').trim().replace(/\s/g, ''));
};

/**
 * Valida reglas de negocio básicas para un diagnóstico.
 * @param {string} codigo - Código CIE10
 * @param {object} contexto - Contexto adicional (ej. noAplicaEventoTraumatico)
 * @returns {object} { valido: boolean, mensaje: string|null }
 */
const validarDiagnostico = (codigo, contexto = {}) => {
  const cod = String(codigo || '').trim().toUpperCase();
  
  // **VALIDACIÓN DE TRAUMA (S/T): Si el código inicia con 'S' o 'T', habilita un campo obligatorio de 'Causa Externa' (Códigos V, W, X, Y) y verifica que la pestaña de 'Evento Traumático' no esté en 'No Aplica'.**
  if (esCodigoST(cod)) {
    // 1. Verificación contra Evento Traumático 'No Aplica'
    if (contexto.noAplicaEventoTraumatico === true) {
      return {
        valido: false,
        mensaje: 'Para diagnósticos de Trauma/Lesión (S/T) es obligatorio llenar la sección de Evento Traumático, ya que la opción "No Aplica" está marcada.'
      };
    }
    
    // 2. Verificación de Causa Externa (implícita: si es ST, se espera que se agregue CE después. Aquí solo chequeamos si el ST en sí es válido para guardar).
    // La validación de que *debe* agregarse una causa externa V/W/X/Y es manejada en el frontend/validarFirma.
    // Este chequeo es solo para asegurar que el código S/T no sea inválido por sí mismo (lo cual no debería pasar si está en el maestro).
  }

  return { valido: true, mensaje: null };
};

module.exports = {
  esCodigoZ,
  esCodigoST,
  esCausaExternaRango,
  validarDiagnostico
};
