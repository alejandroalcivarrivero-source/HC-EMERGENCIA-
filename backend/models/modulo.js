const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Modulo = sequelize.define('Modulo', {
    modulo_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre_modulo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    descripcion: {
        type: DataTypes.TEXT,
    },
}, {
    tableName: 'modulos',
    timestamps: false,
});

module.exports = Modulo;