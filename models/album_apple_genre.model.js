const Sequelize = require('sequelize');
const sequelize = require('../sequelize.js');

const AppleGenre = sequelize.define('appleGenre', {
  genre: { type: Sequelize.STRING, allowNull: false },
  appleAlbumID: { type: Sequelize.INTEGER, allowNull: false }
});

sequelize.sync();

module.exports = AppleGenre;