const express = require('express');
const router = express.Router();
const diagnosticosController = require('../controllers/diagnosticosController');
const validarToken = require('../middlewares/validarToken');

// Obtener diagnósticos de una atención
router.get('/atencion/:atencionId', validarToken, diagnosticosController.getDiagnosticos);

// Agregar diagnóstico
router.post('/atencion/:atencionId', validarToken, diagnosticosController.agregarDiagnostico);

// Actualizar diagnóstico
router.put('/:diagnosticoId', validarToken, diagnosticosController.actualizarDiagnostico);

// Eliminar diagnóstico
router.delete('/:diagnosticoId', validarToken, diagnosticosController.eliminarDiagnostico);

// Validar si puede firmar
router.get('/validar-firma/:atencionId', validarToken, diagnosticosController.validarFirma);

module.exports = router;
