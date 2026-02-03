const express = require('express');
const router = express.Router();
const referenciaController = require('../controllers/referenciaController');
const validarToken = require('../middlewares/validarToken');

router.post('/', validarToken, referenciaController.createReferencia);
router.get('/admision/:admisionId', validarToken, referenciaController.getReferenciasByAdmision);
router.put('/:id', validarToken, referenciaController.updateReferencia);
router.delete('/:id', validarToken, referenciaController.deleteReferencia);

module.exports = router;
