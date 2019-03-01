const List = require('../models/list.model');
const request = require('request');
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.ENCRYPT_KEY);

exports.find_all_user_lists = function (req, res, next) {
  const userID = req.params.id;
  List.find({ "user" :  userID }).populate('albums.album').exec(function (err, lists) {
    if (err) { return next(err); }
    if (lists.length === 0) { 
      res.send({"message" : 'No lists for this user.'}); 
      return;
    }
    res.send(lists);
    return;
  });
};

exports.find_lists_with_album = function (req, res, next) {
  const albumID = req.params.id;
  List.find({ "albums.appleAlbumID" :  albumID }).populate('albums.album').exec(function (err, lists) {
    if (err) { return next(err); }
    if (lists.length === 0) { 
      res.send({"message" : 'This album is not in any lists.'}); 
      return;
    }
    res.send(lists);
    return;
  });
};

// there is no call to populate virtual `album` document
// before returning the new list
exports.new_list = function (req, res, next) {
  if (req.user) {
    res.send({ 
      "message" : "User ID must be specified for the list creator",
      "userID recieved" : req.body.user
    });
    return;
  }
  if ((!req.body.displayName || req.body.displayName.length < 31) && 
    (req.body.title.length < 61) && 
    (!req.body.notes || req.body.notes.length < 181)) {
    let list = new List(
      {
        user: req.body.user,
        displayName: req.body.displayName || "",
        title: req.body.title,
        notes: req.body.notes || "",
        isPrivate: req.body.isPrivate || false,
        albums: req.body.albums || []
      }
    );
    list.save(function(err, list) {
      if (err) { console.error(err); }
      else { res.send(list); }
    });
  } else {
    res.send({ 
      "message" : "Maximum character length exceeded for one or more fields",
      "requirements" : "title: 60, display name: 30, notes: 180",
      "title recieved" : `${req.body.title ? req.body.title.length : 0} characters`,
      "displayName recieved" : `${req.body.displayName ? req.body.displayName.length : 0} characters`,
      "notes recieved" : `${req.body.notes ? req.body.notes.length : 0} characters`
    });
  }
};

exports.get_list = function (req, res, next) {
  const listID = req.params.id;
  List.findById(listID).populate('albums.album').exec(function (err, list) {
    if (err) { 
      if (err.message.slice(0,23) === "Cast to ObjectId failed") {
        // handle most common error with more helpful response
        res.send({"message" : `No list found with ID '${listID}'.`}); 
        return;
      } else {
        return next(err); 
      }
    }
    if ( !list || list.length === 0) { 
      res.send({"message" : `No list found with ID '${listID}'.`}); 
      return;
    }
    res.send(list);
    return;
  });
};

exports.delete_list = function (req, res, next) {
  const listID = req.params.id;
  List.findByIdAndRemove(listID).populate('albums.album').exec(function (err, deletedList) {
    if (err) { 
      if (err.message.slice(0,23) === "Cast to ObjectId failed") {
        // handle most common error with more helpful response
        res.send({"message" : `No list found with ID '${listID}'.`}); 
        return;
      } else {
        return next(err); 
      }
    }
    // confirming deletion was successful
    if (deletedList) { res.send('List deleted successfully!'); }
    else { res.send({ "message" : `List ID '${listID}' does not exist in the database. NOTE: The required ID value is for the database '_id' field.` }); }
  });
};

exports.update_list = function (req, res, next) {
  const listID = req.params.id;
  const method = req.body.method;

  if (listID) {
    if (method && method === "add album") {
      if (req.body.appleAlbumID && req.body.title && req.body.artist && req.body.releaseDate && req.body.cover) {
        let addAlbum = {
          appleAlbumID: req.body.appleAlbumID,
          title: req.body.title,
          artist: req.body.artist,
          releaseDate: req.body.releaseDate,
          cover: req.body.cover,
          genres: req.body.genres
        };
        // $push just adds it, $addToSet adds if there are no duplicates
        // {new: true} required in order to return the updated object
        List.findByIdAndUpdate(listID, { $addToSet: { albums: addAlbum }}, {new: true}).populate('albums.album').exec(function (err, list) {
          if (err) { 
            if (err.message.slice(0,23) === "Cast to ObjectId failed") {
              // handle most common error with more helpful response
              res.send({"message" : `No list found with ID '${listID}'.`}); 
              return;
            } else {
              return next(err); 
            }
          }
          res.send(list);
          return;
        });
      } else {
        res.send({"message" : "You are missing some required information: appleAlbumID, title, artist, releaseDate, and cover are required to add an album"});
      }
    } else if (method && method === "remove album") {
      // {new: true} required in order to return the updated object
      List.findByIdAndUpdate(listID, { $pull: { albums: { appleAlbumID: req.body.appleAlbumID } }}, {new: true}).populate('albums.album').exec(function (err, list) {
        if (err) { 
          if (err.message.slice(0,23) === "Cast to ObjectId failed") {
            // handle most common error with more helpful response
            res.send({"message" : `No list found with ID '${listID}'.`}); 
            return;
          } else {
            return next(err); 
          }
        }
        res.send(list);
        return;
      });
    } else if (method && method === "change title") {
      newTitle = req.body.title;
      List.findByIdAndUpdate(listID, { $set: { title: newTitle } }, {new: true}).populate('albums.album').exec(function (err, list) {
        if (err) { 
          if (err.message.slice(0,23) === "Cast to ObjectId failed") {
            // handle most common error with more helpful response
            res.send({"message" : `No list found with ID '${listID}'.`}); 
            return;
          } else {
            return next(err); 
          }
        }
        res.send(list);
        return;
      });
    } else if (method && method === "change display name") {
      newDisplayName = req.body.displayName;
      List.findByIdAndUpdate(listID, { $set: { displayName: newDisplayName } }, {new: true}).populate('albums.album').exec(function (err, list) {
        if (err) { 
          if (err.message.slice(0,23) === "Cast to ObjectId failed") {
            // handle most common error with more helpful response
            res.send({"message" : `No list found with ID '${listID}'.`}); 
            return;
          } else {
            return next(err); 
          }
        }
        res.send(list);
        return;
      });
    } else {
      res.send({"message" : "body requires a 'method' parameter with a value of 'add album', 'remove album', 'change title', or 'change display name'"}); 
      return;
    }
  } else {
    res.send({"message" : "please provide the list _id value with your PUT request"});
  }
};

exports.get_user_virtual_favorites_list = function (req, res, next) {
  res.send(cryptr.encrypt(`${req.params.id.trim()}\s\s\s${req.body.displayName.trim()}`));
};

exports.get_user_favorites = function (req, res, next) {
  const requestArray = cryptr.decrypt(req.params.id).split("\s\s\s");
  const userID = requestArray[0];
  const displayName = requestArray[1];

  request.get(  
    {  
      url: 'https://www.albumtags.com/api/v1/album/favorites/' + userID,  
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
