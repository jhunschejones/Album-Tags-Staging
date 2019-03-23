const Sequelize = require('sequelize');
const sequelize = require('../sequelize.js');

const Tag = sequelize.define('tag', {
  text: { type: Sequelize.STRING, allowNull: false },
  creator: { type: Sequelize.STRING, allowNull: false },
  customGenre: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }
});

sequelize.sync();

module.exports = Tag;