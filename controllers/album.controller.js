const Album = require('../models/album.model')

// ====== UTILITY FUNCTIONS =======
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
// ====== UTILITY FUNCTIONS =======

exports.return_all_albums = function (req, res) {
  Album.find({}, function (err, data) {
    if (err) return next(err)
    res.send(data)
  })
}

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

exports.update_entire_album = function (req, res, next) {
  Album.findByIdAndUpdate(req.params.id, {$set: req.body}, function (err, album) {
    if (err) return next(err)
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
      res.send({ "message" : `No matching album in the database.` }) 
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
  // album is already in the database
  if (req.params.id != "new"){
    // full tag update
    if (req.body.creator) {
      let updateObject = {
        "tag": req.body.tag,
        "creator": req.body.creator
      }
      // $push just adds it, $addToSet adds if there are no duplicates
      // {new: true} required in order to return the updated object
      Album.findByIdAndUpdate(req.params.id, { $addToSet: { tagObjects: updateObject, tags: req.body.tag }}, {new: true}, function (err, album) {
        if (err) return next(err)
        res.send(album)
        return
      })
      // just update tags array
    } else {
      // $push just adds it, $addToSet adds if there are no duplicates
      // {new: true} required in order to return the updated object
      Album.findByIdAndUpdate(req.params.id, { $addToSet: { tags: req.body.tag }}, {new: true}, function (err, album) {
        if (err) return next(err)
        res.send(album)
        return
      })
    }
  } else {
    // create new database album
    let updateObject = {
      "tag": req.body.tag,
      "creator": req.body.creator
    }
    const titleKeyWords = _this.utility_getKeyWords(req.body.album.title) || []
    const artistKeyWords = _this.utility_getKeyWords(req.body.album.artist) || []
  
    let album = new Album(
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
  
    album.save(function(err, album) {
      if (err) { console.error(err) }
      res.send(album)
    })
  }
}

exports.delete_tag = function (req, res, next) {
  let deleteObject = {
    "tag": req.body.tag,
    "creator": req.body.creator
  }
  // {new: true} required in order to return the updated object
  Album.findByIdAndUpdate(req.params.id, { $pull: { tagObjects: deleteObject, tags: req.body.tag }}, {new: true}, function (err, album) {
    if (err) return next(err)
    res.send(album)
    return
  })
}

exports.add_connection = function (req, res, next) {
  const albumOne = req.body.albumOne
  const albumTwo = req.body.albumTwo

  // IF THIS ALBUM IS IN THE DATABASE
  if (albumOne._id) {
    const albumDatabaseIdOne = req.params.id
    const connectionOne = makeConnectionObject(albumOne, req.body.creator, albumDatabaseIdOne)

    if (albumTwo._id) { 
      const albumDatabaseIdTwo = albumTwo._id 
      const connectionTwo = makeConnectionObject(albumTwo, req.body.creator, albumDatabaseIdTwo)
      // PUSH UPDATES TO BOTH EXISTING ALBUMS
      Album.findByIdAndUpdate(albumDatabaseIdOne, { $addToSet: { connectionObjects: connectionTwo }}, {new: true}, function (err, album) {
        if (err) return next(err)
        res.send(album)
  
      }).then(function() {
        Album.findByIdAndUpdate(albumDatabaseIdTwo, { $addToSet: { connectionObjects: connectionOne }}, function (err) {
          if (err) return next(err)
          // not returning anything
        })
      })
  
    } else {
      // POST NEW ALBUM FOR SECOND ALBUM, PUSH UPDATE TO FIRST ALBUM
      const titleKeyWords = _this.utility_getKeyWords(albumTwo.title) || []
      const artistKeyWords = _this.utility_getKeyWords(albumTwo.artist) || []
    
      let album = new Album(
        {
          appleAlbumID: albumTwo.appleAlbumID,
          appleURL: albumTwo.appleURL,
          title: albumTwo.title,
          titleKeyWords: titleKeyWords,
          artist: albumTwo.artist,
          artistKeyWords: artistKeyWords,
          releaseDate: albumTwo.releaseDate,
          recordCompany: albumTwo.recordCompany,
          songNames: albumTwo.songNames,
          cover: albumTwo.cover,
          genres: albumTwo.genres,
          tagObjects: [],
          tags: [],
          connectionObjects: [
            connectionOne
          ],
          favoritedBy: []
        }
      )
    
      album.save(function(err, album) {
        if (err) { console.error(err) }
        else { 
          const albumDatabaseIdTwo = album._id 
          const connectionTwo = makeConnectionObject(albumTwo, req.body.creator, albumDatabaseIdTwo)
  
          Album.findByIdAndUpdate(albumDatabaseIdOne, { $addToSet: { connectionObjects: connectionTwo }}, {new: true}, function (err, album) {
            if (err) return next(err)
            res.send(album)
          })
        }
      })
    }
  } else {
    // THIS ALBUM IS NOT IN THE DATABASE

    // ALBUM TWO IS IN THE DATABASE BUT NOT ALBUM ONE
    if (albumTwo._id) { 
      const albumDatabaseIdTwo = albumTwo._id 
      const connectionTwo = makeConnectionObject(albumTwo, req.body.creator, albumDatabaseIdTwo)
      const titleKeyWords = _this.utility_getKeyWords(albumOne.title) || []
      const artistKeyWords = _this.utility_getKeyWords(albumOne.artist) || []
    
      let album = new Album(
        {
          appleAlbumID: albumOne.appleAlbumID,
          appleURL: albumOne.appleURL,
          title: albumOne.title,
          titleKeyWords: titleKeyWords,
          artist: albumOne.artist,
          artistKeyWords: artistKeyWords,
          releaseDate: albumOne.releaseDate,
          recordCompany: albumOne.recordCompany,
          songNames: albumOne.songNames,
          cover: albumOne.cover,
          genres: albumOne.genres,
          tagObjects: [],
          tags: [],
          connectionObjects: [
            connectionTwo
          ],
          favoritedBy: []
        }
      )
    
      album.save(function(err, albumOne) {
        if (err) { console.error(err) }
        else { 
          const albumDatabaseIdOne = albumOne._id
          const connectionOne = makeConnectionObject(albumOne, req.body.creator, albumDatabaseIdOne)

          Album.findByIdAndUpdate(albumDatabaseIdTwo, { $addToSet: { connectionObjects: connectionOne }}, function (err) {
            if (err) return next(err)
            // not returning anything
            res.send(albumOne)
          })
        }
      })
    } else {
      // ALBUM ONE AND TWO ARE BOTH NOT IN THE DATABASE
      const titleKeyWords = _this.utility_getKeyWords(albumOne.title) || []
      const artistKeyWords = _this.utility_getKeyWords(albumOne.artist) || []
    
      let album = new Album(
        {
          appleAlbumID: albumOne.appleAlbumID,
          appleURL: albumOne.appleURL,
          title: albumOne.title,
          titleKeyWords: titleKeyWords,
          artist: albumOne.artist,
          artistKeyWords: artistKeyWords,
          releaseDate: albumOne.releaseDate,
          recordCompany: albumOne.recordCompany,
          songNames: albumOne.songNames,
          cover: albumOne.cover,
          genres: albumOne.genres,
          tagObjects: [],
          tags: [],
          connectionObjects: [],
          favoritedBy: []
        }
      )
    
      album.save(function(err, newAlbumOne) {
        if (err) { console.error(err) }
        else { 
          // FIRST ALBUM IS NOW CREATED
          const titleKeyWords = _this.utility_getKeyWords(albumTwo.title) || []
          const artistKeyWords = _this.utility_getKeyWords(albumTwo.artist) || []

          const albumDatabaseIdOne = newAlbumOne._id
          const connectionOne = makeConnectionObject(newAlbumOne, req.body.creator, albumDatabaseIdOne)
        
          let album = new Album(
            {
              appleAlbumID: albumTwo.appleAlbumID,
              appleURL: albumTwo.appleURL,
              title: albumTwo.title,
              titleKeyWords: titleKeyWords,
              artist: albumTwo.artist,
              artistKeyWords: artistKeyWords,
              releaseDate: albumTwo.releaseDate,
              recordCompany: albumTwo.recordCompany,
              songNames: albumTwo.songNames,
              cover: albumTwo.cover,
              genres: albumTwo.genres,
              tagObjects: [],
              tags: [],
              connectionObjects: [
                connectionOne
              ],
              favoritedBy: []
            }
          )
        
          album.save(function(err, newAlbumTwo) {
            if (err) { console.error(err) }
            else { 
              // NEW ALBUM TWO IS NOW CREATED
              const albumDatabaseIdTwo = newAlbumTwo._id
              const connectionTwo = makeConnectionObject(newAlbumTwo, req.body.creator, albumDatabaseIdTwo)

              Album.findByIdAndUpdate(albumDatabaseIdOne, { $addToSet: { connectionObjects: connectionTwo }}, {new:true}, function (err, fullyUpdatedAlbumOne) {
                if (err) return next(err)
                else { res.send(fullyUpdatedAlbumOne) }
              })
            }
          })
        }
      })
    }
  }
}

exports.delete_connection = function (req, res, next) {
  const albumOneID = req.params.id.trim().toString()
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

exports.add_favorite = function (req, res, next) {
  const userID = req.body.user
  if (req.params.id != "new") {
    // $push just adds it, $addToSet adds if there are no duplicates
    Album.findByIdAndUpdate(req.params.id, { $addToSet: { favoritedBy: userID }}, {new:true}, function (err, album) {
      if (err) return next(err)
      res.send(album)
      return
    })
  } else {
    const titleKeyWords = _this.utility_getKeyWords(req.body.albumData.title) || []
    const artistKeyWords = _this.utility_getKeyWords(req.body.albumData.artist) || []
  
    let album = new Album(
      {
        appleAlbumID: req.body.albumData.appleAlbumID,
        appleURL: req.body.albumData.appleURL,
        title: req.body.albumData.title,
        titleKeyWords: titleKeyWords,
        artist: req.body.albumData.artist,
        artistKeyWords: artistKeyWords,
        releaseDate: req.body.albumData.releaseDate,
        recordCompany: req.body.albumData.recordCompany,
        songNames: req.body.albumData.songNames,
        cover: req.body.albumData.cover,
        genres: req.body.albumData.genres,
        tagObjects: [],
        tags: [],
        connectionObjects: [],
        favoritedBy: [
          userID
        ]
      }
    )
  
    album.save(function(err, album) {
      if (err) { console.error(err) }
      else { res.send(album) }
    })
  }
}

exports.delete_favorite = function (req, res, next) {
  const userID = req.body.user
  // {new: true} required in order to return the updated object
  Album.findByIdAndUpdate(req.params.id, { $pull: { favoritedBy: userID }}, {new:true}, function (err, album) {
    if (err) return next(err)
    res.send(album)
    return
  })
}

exports.find_blank_albums = function (req, res, next) {
  Album.find({ "tags" : [], "connectionObjects" : [], "favoritedBy" : [] }, function (err, albums) {
    if (err) { return next(err) }
    if (albums.length === 0) { 
      res.send({"message" : 'No blank albums in the database.'}) 
      return
    }
    res.send(albums)
    return
  })
}

exports.find_albums_missing_tags = function (req, res) {
  let albumsMissingTags = []
  Album.find({}, function (err, albums) {
    for (let index = 0; index < albums.length; index++) {
      const album = albums[index];
      if (album.tags.length < album.tagObjects.length) {
        albumsMissingTags.push(album)
      }
    }
    res.send(albumsMissingTags)
  })
}