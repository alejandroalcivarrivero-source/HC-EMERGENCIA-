const express = require('express');
const router = express.Router();
const signosVitalesController = require('../controllers/signosVitalesController');
const validarToken = require('../middlewares/validarToken'); // Importar directamente

// Rutas para Signos Vitales
// Ruta para calcular el triaje sin guardar los signos vitales
router.post('/calcular-triaje', validarToken, signosVitalesController.calculateTriajeOnly);
// Ruta para asignar solo el triaje sin signos vitales
router.post('/asignar-triaje-solo', validarToken, signosVitalesController.asignarTriajeSolo);
// Ruta para guardar los signos vitales y el triaje definitivo
router.post('/guardar-con-triaje', validarToken, signosVitalesController.saveSignosVitalesAndTriaje);

// Rutas existentes (mantener si aún son necesarias para otras funcionalidades)
// router.post('/', validarToken, signosVitalesController.createSignosVitales); // Esta ruta ya no se usará directamente desde el formulario
router.get('/:admisionId', validarToken, signosVitalesController.getSignosVitalesByAdmision);
router.get('/historial/:admisionId', validarToken, (req, res) => {
  req.query.historial = 'true'; // Forzar el parámetro historial a true
  signosVitalesController.getSignosVitalesByAdmision(req, res);
});
router.put('/:id', validarToken, signosVitalesController.updateSignosVitales);
router.delete('/:id', validarToken, signosVitalesController.deleteSignosVitales);

module.exports = router;