const Sequelize = require('sequelize');
const sequelize = require('../sequelize.js');
const Song = require('./album_song.model.js');
const Genre = require('./album_apple_genre.model.js');

const Album = sequelize.define('album', {
  appleAlbumID: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
  appleURL: { type: Sequelize.STRING, allowNull: false },
  title: { type: Sequelize.STRING, allowNull: false },
  artist: { type: Sequelize.STRING, allowNull: false },
  releaseDate: { type: Sequelize.STRING, allowNull: false },
  recordCompany: { type: Sequelize.STRING, allowNull: false },
  cover: { type: Sequelize.STRING, allowNull: false }
});

Album.hasMany(Song, {foreignKey: 'appleAlbumID', sourceKey: 'appleAlbumID'}, { onDelete: 'cascade', hooks:true });
Album.hasMany(Genre, {foreignKey: 'appleAlbumID', sourceKey: 'appleAlbumID'}, { onDelete: 'cascade', hooks:true });
Song.belongsTo(Album, {foreignKey: 'appleAlbumID', targetKey: 'appleAlbumID'});
Genre.belongsTo(Album, {foreignKey: 'appleAlbumID', targetKey: 'appleAlbumID'});

sequelize.sync();

module.exports = Album;