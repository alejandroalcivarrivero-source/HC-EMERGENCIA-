// backend/utils/utils.js

function limpiarDatosAtencion(dato) {
    if (typeof dato === 'string' && isNaN(new Date(dato))) {
        return null;
    }
    
    return dato;
}

module.exports = { limpiarDatosAtencion };
