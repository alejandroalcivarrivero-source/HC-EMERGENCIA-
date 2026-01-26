const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');

// Endpoint temporal para verificar el nombre real de la tabla
router.get('/verificar-tablas-atencion', async (req, res) => {
  try {
    // Primero, listar todas las tablas que contengan "atencion" o "emergencia"
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND (TABLE_NAME LIKE '%atencion%' OR TABLE_NAME LIKE '%emergencia%' OR TABLE_NAME LIKE '%ATENCION%' OR TABLE_NAME LIKE '%EMERGENCIA%')
      ORDER BY TABLE_NAME
    `);
    
    res.json({
      success: true,
      tables: tables,
      message: 'Tablas encontradas que contienen "atencion" o "emergencia"'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Endpoint temporal para verificar la estructura de una tabla específica
router.get('/verificar-tabla/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, {
      replacements: [tableName]
    });
    
    res.json({
      success: true,
      tableName: tableName,
      columns: results,
      message: `Estructura de la tabla ${tableName}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
