const Sequelize = require('sequelize');
const sequelize = require('../sequelize.js');

const List = sequelize.define('list', {
  user: { type: Sequelize.STRING, allowNull: false },
  displayName: { type: Sequelize.STRING, allowNull: false },
  title: { type: Sequelize.STRING, allowNull: false },
  isPrivate: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }
});

sequelize.sync();

module.exports = List;