const Sequelize = require('sequelize');
const sequelize = require('../sequelize.js');

const Favorite = sequelize.define('favorite', {
  userID: { type: Sequelize.STRING, allowNull: false },
  appleAlbumID: { type: Sequelize.INTEGER, allowNull: false }
});

sequelize.sync();

module.exports = Favorite;