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
      res.send('Tag added successfully!')
      return
    })
    // just update tags array
  } else {
    // $push just adds it, $addToSet adds if there are no duplicates
    // {new: true} required in order to return the updated object
    Album.findByIdAndUpdate(req.params.id, { $addToSet: { tags: req.body.tag }}, {new: true}, function (err, album) {
      if (err) return next(err)
      res.send('Tag added successfully!')
      return
    })
  }
}

exports.delete_tag = function (req, res, next) {
  let deleteObject = {
    "tag": req.body.tag,
    "creator": req.body.creator
  }
  // {new: true} required in order to return the updated object
  Album.findByIdAndUpdate(req.params.id, { $pull: { tagObjects: deleteObject, tags: req.body.tag }}, {new: true}, function (err, result) {
    if (err) return next(err)
    res.send('Tag deleted successfully!')
    return
  })
}

exports.add_connection = function (req, res, next) {
  let updateObject = {
    "appleAlbumID": req.body.appleAlbumID,
    "creator": req.body.creator,
    "title": req.body.title,
    "artist": req.body.artist,
    "cover": req.body.cover
  }
  // $push just adds it, $addToSet adds if there are no duplicates
  // {new: true} required in order to return the updated object
  Album.findByIdAndUpdate(req.params.id, { $addToSet: { connectionObjects: updateObject }}, {new: true}, function (err, album) {
    if (err) return next(err)
    res.send('Connection added successfully!')
    return
  })
}

exports.delete_connection = function (req, res, next) {
  let deleteObject = {
    "appleAlbumID": req.body.appleAlbumID,
    "creator": req.body.creator,
    "title": req.body.title,
    "artist": req.body.artist,
    "cover": req.body.cover
  }
  // {new: true} required in order to return the updated object
  Album.findByIdAndUpdate(req.params.id, { $pull: { connectionObjects: deleteObject }}, {new: true}, function (err, result) {
    if (err) return next(err)
    res.send('Connection deleted successfully!')
    return
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
  // $push just adds it, $addToSet adds if there are no duplicates
  Album.findByIdAndUpdate(req.params.id, { $addToSet: { favoritedBy: userID }}, function (err, album) {
    if (err) return next(err)
    res.send('Favorite added successfully!')
    return
  })
}

exports.delete_favorite = function (req, res, next) {
  const userID = req.body.user
  // {new: true} required in order to return the updated object
  Album.findByIdAndUpdate(req.params.id, { $pull: { favoritedBy: userID }}, function (err, result) {
    if (err) return next(err)
    res.send('Favorite deleted successfully!')
    return
  })
}

exports.find_blank_albums = function (req, res, next) {
  Album.find({ "tags": [] }, function (err, albums) {
    if (err) { return next(err) }
    if (albums.length === 0) { 
      res.send({"message" : `No blank albums in the database.`}) 
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