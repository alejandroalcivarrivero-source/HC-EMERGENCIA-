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

// Firmar atención (requiere archivo .p12 y contraseña) — flujo legado
router.post('/firmar/:atencionId', 
  validarToken, 
  upload.single('certificado'),
  firmaElectronicaController.firmarAtencion
);

// Obtener PDF preview del formulario
router.get('/preview/:atencionId', validarToken, firmaElectronicaController.getPDFPreview);

// ——— Certificado en perfil (Ajustes > Firma Electrónica) ———
// Validar .p12 y obtener metadatos (sin guardar; para mostrar antes de guardar)
router.post('/validar-p12', validarToken, upload.single('certificado'), firmaElectronicaController.validarP12);
// Guardar .p12 cifrado AES-256 en BD (un certificado por usuario)
router.post('/guardar-certificado', validarToken, upload.single('certificado'), firmaElectronicaController.guardarCertificado);
// Información del certificado guardado (metadatos solo)
router.get('/certificado/info', validarToken, firmaElectronicaController.getCertificadoInfo);
// Firmar con certificado guardado (body: { password })
router.post('/firmar-con-certificado/:atencionId', validarToken, express.json(), firmaElectronicaController.firmarConCertificadoGuardado);

// Ruta para obtener PDF Preliminar
router.get('/preview-preliminar/:admisionId', validarToken, firmaElectronicaController.getPDFPreliminar);

module.exports = router;
