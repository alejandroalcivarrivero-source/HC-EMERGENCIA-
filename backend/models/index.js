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
    console.log(`Loading model: ${file}`);
    const modelDefinition = require(path.join(__dirname, file));
    // A more robust check for Sequelize models
    if (modelDefinition && modelDefinition.prototype instanceof Sequelize.Model) {
      // Old format: it's already a model
      db[modelDefinition.name] = modelDefinition;
    } else if (typeof modelDefinition === 'function') {
      // New format: it's a function that returns a model
      const model = modelDefinition(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    } else {
      console.log(`Skipping file: ${file}`);
    }
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
