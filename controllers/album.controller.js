const Sequelize = require('sequelize');
const sequelize = require('../sequelize.js');
const Op = Sequelize.Op;
const Album = require('../models/album_info.model.js');
const Song = require('../models/album_song.model.js');
const Genre = require('../models/album_apple_genre.model.js');
const Favorite = require('../models/album_favorite.model.js');
const Tag = require('../models/album_tag.model.js');

// need to define `_this` so I can use it to re-use functions 
// within this controller
const _this = this;

exports.add_new_album = async function (req, res, next) {
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
          order: index + 1,
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

      if (res) { res.send("Album added!"); }
      else { return(newAlbum); }
    })
    .catch(async function(err) {
      if (res) {
        if (err.errors[0].message === "appleAlbumID must be unique") return res.status(409).json({ "message" : `An album with Apple Album ID '${req.body.appleAlbumID}' already exists.` });
        if (err.name === "SequelizeValidationError") return res.status(400).send(err);
        res.status(500).json(err);
      }
    });
};

exports.get_album = function (req, res, next) {
  Album.findOne({
    where: {
      appleAlbumID: req.params.appleAlbumID
    },
    include: [ Song, Genre, Tag ] // LEFT JOIN's with these tables
  })
    .then(function(album) {
      if (!album) return res.status(404).send({ "message" : `No album found with Apple Album ID: '${req.params.appleAlbumID}'` });

      // clean up song and genre formatting
      let songs = [];
      let appleGenres = [];
      album.songs.forEach(song => { songs[song.order - 1] = song.name; });
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
        genres: appleGenres,
        tags: album.tags
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

exports.add_favorite = function (req, res, next) {
  Album.findOne({
    where: {
      appleAlbumID: req.body.appleAlbumID
    }
  }).then(async function(album) {
    if (!album) {
      await _this.add_new_album(req);
    }
    Favorite.findOrCreate({
      where: {
        userID: req.body.userID,
        appleAlbumID: req.body.appleAlbumID
      }
    }).then(function(result) {
      res.send("Favorite added!")
    }).catch(function(err) {
      res.status(500).json(err);
    });
  });
};

exports.get_user_favorites = function (req, res, next) {
  Favorite.findAll({
    where: {
      userID: req.params.userID
    },
    include: [ Album ]
  }).then(function(albums) {
    if (albums.length < 1) return res.status(404).send({ "message" : `User '${req.params.userID}' does not have any favorited records. `})
    res.send(albums)
  }).catch(function(err) {
    res.status(500).json(err);
  });
};

exports.delete_favorite = function (req, res, next) {
  Favorite.destroy({
    where: {
      userID: req.body.userID,
      appleAlbumID: req.body.appleAlbumID
    }
  })
    .then(function(albumsDeleted) {
      if (albumsDeleted === 0) return res.status(404).send({ "message" : `User '${req.body.userID}' has not favorited album '${req.body.appleAlbumID}'` });
      res.send("User favorite deleted!");
    }).catch(function(err) {
      res.status(500).json(err);
    });
};

exports.add_tag = function (req, res, next) {
  Tag.findOrCreate({
    where: {
      text: req.body.text,
      creator: req.body.userID,
      isGenre: req.body.isGenre,
      appleAlbumID: req.body.appleAlbumID
    }
  }).then(function(tag) {
    Album.findOrCreate({
      where: {
        appleAlbumID: req.body.appleAlbumID,
        appleURL: req.body.appleURL,
        title: req.body.title,
        artist: req.body.artist,
        releaseDate: req.body.releaseDate,
        recordCompany: req.body.recordCompany,
        cover: req.body.cover
      }
    }).then(function(album){
      album[0].addTag(tag[0])
      .then(function(albumTag) {
        res.send(albumTag)
      })
    })
  }).catch(function(err) {
    res.status(500).json(err)
  })
};

exports.find_by_tags = function (req, res, next) {
  const searchedTags = req.params.tags.split(',');

  Album.findAll({
    include: [{
      model: Tag,
      through: { 
        attributes: [],
      },
      where: { 
        // currently just returns all albums with any of the
        // user search tags
        text: {
          [Op.in]: searchedTags
        }
      }
    }]
  }).then(function(albums) {
    res.send(albums);
  }).catch(function(err) {
    res.status(500).json(err);
  })
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