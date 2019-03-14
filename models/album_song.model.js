const Sequelize = require('sequelize');
const sequelize = require('../sequelize.js');

const Song = sequelize.define('song', {
  name: { type: Sequelize.STRING, allowNull: false },
  order: { type: Sequelize.INTEGER, allowNull: false },
  appleAlbumID: { type: Sequelize.INTEGER, allowNull: false }
});

sequelize.sync();

module.exports = Song;