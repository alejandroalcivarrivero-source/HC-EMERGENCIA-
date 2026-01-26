const express = require('express');
const router = express.Router();
const multer = require('multer');
const firmaElectronicaController = require('../controllers/firmaElectronicaController');
const validarToken = require('../middlewares/validarToken');

// Configurar multer para recibir archivos .p12 en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Aceptar archivos .p12 o .pfx
    if (file.mimetype === 'application/x-pkcs12' || 
        file.originalname.endsWith('.p12') || 
        file.originalname.endsWith('.pfx')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .p12 o .pfx'));
    }
  }
});

// Firmar atención (requiere archivo .p12 y contraseña)
router.post('/firmar/:atencionId', 
  validarToken, 
  upload.single('certificado'),
  firmaElectronicaController.firmarAtencion
);

// Obtener PDF preview del formulario
router.get('/preview/:atencionId', validarToken, firmaElectronicaController.getPDFPreview);

module.exports = router;
