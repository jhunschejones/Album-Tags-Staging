const Sequelize = require('sequelize');
const sequelize = require('../sequelize.js');
const Song = require('./album_song.model.js');
const Genre = require('./album_apple_genre.model.js');
const Favorite = require('./album_favorite.model.js');
const Tag = require('./album_tag.model.js');
const Connection = require('./album_connection.model.js');
const List = require('./list_info.model.js');

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
Album.hasMany(Favorite, {foreignKey: 'appleAlbumID', sourceKey: 'appleAlbumID'}, { onDelete: 'cascade', hooks:true });
Album.hasMany(Connection, {foreignKey: 'albumOne', sourceKey: 'appleAlbumID'}, { onDelete: 'cascade', hooks:true });
Song.belongsTo(Album, {foreignKey: 'appleAlbumID', targetKey: 'appleAlbumID'});
Genre.belongsTo(Album, {foreignKey: 'appleAlbumID', targetKey: 'appleAlbumID'});
Favorite.belongsTo(Album, {foreignKey: 'appleAlbumID', targetKey: 'appleAlbumID'});
Connection.belongsTo(Album, {foreignKey: 'albumOne', targetKey: 'appleAlbumID'});

Album.belongsToMany(Tag, { through: 'albumTags' });
Tag.belongsToMany(Album, { through: 'albumTags' });

List.belongsToMany(Album, { through: 'albumLists', foreignKey: 'appleAlbumID' });
Album.belongsToMany(List, { through: 'albumLists', foreignKey: 'id' });

sequelize.sync();

module.exports = Album;