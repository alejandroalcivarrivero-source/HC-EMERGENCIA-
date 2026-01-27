/**
 * Servicio para gestión de firmas con token físico USB
 * Maneja la comunicación con agente externo y almacenamiento temporal de solicitudes
 */

// Almacenamiento temporal en memoria (en producción usar Redis o DB)
const solicitudesPendientes = new Map();

/**
 * Crear una solicitud de firma pendiente
 * @param {string} documentoId - ID único del documento
 * @param {object} datosDocumento - Datos del documento preparado
 * @param {number} timeout - Tiempo de espera en milisegundos (default: 5 minutos)
 * @returns {string} Token de solicitud
 */
function crearSolicitudFirma(documentoId, datosDocumento, timeout = 300000) {
  const solicitudToken = `TOKEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const solicitud = {
    token: solicitudToken,
    documentoId,
    datosDocumento,
    estado: 'PENDIENTE',
    fechaCreacion: new Date(),
    fechaExpiracion: new Date(Date.now() + timeout)
  };

  solicitudesPendientes.set(solicitudToken, solicitud);

  // Limpiar solicitud expirada después del timeout
  setTimeout(() => {
    if (solicitudesPendientes.has(solicitudToken)) {
      const solicitud = solicitudesPendientes.get(solicitudToken);
      if (solicitud.estado === 'PENDIENTE') {
        solicitudesPendientes.delete(solicitudToken);
        console.log(`Solicitud ${solicitudToken} expirada y eliminada`);
      }
    }
  }, timeout);

  return solicitudToken;
}

/**
 * Obtener una solicitud de firma
 * @param {string} solicitudToken - Token de la solicitud
 * @returns {object|null} Datos de la solicitud o null si no existe
 */
function obtenerSolicitud(solicitudToken) {
  const solicitud = solicitudesPendientes.get(solicitudToken);
  
  if (!solicitud) {
    return null;
  }

  // Verificar expiración
  if (new Date() > solicitud.fechaExpiracion) {
    solicitudesPendientes.delete(solicitudToken);
    return null;
  }

  return solicitud;
}

/**
 * Completar una solicitud de firma con la firma recibida del agente
 * @param {string} solicitudToken - Token de la solicitud
 * @param {string} firmaBase64 - Firma en Base64 recibida del agente
 * @param {object} certificadoInfo - Información del certificado usado
 * @returns {boolean} True si se completó exitosamente
 */
function completarSolicitudFirma(solicitudToken, firmaBase64, certificadoInfo) {
  const solicitud = obtenerSolicitud(solicitudToken);
  
  if (!solicitud) {
    throw new Error('Solicitud no encontrada o expirada');
  }

  if (solicitud.estado !== 'PENDIENTE') {
    throw new Error(`Solicitud ya procesada. Estado: ${solicitud.estado}`);
  }

  // Actualizar solicitud con la firma
  solicitud.estado = 'COMPLETADA';
  solicitud.firmaBase64 = firmaBase64;
  solicitud.certificadoInfo = certificadoInfo;
  solicitud.fechaFirma = new Date();

  solicitudesPendientes.set(solicitudToken, solicitud);

  return true;
}

/**
 * Cancelar una solicitud de firma
 * @param {string} solicitudToken - Token de la solicitud
 */
function cancelarSolicitud(solicitudToken) {
  const solicitud = obtenerSolicitud(solicitudToken);
  
  if (solicitud) {
    solicitud.estado = 'CANCELADA';
    solicitud.fechaCancelacion = new Date();
    solicitudesPendientes.set(solicitudToken, solicitud);
  }
}

/**
 * Limpiar solicitudes expiradas
 */
function limpiarSolicitudesExpiradas() {
  const ahora = new Date();
  let eliminadas = 0;

  for (const [token, solicitud] of solicitudesPendientes.entries()) {
    if (ahora > solicitud.fechaExpiracion && solicitud.estado === 'PENDIENTE') {
      solicitudesPendientes.delete(token);
      eliminadas++;
    }
  }

  if (eliminadas > 0) {
    console.log(`Limpiadas ${eliminadas} solicitudes expiradas`);
  }
}

// Ejecutar limpieza cada 5 minutos
setInterval(limpiarSolicitudesExpiradas, 300000);

module.exports = {
  crearSolicitudFirma,
  obtenerSolicitud,
  completarSolicitudFirma,
  cancelarSolicitud,
  limpiarSolicitudesExpiradas
};
