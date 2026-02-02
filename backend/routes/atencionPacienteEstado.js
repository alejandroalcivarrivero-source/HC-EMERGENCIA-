const express = require('express');
const router = express.Router();
const atencionPacienteEstadoController = require('../controllers/atencionPacienteEstadoController');
const validarToken = require('../middlewares/validarToken');

// Ruta para obtener la lista de pacientes en espera (estado 'SIGNOS_VITALES')
router.get('/estados-medico', validarToken, atencionPacienteEstadoController.getPacientesPorEstadoMedico);
// Ruta para obtener pacientes en estado 'SIGNOS_VITALES' (lista de espera)
router.get('/espera', validarToken, (req, res, next) => {
  req.query.estados = 'SIGNOS_VITALES,ESPERA_MEDICO'; // Cambiar de 'PREPARADO' a 'SIGNOS_VITALES' o 'ESPERA_MEDICO'
  atencionPacienteEstadoController.getPacientesPorEstadoMedico(req, res, next);
});

console.log('Registrando ruta PUT /:admisionId/asignar-medico');
router.put('/:admisionId/asignar-medico', validarToken, atencionPacienteEstadoController.asignarMedicoAPaciente);

// Ruta para actualizar el estado de atención de un paciente
router.put('/:admisionId/estado', validarToken, atencionPacienteEstadoController.actualizarEstadoAtencion);

// Ruta para obtener el estado de atención de un paciente por ID de admisión
router.get('/:admisionId', validarToken, atencionPacienteEstadoController.getAtencionPacienteEstado);

module.exports = router;