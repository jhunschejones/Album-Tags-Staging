const Sequelize = require('sequelize');
const sequelize = require('../sequelize.js');
const Op = Sequelize.Op;
const Album = require('../models/album_info.model.js');
const Song = require('../models/album_song.model.js');
const Genre = require('../models/album_apple_genre.model.js');
const Favorite = require('../models/album_favorite.model.js');
const Tag = require('../models/album_tag.model.js');
const Connection = require('../models/album_connection.model.js');
const List = require('../models/list_info.model.js');

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
        if (err.errors[0].message === "appleAlbumID must be unique") return res.status(409).send({ "message" : `An album with Apple Album ID '${req.body.appleAlbumID}' already exists.` });
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
      album.dataValues.songNames = songs;
      album.dataValues.genres = appleGenres;
      delete album.dataValues.songs;
      delete album.dataValues.appleGenres;

      res.send(album);
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
      res.send("Favorite added!");
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
    if (albums.length < 1) return res.status(404).send({ "message" : `User '${req.params.userID}' does not have any favorited records.`});
    res.send(albums);
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
    }).then(async function(album){
      if (album[0]._options.isNewRecord) {
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
      }
      // bluebird thinks I should be returning something from this promise
      album[0].addTag(tag[0])
      .then(function(albumTag) {
        if (albumTag.length < 1) return res.send({ "message": "This tag already exists." });
        res.send(albumTag);
      });
    });
  }).catch(function(err) {
    res.status(500).json(err);
  });
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
        // currently returns all albums with ANY of the searched tags
        text: {
          [Op.in]: searchedTags
        }
      }
    }]
  }).then(function(albums) {
    // filters albums down to results that only have ALL the searched tags
    let results = [];
    for (let i = 0; i < albums.length; i++) {
      const album = albums[i];
      let tags = [];
      for (let j = 0; j < album.tags.length; j++) {
        const tag = album.tags[j];
        tags.push(tag.dataValues.text);
      }
      if (searchedTags.every(function(tag) { return tags.indexOf(tag) !== -1; })) {
        results.push(album);
      }
    }
    if (results.length < 1) return res.status(404).send({ "message": "No albums match this combination of tags." });
    res.send(results);
  }).catch(function(err) {
    res.status(500).json(err);
  });
};

exports.delete_tag = function (req, res, next) {
  Tag.findOne({
    where: {
      text: req.body.text,
      creator: req.body.userID,
      appleAlbumID: req.body.appleAlbumID
    }
  }).then(function(tag) {
    Album.findOne({
      where: {
        appleAlbumID: req.body.appleAlbumID
      }
    }).then(function(album){
      // bluebird thinks I should be returning something from this promise
      album.removeTag(tag)
      .then(function(albumTag) {
        // this check is currently not being hit when a delete request is sent for a non-existent
        if (albumTag.length < 1) return res.status(404).send({ "message": "This tag does not exist." });
        res.send(albumTag);
      }).catch(function(err) {
        // this catch is hit if a delete request is sent for a non-existent tag (instead of the check above)
        res.status(404).send({ "message": "This tag does not exist." });
      });
    });
  }).catch(function(err) {
    res.status(500).json(err);
  });
};

exports.add_connection = function (req, res, next) {
  const albumOne = req.body.albumOne;
  const albumTwo = req.body.albumTwo;
  Album.findOrCreate({
    where: {
      appleAlbumID: albumOne.appleAlbumID,
      appleURL: albumOne.appleURL,
      title: albumOne.title,
      artist: albumOne.artist,
      releaseDate: albumOne.releaseDate,
      recordCompany: albumOne.recordCompany,
      cover: albumOne.cover
    }
  }).then(async function(firstAlbum){
    if (firstAlbum[0]._options.isNewRecord) {
      for (let index = 0; index < albumOne.songNames.length; index++) {
        const song = albumOne.songNames[index];
        await Song.create({
          name: song,
          order: index + 1,
          appleAlbumID: albumOne.appleAlbumID
        });
      }
      for (let index = 0; index < albumOne.genres.length; index++) {
        const genre = albumOne.genres[index];
        await Genre.create({
          genre: genre,
          appleAlbumID: albumOne.appleAlbumID
        });
      }
    }
    Album.findOrCreate({
      where: {
        appleAlbumID: albumTwo.appleAlbumID,
        appleURL: albumTwo.appleURL,
        title: albumTwo.title,
        artist: albumTwo.artist,
        releaseDate: albumTwo.releaseDate,
        recordCompany: albumTwo.recordCompany,
        cover: albumTwo.cover
      }
    }).then(async function(seccondAlbum){
      if (seccondAlbum[0]._options.isNewRecord) {
        for (let index = 0; index < albumTwo.songNames.length; index++) {
          const song = albumTwo.songNames[index];
          await Song.create({
            name: song,
            order: index + 1,
            appleAlbumID: albumTwo.appleAlbumID
          });
        }
        for (let index = 0; index < albumTwo.genres.length; index++) {
          const genre = albumTwo.genres[index];
          await Genre.create({
            genre: genre,
            appleAlbumID: albumTwo.appleAlbumID
          });
        }
      }
      Connection.findOrCreate({
        where: {
          albumOne: albumOne.appleAlbumID,
          albumTwo: albumTwo.appleAlbumID,
          creator: req.body.userID
        }
      }).then(function(connectionOne) {
        Connection.findOrCreate({
          where: {
            albumOne: albumTwo.appleAlbumID,
            albumTwo: albumOne.appleAlbumID,
            creator: req.body.userID
          }
        }).then(function(connectionTwo){
          res.send({ "one": connectionOne[0], "two": connectionTwo[0] });
        })
      })
    });
  });
};

exports.get_connections = function (req, res, next) {
  Album.findOne({
    where: {
      appleAlbumID: req.params.appleAlbumID
    },
    include: [{
      model: Connection,
      attributes: [ "creator", "albumTwo" ],
      where: { 
        albumOne: req.params.appleAlbumID
      }
    }]
  }).then(async function(album) {
    if (!album) return res.status(404).send({ "message" : "This user has not created a connection between these two albums." });

    let connectedAlbums = [];
    for (let i = 0; i < album.dataValues.connections.length; i++) {
      const conection = album.dataValues.connections[i];
      const connectedAlbum = await Album.findOne({ where: { appleAlbumID: conection.dataValues.albumTwo }, attributes: [ "appleAlbumID", "title", "artist", "cover" ] });
      connectedAlbum.dataValues.creator = conection.dataValues.creator;
      connectedAlbums.push(connectedAlbum);
    }
    res.send(connectedAlbums);
  }).catch(function(err){
    res.status(500).json(err);
  })
};

exports.delete_connection = function (req, res, next) {
  Connection.destroy({
    where: {
      albumOne: req.body.albumOne.appleAlbumID,
      creator: req.body.userID
    }
  }).then(function(deletedConnectionOne) {
    Connection.destroy({
      where: {
        albumTwo: req.body.albumOne.appleAlbumID,
        creator: req.body.userID
      }
    }).then(function(deletedConnectionTwo) {
      res.send(`${deletedConnectionOne + deletedConnectionTwo} connections deleted.`);
    }).catch(function(err) {
      res.status(500).json(err);
    });
  });
};

exports.create_new_list = function (req, res, next) {
  List.findOrCreate({
    where: {
      user: req.body.userID,
      displayName: req.body.displayName,
      title: req.body.title,
      isPrivate: req.body.isPrivate
    }
  }).then(function(list) {
    res.send(list);
  }).catch(function(err) {
    res.status(500).json(err);
  });
};

exports.update_list = function (req, res, next) {
  if (req.body.method === "add album") {
    List.findOne({
      where: {
        id: req.params.list
      }
    }).then(function(list) {
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
      }).then(async function(album){
        if (album[0]._options.isNewRecord) {
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
        }

        list.addAlbum(album[0])
        .then(function(listAlbum) {
          if (listAlbum.length < 1) return res.send({ "message" : "This album is already in this list."});
          res.send(listAlbum);
        }).catch(function(err) {
          res.status(500).json(err);
        })
      }).catch(function(err) {
        res.status(500).json(err);
      });
    });
  } else if (req.body.method === "remove album") {
    if (!req.body.appleAlbumID) return res.status(400).send({ "message" : "Unable to remove album, `appleAlbumID` is a required field." });
    List.findOne({
      where: {
        id: req.params.list
      }
    }).then(function(list) {
      Album.findOne({
        where: {
          appleAlbumID: req.body.appleAlbumID
        }
      }).then(function(album){
        // Bluebird wants me to be resolving this promise
        list.removeAlbum(album)
        .then(function(removedAlbums) {
          res.send({ "message": `${removedAlbums} albums remove from the list.` });
        }).catch(function(err) {
          res.status(500).json(err);
        })
      }).catch(function(err) {
        res.status(500).json(err);
      });
    });
  } else if (req.body.method === "change title") {
    if (!req.body.title) return res.status(400).send({ "message" : "Unable to update, `title` is a required field." });
    List.findOne({
      where: {
        id: req.params.list
      }
    }).then(function(list) {
      list.title = req.body.title;
      list.save({ fields: ['title'] }).then(function (list) {
        res.send(list);
      }).catch(function(err) {
        res.status(500).json(err);
      })
    })
  } else if (req.body.method === "change display name") {
    if (!req.body.displayName) return res.status(400).send({ "message" : "Unable to update, `displayName` is a required field." });
    List.findOne({
      where: {
        id: req.params.list
      }
    }).then(function(list) {
      list.displayName = req.body.displayName;
      list.save({ fields: ['displayName'] }).then(function (list) {
        res.send(list);
      }).catch(function(err) {
        res.status(500).json(err);
      })
    })
  }
};

exports.get_list = function (req, res, next) {
  List.findOne({
    where: {
      id: req.params.list
    },
    include: [ Album ]
  }).then(function(list) {
    res.send(list);
  }).catch(function(err) {
    res.status(500).json(err);
  });
};

exports.delete_list = function (req, res, next) {
  List.destroy({
    where: {
      id: req.params.list
    }
  }).then(function(listsDeleted) {
    if (listsDeleted === 1) return res.send("List deleted!");
    if (listsDeleted === 0) return res.status(404).send({ "message" : `Unable to find list with id '${req.params.list}'` });
    res.send({ "message": `${listsDeleted} lists were deleted remove from the list.` });
  }).catch(function(err) {
    res.status(500).json(err);
  });
};

exports.get_user_lists = function (req, res, next) {
  List.findAll({
    where: {
      user: req.params.userID
    },
    include: [ Album ]
  }).then(function(lists) {
    if (lists.length < 1) return res.status(404).send({ "message" : "This user has not created any lists." });
    res.send(lists);
  }).catch(function(err) {
    res.status(500).json(err);
  });
};

exports.get_album_lists = function (req, res, next) {
  List.findAll({
    include: [{
      model: Album,
      where: { 
        appleAlbumID: req.params.appleAlbumID
      }
    }]
  }).then(function(lists) {
    if (lists.length < 1) return res.status(404).send({ "message" : "This album is not in any lists." });
    res.send(lists);
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