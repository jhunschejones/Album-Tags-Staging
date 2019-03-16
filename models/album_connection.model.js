const Sequelize = require('sequelize');
const sequelize = require('../sequelize.js');

const Connection = sequelize.define('connection', {
  albumOne: { type: Sequelize.INTEGER, allowNull: false },
  albumTwo: { type: Sequelize.INTEGER, allowNull: false },
  creator: { type: Sequelize.STRING, allowNull: false }
});

sequelize.sync();

module.exports = Connection;