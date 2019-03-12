const Sequelize = require('sequelize');
const sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'sqlite',
  storage: 'data/db/dev.sqlite',
  operatorsAliases: false,
  logging: false
});

module.exports = sequelize;