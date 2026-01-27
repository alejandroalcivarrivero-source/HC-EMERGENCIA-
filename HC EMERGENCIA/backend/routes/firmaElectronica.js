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

// Firmar atención con archivo .p12 (método ARCHIVO)
router.post('/firmar/:atencionId', 
  validarToken, 
  upload.single('certificado'),
  firmaElectronicaController.firmarAtencion
);

// Preparar documento para firma con token USB (método TOKEN)
router.post('/preparar/:atencionId', 
  validarToken,
  firmaElectronicaController.prepararDocumentoFirma
);

// Callback para recibir firma del agente externo (token USB)
router.post('/token/callback/:atencionId',
  validarToken,
  firmaElectronicaController.callbackFirmaToken
);

// Verificar estado de solicitud de firma
router.get('/token/estado/:solicitudToken',
  validarToken,
  firmaElectronicaController.verificarEstadoFirma
);

// Obtener PDF preview del formulario
router.get('/preview/:atencionId', validarToken, firmaElectronicaController.getPDFPreview);

module.exports = router;
