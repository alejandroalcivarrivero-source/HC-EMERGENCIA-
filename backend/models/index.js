'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const sequelize = require('../config/database');
const db = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const modelDefinition = require(path.join(__dirname, file));
    // A more robust check for Sequelize models
    if (modelDefinition && modelDefinition.prototype instanceof Sequelize.Model) {
      // Old format: it's already a model
      // console.log(`Loading model (instance): ${file}`);
      db[modelDefinition.name] = modelDefinition;
    } else if (typeof modelDefinition === 'function') {
      // New format: it's a function that returns a model
      const model = modelDefinition(sequelize, Sequelize.DataTypes);
      if (model && model.name) {
        // console.log(`Loading model (factory): ${file} -> ${model.name}`);
        db[model.name] = model;
      } else {
        console.log(`Skipping file (invalid factory return): ${file}`);
      }
    } else if (modelDefinition && modelDefinition.name) {
       // Support for defined models exported directly
       // console.log(`Loading model (direct): ${file} -> ${modelDefinition.name}`);
       db[modelDefinition.name] = modelDefinition;
    } else {
      console.log(`Skipping file (unknown format): ${file}`);
    }
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Inicializar asociaciones globales si el archivo existe
try {
  const { initAssociations } = require('./init-associations');
  if (typeof initAssociations === 'function') {
    initAssociations();
  }
} catch (error) {
  console.error('Error al inicializar asociaciones globales:', error.message);
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
