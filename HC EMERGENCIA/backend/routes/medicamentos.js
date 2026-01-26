const express = require('express');
const router = express.Router();
const medicamentosController = require('../controllers/medicamentosController');
const validarToken = require('../middlewares/validarToken'); // Asumiendo que ya tienes este middleware

// Rutas protegidas por token
router.post('/', validarToken, medicamentosController.crearMedicamento);
router.get('/', validarToken, medicamentosController.obtenerMedicamentos);
router.get('/:id', validarToken, medicamentosController.obtenerMedicamentoPorId);
router.put('/:id', validarToken, medicamentosController.actualizarMedicamento);
router.delete('/:id', validarToken, medicamentosController.eliminarMedicamento);

module.exports = router;