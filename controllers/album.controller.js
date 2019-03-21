const request = require('request');
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.ENCRYPT_KEY);
const Sequelize = require('sequelize');
const sequelize = require('../sequelize.js');
const Op = Sequelize.Op;
const Album = require('../models/album_info.model.js');
const Favorite = require('../models/album_favorite.model.js');
const Tag = require('../models/album_tag.model.js');
const Connection = require('../models/album_connection.model.js');
const List = require('../models/list_info.model.js');

// need to define `_this` so I can use it to re-use functions 
// within this controller
const _this = this;

function cleanAlbumData(album) {
  if (album.dataValues) {
    // clean up song name and apple genre formatting
    album.dataValues.songNames = album.dataValues.songNames.split(',,');
    album.dataValues.genres = album.dataValues.genres.split(',,');

    // rename tags key
    album.dataValues.tagObjects = album.dataValues.tags;
  } else {
    // clean up song name and apple genre formatting
    album.songNames = album.songNames.split(',,');
    album.genres = album.genres.split(',,');

    // rename tags key
    album.tagObjects = album.tags;
  }

  return album;
}

async function findAppleAlbumData(album) {
  const options = {
    url: req.protocol + '://' + req.get('host') + '/api/v1/apple/details/' + album,
    json: true  
  };

  return new Promise(function(resolve, reject) {
    request.get(options, function(err, resp, body) {
      if (err) {
        reject(err);
      } else if (body) {
        resolve(body);
      } else {
        resolve({ "message" : `unable to find an album with ID ${album}` });
      }
    })
  })
}

function createSongString(songs) {
  let songString = "";
  songs.forEach(song => {
    if (songs.indexOf(song) === songs.length - 1) {
      songString = songString + song;
    } else {
      songString = songString + song + ",,";
    }
  });
  return songString;
}

function createGenreString(genres) {
  let genreString = "";
  genres.forEach(genre => {
    if (genres.indexOf(genre) === genres.length -1) {
      genreString = genreString + genre;
    } else {
      genreString = genreString + genre + ",,";
    }
  });
  return genreString;
}

exports.add_new_album = async function (req, res, next) {
  const newAlbum = {
    appleAlbumID: req.body.appleAlbumID,
    appleURL: req.body.appleURL,
    title: req.body.title,
    artist: req.body.artist,
    releaseDate: req.body.releaseDate,
    recordCompany: req.body.recordCompany,
    cover: req.body.cover,
    songNames: createSongString(req.body.songNames),
    genres: createGenreString(req.body.genres)
  };

  Album.create(newAlbum)
    .then(function() {
      newAlbum = cleanAlbumData(newAlbum);
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
    include: [ Tag ] // LEFT JOIN's with these tables
  })
    .then(function(album) {
      if (!album) return res.send({ "message" : `No album found with Apple Album ID: '${req.params.appleAlbumID}'` });
      res.send(cleanAlbumData(album));
    }).catch(function(err) {
      console.log(err);
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
  Album.findOrCreate({
    where: {
      appleAlbumID: req.body.album.appleAlbumID,
      appleURL: req.body.album.appleURL,
      title: req.body.album.title,
      artist: req.body.album.artist,
      releaseDate: req.body.album.releaseDate,
      recordCompany: req.body.album.recordCompany,
      cover: req.body.album.cover
    }
  }).then(async function(album) {
    if (album[0]._options.isNewRecord) {
      let fullAlbum = await findAppleAlbumData(req.body.album.appleAlbumID);
      await album[0].update({
        songNames: createSongString(fullAlbum.songNames),
        genres: createGenreString(fullAlbum.genres)
      })
    }
    Favorite.findOrCreate({
      where: {
        userID: req.body.user,
        appleAlbumID: req.body.album.appleAlbumID
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
    if (albums.length < 1) return res.send(albums);

    let cleanAlbums = [];
    albums.forEach(album => {
      cleanAlbums.push(cleanAlbumData(album.dataValues.album));
    });
    res.send(cleanAlbums);
  }).catch(function(err) {
    console.log(err)
    res.status(500).json(err);
  });
};

exports.delete_favorite = function (req, res, next) {
  Favorite.destroy({
    where: {
      userID: req.body.user,
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

exports.add_tag = async function (req, res, next) {
  Tag.findOrCreate({
    where: {
      text: req.body.tag,
      creator: req.body.creator,
      customGenre: req.body.customGenre,
      appleAlbumID: req.body.album.appleAlbumID
    }
  }).then(async function(tag) {
    Album.findOrCreate({
      where: {
        appleAlbumID: req.body.album.appleAlbumID,
        appleURL: req.body.album.appleURL,
        title: req.body.album.title,
        artist: req.body.album.artist,
        releaseDate: req.body.album.releaseDate,
        recordCompany: req.body.album.recordCompany,
        cover: req.body.album.cover
      }
    }).then(async function(album){
      if (album[0]._options.isNewRecord) {
        await album[0].update({
          songNames: createSongString(req.body.album.songNames),
          genres: createGenreString(req.body.album.genres)
        })
      }
      album[0].addTag(tag[0])
      .then(function(albumTag) {
        if (albumTag.length < 1) return res.send({ "message": "This tag already exists." });
        
        Album.findOne({
          where: {
            appleAlbumID: req.body.album.appleAlbumID
          },
          include: [ Tag ]
        }).then(function(updatedAlbum) {
          res.send(cleanAlbumData(updatedAlbum));
        })
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
    if (results.length < 1) return res.send({ "message": "No albums match this combination of tags." });
    res.send(results);
  }).catch(function(err) {
    res.status(500).json(err);
  });
};

exports.get_all_tags = function(req, res, next) {
  Tag.findAll({}).then(function(tags) {
    let justTags = [];
    tags.forEach(tag => {
      if (justTags.indexOf(tag) === -1) { justTags.push(tag.text); }
    });
    res.send(justTags);
  }).catch(function(err) {
    res.status(500).json(err);
  });
};

exports.delete_tag = async function (req, res, next) {
  Tag.findOne({
    where: {
      text: req.body.text,
      creator: req.body.creator,
      appleAlbumID: req.body.appleAlbumID
    }
  }).then(async function(tag) {
    Album.findOne({
      where: {
        appleAlbumID: req.body.appleAlbumID
      }
    }).then(async function(album){
      // remove the record from `albumTags`
      album.removeTag(tag)
      .then(async function(albumTag) {
        // this check is currently not being hit when a delete request is sent for a non-existent
        if (albumTag.length < 1) return res.status(404).send({ "message": "This tag does not exist." });
        // remove the record from `tags` table
        Tag.destroy({
          where: {
            text: req.body.text,
            creator: req.body.creator,
            appleAlbumID: req.body.appleAlbumID
          }
        }).then(async function() {
          Album.findOne({
            where: {
              appleAlbumID: req.body.appleAlbumID
            },
            include: [ Tag ]
          }).then(async function(updatedAlbum) {
            res.send(cleanAlbumData(updatedAlbum));
          })
        }).catch(function(err) {
          // this catch is hit if a delete request is sent for a non-existent tag (instead of the check above)
          // res.status(404).send({ "message": "This tag does not exist." });
          res.status(500).json(err);
        });
      });
    });
  }).catch(function(err) {
    res.status(500).json(err);
  });
};

exports.add_connection = function (req, res, next) {
  let albumOne = req.body.albumOne;
  let albumTwo = req.body.albumTwo;
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
      await firstAlbum[0].update({
        songNames: createSongString(albumOne.songNames),
        genres: createGenreString(albumOne.genres)
      })
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
        albumTwo = await findAppleAlbumData(albumTwo.appleAlbumID);
        await seccondAlbum[0].update({
          songNames: createSongString(albumTwo.songNames),
          genres: createGenreString(albumTwo.genres)
        })
      }
      Connection.findOrCreate({
        where: {
          albumOne: albumOne.appleAlbumID,
          albumTwo: albumTwo.appleAlbumID,
          creator: req.body.creator
        }
      }).then(function(connectionOne) {
        Connection.findOrCreate({
          where: {
            albumOne: albumTwo.appleAlbumID,
            albumTwo: albumOne.appleAlbumID,
            creator: req.body.creator
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
    if (!album) return res.send({ "message" : "This user has not created any connections for this album." });

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
  console.log(JSON.stringify(req.body))
  Connection.destroy({
    where: {
      albumOne: req.body.albumOne,
      albumTwo: req.body.albumTwo,
      creator: req.body.creator
    }
  }).then(function(deletedConnectionOne) {
    Connection.destroy({
      where: {
        albumOne: req.body.albumTwo,
        albumTwo: req.body.albumOne,
        creator: req.body.creator
      }
    }).then(function(deletedConnectionTwo) {
      res.send(`${deletedConnectionOne + deletedConnectionTwo} connections deleted.`);
    }).catch(function(err) {
      res.status(500).json(err);
    });
  });
};

exports.create_new_list = async function (req, res, next) {
  List.findOrCreate({
    where: {
      user: req.body.user,
      displayName: req.body.displayName,
      title: req.body.title,
      isPrivate: req.body.isPrivate
    }
  }).then(async function(list) {
    if (!req.body.albums || req.body.albums.length === 0) return res.send(list);
    Album.findOrCreate({
      where: {
        appleAlbumID: req.body.albums[0].appleAlbumID,
        appleURL: req.body.albums[0].appleURL,
        title: req.body.albums[0].title,
        artist: req.body.albums[0].artist,
        releaseDate: req.body.albums[0].releaseDate,
        recordCompany: req.body.albums[0].recordCompany,
        cover: req.body.albums[0].cover
      }
    }).then(async function(album){
      if (album[0]._options.isNewRecord) {
        await album[0].update({
          songNames: createSongString(req.body.albums[0].songNames),
          genres: createGenreString(req.body.albums[0].genres)
        })
      }
      list[0].addAlbum(album[0])
      .then(function(listAlbum) {
        if (listAlbum.length < 1) return res.send({ "message" : "This album is already in this list."});
        res.send(list[0]);
      }).catch(function(err) {
        console.log(err)
        res.status(500).json(err);
      })
    })
  }).catch(function(err) {
    console.log(err)
    res.status(500).json(err);
  });
};

exports.update_list = async function (req, res, next) {
  if (req.body.method === "add album") {
    List.findOne({
      where: {
        id: req.params.list
      }
    }).then(async function(list) {
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
          let fullAlbum = await findAppleAlbumData(req.body.appleAlbumID);
          await album[0].update({
            songNames: createSongString(fullAlbum.songNames),
            genres: createGenreString(fullAlbum.genres)
          })
        }

        list.addAlbum(album[0])
        .then(function(listAlbum) {
          if (listAlbum.length < 1) return res.send({ "message" : "This album is already in this list."});
          res.send(list);
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
    }).then(async function(list) {
      Album.findOne({
        where: {
          appleAlbumID: req.body.appleAlbumID
        }
      }).then(async function(album){
        list.removeAlbum(album)
        .then(function(removedAlbums) {
          res.send({ "message": `${removedAlbums} albums removed from the list.` });
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
    if (lists.length < 1) return res.send({ "message" : "This user has not created any lists." });
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
    if (lists.length < 1) return res.send({ "message" : "This album is not in any lists." });
    res.send(lists);
  }).catch(function(err) {
    res.status(500).json(err);
  });
};

exports.create_virtual_favorites_list = function (req, res, next) {
  res.send(cryptr.encrypt(`${req.params.id.trim()}\s\s\s${req.body.displayName.trim()}`));
};

exports.get_virtual_favorites_list = function (req, res, next) {
  const requestArray = cryptr.decrypt(req.params.id).split("\s\s\s");
  const userID = requestArray[0];
  const displayName = requestArray[1];

  request.get(  
    {  
      url: req.protocol + '://' + req.get('host') + '/api/v1/favorite/' + userID,  
      json: true  
    },  
    (err, favoritesResponse, albumResult) => {  
      if (err) return next(err); 
      if (albumResult) {
        let resultList = {
          title: "My Favorites",
          displayName: displayName || "",
          user: userID,
          albums: albumResult
        };
        res.send(resultList);
        return;

      } else {
        res.send({ "message" : `unable to find favorites for user "${displayName || "Unknown"}"` });
        return;
      }
    }
  );
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