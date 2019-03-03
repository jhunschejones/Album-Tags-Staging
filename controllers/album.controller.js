const Album = require('../models/album.model')
const request = require('request')

// ====== START HELPER FUNCTIONS =======
const _this = this

exports.utility_getKeyWords = function (string) {
  const stringWords = string.split(" ")
  let keyWords = []
  let unimportant = ["AND","THE","OR","OF","A",""]
  
  stringWords.forEach(element => {
    // remove special characters from the word 
    element = element.replace(/[^a-zA-Z0-9]/g, " ")
    // trim any spaces off the ends of the word
    element = element.trim()
    // capitolize word
    element = element.toUpperCase()

    // check if word is uninmportant
    if (unimportant.indexOf(element) === -1) {
      // check if word is already in array
      if (keyWords.indexOf(element) === -1 ) {
        // add word to keyWords array
        keyWords.push(element)
      }
    }
  })

  return keyWords
}

function makeConnectionObject(albumObject, creator, databaseID) {
  let stringID = databaseID.toString().trim()
  let connectionObject = {
    "databaseID" : stringID,
    "appleAlbumID": albumObject.appleAlbumID,
    "creator": creator,
    "title": albumObject.title,
    "artist": albumObject.artist,
    "cover": albumObject.cover
  }
  return connectionObject
}

async function findAppleAlbumData(album) {
  const options = {
    url: `https://www.albumtags.com/api/v1/apple/details/${album}`,  
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
// ====== END HELPER FUNCTIONS =======

exports.return_all_albums = function (req, res) {
  Album.find({}, function (err, data) {
    if (err) return next(err)
    res.send(data)
  })
}

// ====== Deprecated 02.20.19 ======
// ====== Turned back on 03.02.19 for tests ======
exports.get_album_details = function (req, res, next) {
  Album.findById(req.params.id, function (err, album) {
    if (err) return next(err)
    if (album) res.status(200).send(album)
    else res.send({ "message" : `Album ID '${req.params.id}' does not exist in the database. NOTE: the required ID value is for the database '_id' field, not the Apple 'albumID' field.` })
  })
}

exports.add_new_album = function (req, res) {
  const titleKeyWords = _this.utility_getKeyWords(req.body.title) || []
  const artistKeyWords = _this.utility_getKeyWords(req.body.artist) || []

  let album = new Album(
    {
      appleAlbumID: req.body.appleAlbumID,
      appleURL: req.body.appleURL,
      title: req.body.title,
      titleKeyWords: titleKeyWords,
      artist: req.body.artist,
      artistKeyWords: artistKeyWords,
      releaseDate: req.body.releaseDate,
      recordCompany: req.body.recordCompany,
      songNames: req.body.songNames,
      cover: req.body.cover,
      genres: req.body.genres,
      tagObjects: [],
      tags: [],
      connectionObjects: [],
      favoritedBy: []
    }
  )

  album.save(function(err, album) {
    if (err) {
      res.send(err)
    } else {
      // res.send('Album record created successfully!')
      res.send(album._id)
    }
  })
} 

// ====== Deprecated 02.20.19 ======
// ====== Turned back on 03.02.19 for database error corrections ======
exports.update_entire_album = function (req, res, next) {
  Album.findByIdAndUpdate(req.params.id, {$set: req.body}, function (err, album) {
    if (err) { 
      if (err.message.slice(0,23) === "Cast to ObjectId failed") {
        // handle most common error with more helpful response
        res.send({"message" : `No album found for '${req.params.id}' database _id.`}); 
        return;
      } else {
        return next(err); 
      }
    }
    res.send('Album updated successfully!')
    return
  })
}

exports.delete_album = function (req, res) {
  Album.findByIdAndRemove(req.params.id, function (err, deletedAlbum) {
    if (err) return next(err)
    
    // confirming deletion was successful
    if (deletedAlbum) { res.send('Album deleted successfully!') }
    else { res.send({ "message" : `Album ID '${req.params.id}' does not exist in the database. NOTE: The required ID value is for the database '_id' field, not the Apple 'albumID' field.` }) }
  })
}

exports.find_by_apple_album_id = function (req, res, next) {
  const searchParams = req.params.id

  Album.findOne({ "appleAlbumID": searchParams }, function (err, album) {
    if (err) { return next(err) }
    if (!album || album.length === 0) { 
      res.send({ "message" : `No matching album in the database. Note: ':id' must be an appleAlbumID.` }) 
      return
    }
    res.send(album)
    return
  })
}

exports.find_by_tags = function (req, res) {
  const sentTags = req.params.tags.split(",")
  let selectedTags = []

  sentTags.forEach(element => {
    element = element.trim()
    if (selectedTags.indexOf(element) === -1) { selectedTags.push(element) }
  })

  Album.find({ "tags": { $all: selectedTags }}, function (err, results, next) {
    if (err) { return next(err) }
    if (results.length === 0) { 
      res.send({ "mesage": `No albums in the database with tags: ${JSON.stringify(selectedTags)}` }) 
      return
    }
    res.send(results)
  })
}

exports.add_tag = function (req, res, next) {
  if (!req.body.tag || req.body.tag.length > 30) {
    res.send({
      "message": "Maximum character length for tag text exceeded",
      "limit" : "tags: 30 characters",
      "tag length recieved" : `${req.body.tag ? req.body.tag.length : 0}`
    })
    return;
  }

  // album is already in the database according to client
  if (req.params.id != "new"){
    // full tag update
    if (req.body.creator) {
      let updateObject = {
        "tag": req.body.tag,
        "creator": req.body.creator,
        "customGenre": req.body.customGenre
      }
      // $push just adds it, $addToSet adds if there are no duplicates
      // {new: true} required in order to return the updated object
      Album.findByIdAndUpdate(req.params.id, { $addToSet: { tagObjects: updateObject, tags: req.body.tag }}, {new: true}, function (err, album) {
        if (err) return next(err)
        res.send(album)
        return
      })
    } 
    
    // just update tags array
    if (req.body.method === "fix short tags array") {
      // $push just adds it, $addToSet adds if there are no duplicates
      // {new: true} required in order to return the updated object
      Album.findByIdAndUpdate(req.params.id, { $addToSet: { tags: req.body.tag }}, {new: true}, function (err, album) {
        if (err) return next(err)
        res.send(album)
        return
      })
    }
  } else {
    // client says no album in the database, check again
    Album.findOne({ "appleAlbumID": req.body.album.appleAlbumID }, function (err, existingAlbum) {
      if (err) { return next(err) }
      // if actually no album in database  
      if (!existingAlbum || existingAlbum.length === 0) { 
        // create new database album
        let updateObject = {
          "tag": req.body.tag,
          "creator": req.body.creator,
          "customGenre": req.body.customGenre
        }
        const titleKeyWords = _this.utility_getKeyWords(req.body.album.title) || []
        const artistKeyWords = _this.utility_getKeyWords(req.body.album.artist) || []

        let newAlbum = new Album(
          {
            appleAlbumID: req.body.album.appleAlbumID,
            appleURL: req.body.album.appleURL,
            title: req.body.album.title,
            titleKeyWords: titleKeyWords,
            artist: req.body.album.artist,
            artistKeyWords: artistKeyWords,
            releaseDate: req.body.album.releaseDate,
            recordCompany: req.body.album.recordCompany,
            songNames: req.body.album.songNames,
            cover: req.body.album.cover,
            genres: req.body.album.genres,
            tagObjects: [
              updateObject
            ],
            tags: [
              updateObject.tag
            ],
            connectionObjects: [],
            favoritedBy: []
          }
        )

        newAlbum.save(function(err, album) {
          if (err) { console.error(err) }
          res.send(album)
          return
        })
      } else {
        // back end database album found!
        let updateObject = {
          "tag": req.body.tag,
          "creator": req.body.creator,
          "customGenre": req.body.customGenre
        }
        // $push just adds it, $addToSet adds if there are no duplicates
        // {new: true} required in order to return the updated object
        Album.findByIdAndUpdate(existingAlbum._id, { $addToSet: { tagObjects: updateObject, tags: req.body.tag }}, {new: true}, function (err, album) {
          if (err) return next(err)
          res.send(album)
          return
        })
      }
    })
  }
}

exports.delete_tag = function (req, res, next) {
  let deleteObject = {
    "tag": req.body.tag,
    "creator": req.body.creator,
    // "customGenre": req.body.customGenre
  }
  // {new: true} required in order to return the updated object
  Album.findByIdAndUpdate(req.params.id, { $pull: { tagObjects: deleteObject, tags: req.body.tag }}, {new: true}, function (err, album) {
    if (err) return next(err)
    res.send(album)
    return
  })
}

// ========= ADD CONECTION ASYNC HELPER FUNCTIONS =========
async function existingAlbumConnection(albumObject, creator) {
  if (albumObject._id) { 
    const albumDatabaseId = albumObject._id 
    const connection = makeConnectionObject(albumObject, creator, albumDatabaseId)
    // returns a connection object for existing album 
    return connection;
  } else {
    // use `.exec()` to return a real promise that can be await-ed
    const promiseSearch = await Album.findOne({ "appleAlbumID": albumObject.appleAlbumID }).exec();
    if (!promiseSearch) {
      // returns null if no album exists
      return null;
    } else {
      const albumDatabaseId = promiseSearch._id 
      const connection = makeConnectionObject(promiseSearch, creator, albumDatabaseId)
      // returns a connection object for existing album that the client did not know was in the database already
      return connection;
    }
  }
}

async function newAlbumConnection(albumObject, creator) {
  let fullAlbum = await findAppleAlbumData(albumObject.appleAlbumID);
  const titleKeyWords = _this.utility_getKeyWords(fullAlbum.title) || [];
  const artistKeyWords = _this.utility_getKeyWords(fullAlbum.artist) || [];

  let newAlbum = new Album(
    {
      appleAlbumID: fullAlbum.appleAlbumID,
      appleURL: fullAlbum.appleURL,
      title: fullAlbum.title,
      titleKeyWords: titleKeyWords,
      artist: fullAlbum.artist,
      artistKeyWords: artistKeyWords,
      releaseDate: fullAlbum.releaseDate,
      recordCompany: fullAlbum.recordCompany,
      songNames: fullAlbum.songNames,
      cover: fullAlbum.cover,
      genres: fullAlbum.genres,
      tagObjects: [],
      tags: [],
      connectionObjects: [],
      favoritedBy: []
    }
  )

  const savedAlbum = await newAlbum.save();
  const albumDatabaseId = savedAlbum._id 
  const connection = makeConnectionObject(savedAlbum, creator, albumDatabaseId)
  // adds new album to database and returns a connection object
  return connection;
}

exports.add_connection = async function (req, res, next) {
  const albumOne = req.body.albumOne;
  const albumTwo = req.body.albumTwo;
  const creator = req.body.creator;

  let connectionOne;
  let connectionTwo;
  let asyncError = false;
  // try-catch is the accepted way to handle async-await errors
  try {
    connectionOne = await existingAlbumConnection(albumOne, creator) || await newAlbumConnection(albumOne, creator);
    connectionTwo = await existingAlbumConnection(albumTwo, creator) || await newAlbumConnection(albumTwo, creator);
  } catch (error) {
    asyncError = true;
  }

  const somethingWentWrong = asyncError || !connectionOne || !connectionTwo || !albumOne || !albumTwo || !creator;
  if (somethingWentWrong) {
    res.send({"message" : "Sorry, something appears to have gone wrong connecting these two albums."});
    return;
  } 

  Album.findByIdAndUpdate(connectionOne.databaseID, { $addToSet: { connectionObjects: connectionTwo }}, {new: true}, function (err, album) {
    if (err) return next(err);
    res.send(album);
  }).then(function() {
    Album.findByIdAndUpdate(connectionTwo.databaseID, { $addToSet: { connectionObjects: connectionOne }}, function (err) {
      if (err) return next(err);
      // not returning anything
    });
  });
}

exports.delete_connection = function (req, res, next) {
  // const albumOneID = req.params.id.trim().toString()
  const albumOneID = req.body.albumOne.trim().toString()
  const albumTwoID = req.body.albumTwo.trim().toString()
  const user = req.body.creator

  Album.findByIdAndUpdate(albumOneID, { $pull: { connectionObjects: { databaseID: albumTwoID, creator: user }}}, {new: true}, function (err, album, next) {
    if (err) { return next(err) }
    res.send(album)
  }).then(function() {
    Album.findByIdAndUpdate(albumTwoID, { $pull: { connectionObjects: { databaseID: albumOneID, creator: user }}}, function (err, album, next) {
      if (err) { return next(err) }
    })
  })
}

exports.get_favorites = function (req, res) {
  const userID = req.params.user

  Album.find({ "favoritedBy": { $all: userID }}, function (err, results, next) {
    if (err) { return next(err) }
    if (results.length === 0) { 
      res.send({ "message": "This user does not have any favorited albums." }) 
      return
    }
    res.send(results)
  })
}

exports.add_favorite = async function (req, res, next) {
  const userID = req.body.user
  if (req.params.id && req.params.id != "new") {
    // $push just adds it, $addToSet adds if there are no duplicates
    Album.findByIdAndUpdate(req.params.id, { $addToSet: { favoritedBy: userID }}, {new:true}, function (err, album) {
      if (err) return next(err)
      res.send(album)
      return
    })
  } else {
    // client reports album not in database, doublecheck
    Album.findOne({ "appleAlbumID": req.body.albumData.appleAlbumID }, async function (err, existingAlbum) {
      if (err) { return next(err) }
      if (!existingAlbum || existingAlbum.length === 0) { 
        // ADD NEW ALBUM TO THE DATABASE
        let fullAlbum = await findAppleAlbumData(req.body.albumData.appleAlbumID);
        const titleKeyWords = _this.utility_getKeyWords(fullAlbum.title) || []
        const artistKeyWords = _this.utility_getKeyWords(fullAlbum.artist) || []

        let newAlbum = new Album(
          {
            appleAlbumID: fullAlbum.appleAlbumID,
            appleURL: fullAlbum.appleURL,
            title: fullAlbum.title,
            titleKeyWords: titleKeyWords,
            artist: fullAlbum.artist,
            artistKeyWords: artistKeyWords,
            releaseDate: fullAlbum.releaseDate,
            recordCompany: fullAlbum.recordCompany,
            songNames: fullAlbum.songNames,
            cover: fullAlbum.cover,
            genres: fullAlbum.genres,
            tagObjects: [],
            tags: [],
            connectionObjects: [],
            favoritedBy: [
              userID
            ]
          }
        )
      
        newAlbum.save(function(err, album) {
          if (err) { console.error(err) }
          else { 
            res.send(album);
            return;
          }
        })
      } else {
        // found album in database
        Album.findByIdAndUpdate(existingAlbum._id, { $addToSet: { favoritedBy: userID }}, {new:true}, function (err, album) {
          if (err) return next(err)
          res.send(album)
          return
        })
      }
    })
  }
}

exports.delete_favorite = function (req, res, next) {
  const userID = req.body.user
  // {new: true} required in order to return the updated object
  if (req.params.id.length === 24) {
    Album.findByIdAndUpdate(req.params.id, { $pull: { favoritedBy: userID }}, {new:true}, function (err, album) {
      if (err) return next(err)
      res.send(album)
      return
    })
  } else {
    Album.findOneAndUpdate({ "appleAlbumID": req.params.id }, { $pull: { favoritedBy: userID }}, {new:true}, function (err, album) {
      if (err) return next(err)
      res.send(album)
      return
    })
  }
}
