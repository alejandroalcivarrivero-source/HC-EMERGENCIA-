const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  `${process.env.DB_DIALECT}://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  {
    dialect: 'mariadb',
    logging: false,
    freezeTableName: true, // Evita la pluralización automática de nombres de tablas
    pool: {
      acquire: 30000
    }
  }
);

module.exports = sequelize;
