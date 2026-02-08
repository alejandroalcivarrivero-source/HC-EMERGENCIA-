'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UsuarioModulo extends Model {
    static associate(models) {
      UsuarioModulo.belongsTo(models.Usuario, { as: 'Usuario', foreignKey: 'usuarioId' });
      UsuarioModulo.belongsTo(models.Modulo, { as: 'Modulo', foreignKey: 'moduloId' });
    }
  }

  UsuarioModulo.init({
    usuarioModuloId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'usuario_modulo_id'
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'usuario_id'
    },
    moduloId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'modulo_id'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'UsuarioModulo',
    tableName: 'USUARIO_MODULOS',
    timestamps: false
  });

  return UsuarioModulo;
};