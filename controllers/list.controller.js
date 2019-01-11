const List = require('../models/list.model')

exports.find_all_user_lists = function (req, res, next) {
  const userID = req.params.id
  List.find({ "user" :  userID }).populate('albums.album').exec(function (err, lists) {
    if (err) { return next(err) }
    if (lists.length === 0) { 
      res.send({"message" : 'No lists for this user.'}) 
      return
    }
    res.send(lists)
    return
  })
}

// there is no call to populate virtual `album` document
// before returning the new list
exports.new_list = function (req, res, next) {
  let list = new List(
    {
      user: req.body.user,
      displayName: req.body.displayName || "",
      title: req.body.title,
      notes: req.body.notes || "",
      albums: req.body.albums || []
    }
  )
  list.save(function(err, list) {
    if (err) { console.error(err) }
    else { res.send(list) }
  })
}

exports.get_list = function (req, res, next) {
  const listID = req.params.id
  List.findById(listID).populate('albums.album').exec(function (err, list) {
    if (err) { 
      if (err.message.slice(0,23) === "Cast to ObjectId failed") {
        // handle most common error with more helpful response
        res.send({"message" : `No list found with ID '${listID}'.`}) 
        return
      } else {
        return next(err) 
      }
    }
    if ( !list || list.length === 0) { 
      res.send({"message" : `No list found with ID '${listID}'.`}) 
      return
    }
    res.send(list)
    return
  })
}

exports.delete_list = function (req, res, next) {
  const listID = req.params.id
  List.findByIdAndRemove(listID).populate('albums.album').exec(function (err, deletedList) {
    if (err) { 
      if (err.message.slice(0,23) === "Cast to ObjectId failed") {
        // handle most common error with more helpful response
        res.send({"message" : `No list found with ID '${listID}'.`}) 
        return
      } else {
        return next(err) 
      }
    }
    // confirming deletion was successful
    if (deletedList) { res.send('List deleted successfully!') }
    else { res.send({ "message" : `List ID '${listID}' does not exist in the database. NOTE: The required ID value is for the database '_id' field.` }) }
  })
}

exports.update_list = function (req, res, next) {
  const listID = req.params.id
  const method = req.body.method

  if (method && method === "add album") {
    let addAlbum = {
      appleAlbumID: req.body.appleAlbumID,
      title: req.body.title,
      artist: req.body.artist,
      releaseDate: req.body.releaseDate,
      cover: req.body.cover
    }
    // $push just adds it, $addToSet adds if there are no duplicates
    // {new: true} required in order to return the updated object
    List.findByIdAndUpdate(listID, { $addToSet: { albums: addAlbum }}, {new: true}).populate('albums.album').exec(function (err, list) {
      if (err) { 
        if (err.message.slice(0,23) === "Cast to ObjectId failed") {
          // handle most common error with more helpful response
          res.send({"message" : `No list found with ID '${listID}'.`}) 
          return
        } else {
          return next(err) 
        }
      }
      res.send(list)
      return
    })
  } else if (method && method === "remove album") {
    const removeAlbum = {
      appleAlbumID: req.body.appleAlbumID,
      title: req.body.title,
      artist: req.body.artist,
      releaseDate: req.body.releaseDate,
      cover: req.body.cover
    }
    // {new: true} required in order to return the updated object
    List.findByIdAndUpdate(listID, { $pull: { albums: removeAlbum }}, {new: true}).populate('albums.album').exec(function (err, list) {
      if (err) { 
        if (err.message.slice(0,23) === "Cast to ObjectId failed") {
          // handle most common error with more helpful response
          res.send({"message" : `No list found with ID '${listID}'.`}) 
          return
        } else {
          return next(err) 
        }
      }
      res.send(list)
      return
    })
  } else if (method && method === "change title") {
    newTitle = req.body.title
    List.findByIdAndUpdate(listID, { $set: { title: newTitle } }, {new: true}).populate('albums.album').exec(function (err, list) {
      if (err) { 
        if (err.message.slice(0,23) === "Cast to ObjectId failed") {
          // handle most common error with more helpful response
          res.send({"message" : `No list found with ID '${listID}'.`}) 
          return
        } else {
          return next(err) 
        }
      }
      res.send(list)
      return
    })
  } else if (method && method === "change display name") {
    newDisplayName = req.body.displayName
    List.findByIdAndUpdate(listID, { $set: { displayName: newDisplayName } }, {new: true}).populate('albums.album').exec(function (err, list) {
      if (err) { 
        if (err.message.slice(0,23) === "Cast to ObjectId failed") {
          // handle most common error with more helpful response
          res.send({"message" : `No list found with ID '${listID}'.`}) 
          return
        } else {
          return next(err) 
        }
      }
      res.send(list)
      return
    })
  } else {
    res.send({"message" : "body requires a 'message' parameter with a value of 'add album', 'remove album', 'change title', or 'change display name'"}) 
    return
  }
}