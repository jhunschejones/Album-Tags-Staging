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

// defining `_this` so I can re-use utility functions within this controller
const _this = this;

exports.cleanAlbumData = function (album) {
  if (album.dataValues) {
    if (album.dataValues.songNames && album.dataValues.genres) {
      // clean up song name and apple genre formatting
      album.dataValues.songNames = album.dataValues.songNames.split(',,');
      album.dataValues.genres = album.dataValues.genres.split(',,');
    }
    if (album.dataValues.tags) {
      // rename tags key
      album.dataValues.tagObjects = album.dataValues.tags;
    }
  } else {
    if (album.songNames && album.genres) {
      // clean up song name and apple genre formatting
      album.songNames = album.songNames.split(',,');
      album.genres = album.genres.split(',,');
    }
    if (album.tags) {
      // rename tags key
      album.tagObjects = album.tags;
    }
  }

  return album;
}

async function findAppleAlbumData(req, album) {
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
        resolve({ "message" : `Unable to find an album with ID '${album}'` });
      }
    })
  })
}

exports.createSongString = function (songs) {
  let songString = "";
  for (let i = 0; i < songs.length - 1; i++) {
    songString = songString + songs[i] + ",,";
  }
  songString = songString + songs[songs.length - 1];
  return songString;
}

exports.createGenreString = function (genres) {
  let genreString = "";
  for (let i = 0; i < genres.length - 1; i++) {
    genreString = genreString + genres[i] + ",,";
  }
  genreString = genreString + genres[genres.length - 1];
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
    songNames: _this.createSongString(req.body.songNames),
    genres: _this.createGenreString(req.body.genres)
  };

  Album.create(newAlbum)
    .then(function() {
      res.send({ "message" : "Album added!" });
    })
    .catch(function(err) {
      if (err.errors[0].message === "appleAlbumID must be unique" || err.errors[0].message === "PRIMARY must be unique") return res.send({ "message" : `An album with Apple Album ID '${req.body.appleAlbumID}' already exists.` });
      if (err.name === "SequelizeValidationError") return res.status(400).send(err);
      res.status(500).json(err);
    });
};

exports.get_album = async function (req, res, next) {
  Album.findOne({
    where: {
      appleAlbumID: req.params.appleAlbumID
    },
    include: [ Tag, Favorite, Connection, List ] // LEFT JOIN's with these tables
  }).then(async function(album) {
      if (!album) return res.send({ "message" : `No album found with Apple Album ID: '${req.params.appleAlbumID}'` });

      let connectedAlbums = [];
      for (let i = 0; i < album.dataValues.connections.length; i++) {
        const conection = album.dataValues.connections[i];
        const connectedAlbum = await Album.findOne({ where: { appleAlbumID: conection.dataValues.albumTwo }, attributes: [ "appleAlbumID", "title", "artist", "cover" ] });
        connectedAlbum.dataValues.creator = conection.dataValues.creator;
        connectedAlbums.push(connectedAlbum);
      }
      album.dataValues.connections = connectedAlbums;
      res.send(_this.cleanAlbumData(album));
    }).catch(function(err) {
      console.log(err);
      res.status(500).json(err);
    });
};

exports.get_all_albums = function(req, res, next) {
  const auth = req.body.apiToken? cryptr.decrypt(req.body.apiToken) : null;

  if (auth === process.env.API_TOKEN) {
    Album.findAll({
      include: [ Tag, Favorite, Connection, List ]
    }).then(function(albums){ 
      res.send(albums); 
    }).catch(function(err) { console.log(err); });
  } else {
    res.status(401).send({ "message": "invalid apiToken" });
  }    
};

exports.delete_album = function (req, res, next) {
  const auth = req.body.apiToken? cryptr.decrypt(req.body.apiToken) : null;

  if (auth === process.env.API_TOKEN) {
    Album.destroy({
      where: {
        appleAlbumID: req.params.appleAlbumID
      }
    }).then(function(albumsDeleted) {
        if (albumsDeleted === 0) return res.status(404).send({ "message" : `No album found with Apple Album ID: '${req.params.appleAlbumID}'` });
        res.send("Album deleted!");
      }).catch(function(err) {
        res.status(500).json(err);
      });
  } else {
    res.status(401).send({ "message": "invalid apiToken" });
  }
};

exports.add_favorite = function (req, res, next) {
  Album.findOrCreate({
    where: {
      appleAlbumID: req.body.album.appleAlbumID
    },
    defaults: {
      appleURL: req.body.album.appleURL,
      title: req.body.album.title,
      artist: req.body.album.artist,
      releaseDate: req.body.album.releaseDate,
      recordCompany: req.body.album.recordCompany,
      cover: req.body.album.cover
    }
  }).then(async function(album) {
    Favorite.findOrCreate({
      where: {
        userID: req.body.user,
        appleAlbumID: req.body.album.appleAlbumID
      }
    }).then(async function(result) {
      if (result[0]._options.isNewRecord) { res.send({ "message": "Favorite added!" }); }
      else { res.send({ "message" : "You've already favorited this album!" }); }
      
      // running after response is sent because this database update won't cause
      // a failed `add to favorites` operation but it does extend response time 
      // NOTE: all album ID's in tests have only 4 digits to distinguish from prod
      if (album[0]._options.isNewRecord && req.body.album.appleAlbumID.length > 4) {
        let fullAlbum = !req.body.album.songNames ? await findAppleAlbumData(req, req.body.album.appleAlbumID) : null;
        await album[0].update({
          songNames: _this.createSongString(req.body.album.songNames || fullAlbum.songNames),
          genres: _this.createGenreString(req.body.album.genres || fullAlbum.genres)
        })
      }
    }).catch(function(err) {
      res.status(500).json(err);
    });
  });
};

exports.get_user_favorites = async function (req, res, next) {
  Favorite.findAll({
    where: {
      userID: req.params.userID
    },
    include: [ 
      {
        model: Album,
        include: [ Tag ]
      }
    ]
  }).then(async function(albums) {
    if (albums.length < 1) return res.send(albums);

    let cleanAlbums = [];
    for (let i = 0; i < albums.length; i++) {
      const album = albums[i];
      cleanAlbums.push(_this.cleanAlbumData(album.dataValues.album));
    }
    res.send(cleanAlbums);
  }).catch(async function(err) {
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
  }).then(function(albumsDeleted) {
      if (albumsDeleted === 0) return res.status(404).send({ "message" : `User '${req.body.userID}' has not favorited album '${req.body.appleAlbumID}'` });
      
      if (req.body.returnData === "album") {
        req.params.appleAlbumID = req.body.appleAlbumID;
        return _this.get_album(req, res);
      } 
      
      if (req.body.returnData === "list") {
        req.params.userID = req.body.user;
        // TODO: throws warning that there is an unreturned promise here
        return _this.get_user_favorites(req, res);
      } 
      
      res.send({ "message": "Album successfully removed from user favorites." });
    }).catch(function(err) {
      console.log(err);
      res.status(500).json(err);
    });
};

exports.add_tag = async function (req, res, next) {
  Tag.findOrCreate({
    where: {
      text: req.body.tag,
      creator: req.body.creator,
      customGenre: req.body.customGenre
    }
  }).then(async function(tag) {
    Album.findOrCreate({
      where: {
        appleAlbumID: req.body.album.appleAlbumID
      },
      defaults: {
        appleURL: req.body.album.appleURL,
        title: req.body.album.title,
        artist: req.body.album.artist,
        releaseDate: req.body.album.releaseDate,
        recordCompany: req.body.album.recordCompany,
        cover: req.body.album.cover
      }
    }).then(async function(album){
      album[0].addTag(tag[0])
      .then(async function(albumTag) {
        if (albumTag.length < 1) return res.send({ "message": "This tag already exists." });
        // res.send(tag[0]);
        Album.findOne({
          where: {
            appleAlbumID: req.body.album.appleAlbumID
          },
          include: [ Tag ]
        }).then(async function(updatedAlbum) {
          res.send(_this.cleanAlbumData(updatedAlbum));
        })

        // running after response is sent because this database update won't cause
        // a failed `add tag` operation but it does extend response time 
        // NOTE: all album ID's in tests have only 4 digits to distinguish from prod
        if (album[0]._options.isNewRecord && req.body.album.appleAlbumID.length > 4) {
          await album[0].update({
            songNames: _this.createSongString(req.body.album.songNames),
            genres: _this.createGenreString(req.body.album.genres)
          })
        }
      });
    });
  }).catch(function(err) {
    console.log(err);
    res.status(500).json(err);
  });
};

exports.find_by_tags = function (req, res, next) {
  const searchedTags = req.params.tags.split(',');
  Tag.findAll({
    where: { 
      // matches ANY of the searched tags
      text: {
        [Op.in]: searchedTags
      }
    },
    include: [{
      model: Album,
      include: [ Tag ]
    }]
  }).then(function(tagResults) {
    let results = [];
    for (let i = 0; i < tagResults.length; i++) {
      const tagResult = tagResults[i];
      for (let j = 0; j < tagResult.albums.length; j++) {
        const album = tagResult.albums[j];
        let tags = [];
        for (let k = 0; k < album.tags.length; k++) {
          const tag = album.tags[k];
          tags.push(tag.dataValues.text);
        }
        if (searchedTags.every(function(tag) { return tags.indexOf(tag) !== -1; })) {
          if (!results.find(x => x.dataValues.appleAlbumID === album.dataValues.appleAlbumID)) {
            results.push(_this.cleanAlbumData(album));
          }
        }
      }
    }
    res.send(results);
  }).catch(function(err) {
    console.log(err)
    res.status(500).json(err);
  });
};

exports.get_all_tags = function(req, res, next) {
  Tag.findAll({}).then(function(tags) {
    let justTagText = {};
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i].text;
      justTagText[tag] = 0;
    }
    res.send(Object.keys(justTagText).sort());
  }).catch(function(err) {
    res.status(500).json(err);
  });
};

exports.delete_tag = async function (req, res, next) {
  Tag.findOne({
    where: {
      text: req.body.text,
      creator: req.body.creator,
      customGenre: req.body.customGenre
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
        Album.findOne({
          where: {
            appleAlbumID: req.body.appleAlbumID
          },
          include: [ Tag ]
        }).then(function(updatedAlbum) {
          res.send(_this.cleanAlbumData(updatedAlbum));

          // destroy tag if it is not in any albumTags relationships
          sequelize.query("SELECT * FROM `albumTags` WHERE `albumTags`.`tagId` = " + tag.id, { type: sequelize.QueryTypes.SELECT})
            .then(albumTags => {
              if (albumTags.length < 1) {
                return Tag.destroy({
                  where: {
                    text: req.body.text,
                    creator: req.body.creator,
                    customGenre: req.body.customGenre
                  }
                }).catch(function(err) {
                  console.log(err);
                })
              }
            }).catch(function(err) {
              console.log(err);
            })
        })
      }).catch(function(err) {
        // this catch is hit if a delete request is sent for a non-existent tag (instead of the check above)
        // res.status(404).send({ "message": "This tag does not exist." });
        res.status(500).json(err);
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
      appleAlbumID: albumOne.appleAlbumID
    }, 
    defaults: {
      appleURL: albumOne.appleURL,
      title: albumOne.title,
      artist: albumOne.artist,
      releaseDate: albumOne.releaseDate,
      recordCompany: albumOne.recordCompany,
      cover: albumOne.cover
    }
  }).then(async function(firstAlbum){
    Album.findOrCreate({
      where: {
        appleAlbumID: albumTwo.appleAlbumID
      }, 
      defaults: {
        appleURL: albumTwo.appleURL,
        title: albumTwo.title,
        artist: albumTwo.artist,
        releaseDate: albumTwo.releaseDate,
        recordCompany: albumTwo.recordCompany,
        cover: albumTwo.cover
      }
    }).then(async function(seccondAlbum){
      Connection.findOrCreate({
        where: {
          albumOne: albumOne.appleAlbumID,
          albumTwo: albumTwo.appleAlbumID,
          creator: req.body.creator
        }
      }).then(async function(connectionOne) {
        Connection.findOrCreate({
          where: {
            albumOne: albumTwo.appleAlbumID,
            albumTwo: albumOne.appleAlbumID,
            creator: req.body.creator
          }
        }).then(async function(connectionTwo){
          if (!connectionOne[0]._options.isNewRecord || !connectionTwo[0]._options.isNewRecord) {
            res.send({ "message" : `'${albumOne.title}' is already connected to '${albumTwo.title}'` });
          } else {
            // res.send({ "message" : `'${albumOne.title}' is now connected to '${albumTwo.title}'`});
            req.params.appleAlbumID = albumOne.appleAlbumID;
            _this.get_connections(req, res);
          }

          // running after response is sent because these database updates won't 
          // cause a failed connection but they do extend response time 
          // NOTE: all album ID's in tests have only 4 digits to distinguish from prod
          if (firstAlbum[0]._options.isNewRecord && albumOne.appleAlbumID.length > 4) {
            await firstAlbum[0].update({
              songNames: _this.createSongString(albumOne.songNames),
              genres: _this.createGenreString(albumOne.genres)
            })
          }
          if (seccondAlbum[0]._options.isNewRecord && albumOne.appleAlbumID.length > 4) {
            albumTwo = await findAppleAlbumData(req, albumTwo.appleAlbumID);
            await seccondAlbum[0].update({
              songNames: _this.createSongString(albumTwo.songNames),
              genres: _this.createGenreString(albumTwo.genres)
            })
          }
        }).catch(function(err) { console.log(err) })
      }).catch(function(err) { console.log(err) })
    }).catch(function(err) { console.log(err) })
  }).catch(function(err) { console.log(err) })
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

exports.delete_connection = async function (req, res, next) {
  Connection.destroy({
    where: {
      albumOne: req.body.albumOne,
      albumTwo: req.body.albumTwo,
      creator: req.body.creator
    }
  }).then(async function(deletedConnectionOne) {
    Connection.destroy({
      where: {
        albumOne: req.body.albumTwo,
        albumTwo: req.body.albumOne,
        creator: req.body.creator
      }
    }).then(async function(deletedConnectionTwo) {
      // res.send(`${deletedConnectionOne + deletedConnectionTwo} connections deleted.`);
      req.params.appleAlbumID = req.body.albumOne;
      _this.get_connections(req, res);
    }).catch(function(err) {
      console.log(err)
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
    // new list is created without albums
    if (!req.body.albums || req.body.albums.length === 0) return res.send(list[0]);
    // new list is created with albums
    Album.findOrCreate({
      where: {
        appleAlbumID: req.body.albums[0].appleAlbumID
      },
      defaults: {
        appleURL: req.body.albums[0].appleURL,
        title: req.body.albums[0].title,
        artist: req.body.albums[0].artist,
        releaseDate: req.body.albums[0].releaseDate,
        recordCompany: req.body.albums[0].recordCompany,
        cover: req.body.albums[0].cover
      }
    }).then(async function(album){
      list[0].addAlbum(album[0])
      .then(async function(listAlbum) {
        if (listAlbum.length < 1) return res.send({ "message" : "This album is already in this list."});
        res.send(list[0]);

        // running after response is sent because this database update won't cause
        // a failed `create new list` operation but it does extend response time 
        // NOTE: all album ID's in tests have only 4 digits to distinguish from prod
        if (album[0]._options.isNewRecord && req.body.albums[0].appleAlbumID.length > 4) {
          await album[0].update({
            songNames: _this.createSongString(req.body.albums[0].songNames),
            genres: _this.createGenreString(req.body.albums[0].genres)
          })
        }
      }).catch(function(err) {
        res.status(500).json(err);
      })
    })
  }).catch(function(err) {
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
          appleAlbumID: req.body.appleAlbumID
        },
        defaults: {
          appleURL: req.body.appleURL,
          title: req.body.title,
          artist: req.body.artist,
          releaseDate: req.body.releaseDate,
          recordCompany: req.body.recordCompany,
          cover: req.body.cover
        }
      }).then(async function(album){
        list.addAlbum(album[0])
        .then(async function(listAlbum) {
          if (listAlbum.length < 1) return res.send({ "message" : "This album is already in this list."});
          res.send(list);

          // running after response is sent because this database update won't cause
          // a failed `add album to list` operation but it does extend response time 
          // NOTE: all album ID's in tests have only 4 digits to distinguish from prod
          if (album[0]._options.isNewRecord && req.body.appleAlbumID.length > 4) {
            let fullAlbum = await findAppleAlbumData(req, req.body.appleAlbumID);
            await album[0].update({
              songNames: _this.createSongString(fullAlbum.songNames),
              genres: _this.createGenreString(fullAlbum.genres)
            })
          }
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
    include: [ 
      {
        model: Album,
        include: [ Tag ]
      }
    ]
  }).then(function(list) {
    let cleanAlbums = [];
    for (let i = 0; i < list.dataValues.albums.length; i++) {
      const album = list.dataValues.albums[i];
      cleanAlbums.push(_this.cleanAlbumData(album.dataValues));
    }
    list.albums = cleanAlbums;
    res.send(list);
  }).catch(function(err) {
    console.log(err)
    res.status(500).json(err);
  });
};

exports.delete_list = function (req, res, next) {
  List.destroy({
    where: {
      id: req.params.list
    }
  }).then(function(listsDeleted) {
    if (listsDeleted === 1) return res.send({ "message": "List deleted!" });
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