const sequelize = require('../sequelize.js');
const Album = require('../models/album_info.model.js');
const Song = require('../models/album_song.model.js');
const Genre = require('../models/album_apple_genre.model.js');

exports.add_new_album = function (req, res, next) {
  const newAlbum = {
    appleAlbumID: req.body.appleAlbumID,
    appleURL: req.body.appleURL,
    title: req.body.title,
    artist: req.body.artist,
    releaseDate: req.body.releaseDate,
    recordCompany: req.body.recordCompany,
    cover: req.body.cover
  };

  Album.create(newAlbum)
    .then(async function() {
      for (let index = 0; index < req.body.songNames.length; index++) {
        const song = req.body.songNames[index];
        await Song.create({
          name: song,
          appleAlbumID: req.body.appleAlbumID
        });
      }
      for (let index = 0; index < req.body.genres.length; index++) {
        const genre = req.body.genres[index];
        await Genre.create({
          genre: genre,
          appleAlbumID: req.body.appleAlbumID
        });
      }

      res.send("Album added!");
    })
    .catch(function(err) {
      if (err.errors[0].message === "appleAlbumID must be unique") return res.status(409).json({ "message" : `An album with Apple Album ID '${req.body.appleAlbumID}' already exists.` });
      if (err.name === "SequelizeValidationError") return res.status(400).send(err);
      res.status(500).json(err);
    });
};

exports.get_album = function (req, res, next) {
  Album.findOne({
    where: {
      appleAlbumID: req.params.appleAlbumID
    },
    include: [ Song, Genre ] // LEFT JOIN's with these tables
  })
    .then(function(album) {
      if (!album) return res.status(404).send({ "message" : `No album found with Apple Album ID: '${req.params.appleAlbumID}'` });

      // clean up song and genre formatting
      let songs = [];
      let appleGenres = [];
      album.songs.forEach(song => { songs.push(song.name); });
      album.appleGenres.forEach(appleGenre => { appleGenres.push(appleGenre.genre) });

      res.send({
        appleAlbumID: album.appleAlbumID,
        appleURL: album.appleURL,
        title: album.title,
        artist: album.artist,
        releaseDate: album.releaseDate,
        recordCompany: album.recordCompany,
        cover: album.cover,
        songNames: songs,
        genres: appleGenres
      });
    }).catch(function(err) {
      res.status(500).json(err);
    });
};

exports.delete_album = function (req, res, next) {
  Album.destroy({
    where: {
      appleAlbumID: req.params.appleAlbumID
    }
  })
    .then(function(albumsDeleted) {
      if (albumsDeleted === 0) return res.status(404).send({ "message" : `No album found with Apple Album ID: '${req.params.appleAlbumID}'` });
      res.send("Album deleted!");
    }).catch(function(err) {
      res.status(500).json(err);
    });
};

// temporary utility to drop all tables quickly from postman
exports.reset_database = function (req, res, next) {
  sequelize.drop()
    .then(function(tablesDropped) {
      res.send(`${tablesDropped.length} dev tables dropped.`);
    }).catch(function(err) {
      res.status(500).json(err);
    });
};
