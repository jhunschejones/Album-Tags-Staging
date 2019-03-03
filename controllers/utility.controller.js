const Album = require('../models/album.model');
const List = require('../models/list.model');
const request = require('request');

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

exports.find_albums_missing_songs = function (req, res, next) {
  Album.find({ "songNames" : [] }, function (err, albums) {
    if (err) { return next(err) }
    if (albums.length === 0) { 
      res.send({"message" : 'No albums in the database are missing songs.'}) 
      return
    }
    let albumIDs = [];
    albums.forEach(album => {
      albumIDs.push(album.appleAlbumID)
    });
    res.send({
      "message" : `There are ${albums.length} albums missing songs.`,
      albums: albumIDs
    })
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

async function checkAlbumID(album) {
  const jwtToken = process.env.APPLE_JWT

  const options = {
    url: `https://api.music.apple.com/v1/catalog/us/albums/${album}`,  
    auth: {  
      bearer: jwtToken  
    },  
    json: true  
  };

  return new Promise(function(resolve, reject) {
    request.get(options, function(err, resp, body) {
      if (err) {
        reject(err);
      } else if (body && body.data && body.data[0]) {
        resolve(
          {
            appleAlbumID: body.data[0].id,
            title: body.data[0].attributes.name,
            artist: body.data[0].attributes.artistName,
            releaseDate: body.data[0].attributes.releaseDate,
            recordCompany: body.data[0].attributes.recordLabel,
          }
        );
      } else {
        resolve({ "message" : `unable to find an album with ID ${album}` });
      }
    })
  })
}

exports.find_expired_albums = async function (req, res) {
  let expiredAlbums = [];
  let allAlbums;
  Album.find({}, async function (err, albums) {
    allAlbums = albums;
    for (const album of allAlbums) {
      let result = await checkAlbumID(album.appleAlbumID);
      // console.log(`Remaining alubms to check: ${allAlbums.length - (allAlbums.indexOf(album) + 1)}`);
      if (result.message) { expiredAlbums.push(result.message.slice(32, result.message.length)); }
    }
    // console.log(`There are ${expiredAlbums.length} expired albums out of ${allAlbums.length}:`)
    // expiredAlbums.forEach(album => {
    //   console.log(album)
    // });
    res.send(
      {
        "message" : `There are ${expiredAlbums.length} expired albums out of ${allAlbums.length}.`,
        "expiredAlbums" : expiredAlbums
      }
    )
  })
}

exports.find_duplicate_albums = function (req, res, next) {
  Album.find({}, function (err, data) {
    if (err) return next(err)

    let allAlbumNames = [];
    let duplicateAlbums = [];
    let allAlbumID = [];

    data.forEach(element => {
      const title = element.titleKeyWords.join(" ")
      const artist = element.artistKeyWords.join(" ")
      if (allAlbumNames.indexOf(title) != -1) { 
        // CHECK FOR DUPLICATE ALBUM TITLES WITH THE SAME ARTIST
        if (artist === data[allAlbumNames.indexOf(title)].artistKeyWords.join(" ")) {
          duplicateAlbums.push({ 
            "artist": artist,
            "title" : title, 
            "appleAlbumID" : [element.appleAlbumID, data[allAlbumNames.indexOf(title)].appleAlbumID] 
          }); 
        }
      }
      allAlbumNames.push(title);

      // CHECK FOR DUPLICATE APPLE ALBUM ID
      if (allAlbumID.indexOf(element.appleAlbumID) != -1) { 
        duplicateAlbums.push({ 
          "artist": artist,
          "title" : title, 
          "appleAlbumID" : element.appleAlbumID
        });
      }
      allAlbumID.push(element.appleAlbumID);
    });

    res.send(duplicateAlbums);
    return;
  })
}