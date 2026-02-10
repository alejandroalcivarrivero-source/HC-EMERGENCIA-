const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Define routes for KPIs/Stats
// Example routes - adjust according to actual controller methods
router.get('/kpis', statsController.getKPIs);
router.get('/produccion-diaria', statsController.getProduccionDiaria);
// Add more routes as needed, e.g., with authentication middleware

module.exports = router;