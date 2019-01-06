const request = require('request')

// ====== UTILITY FUNCTIONS =======
// need to define `_this` so I can use it to access 
// these utility functions within this controller
const _this = this

// filter down track information to just song names
exports.utility_getSongsArray = function (allSongs) {
  let songNamesArray = []
  if (allSongs.length > 0) {
    allSongs.forEach(track => {
      songNamesArray.push(track.attributes.name)
    })
  }
  return songNamesArray
}

// remove genres that will not be used in the UI
exports.utility_getRealGenresArray = function (allGenres) {
  let realGenres = []
  if (allGenres.length > 0) {
    const notGenres = ["Music"]
    allGenres.forEach(genre => {
      if (notGenres.indexOf(genre) === -1) { realGenres.push(genre) }
    })
  }
  return realGenres
}  
// ====== END UTILITY FUNCTIONS =======


exports.return_album_details = function (req, res, next) {
  const jwtToken = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik05OVpGUEMyR1UifQ.eyJpYXQiOjE1NDY3NDEzOTMsImV4cCI6MTU2MjI5MzM5MywiaXNzIjoiUzJaUDI1NlBQSyJ9.uc5Wazj-mxf0t8NlmCm4rrwGxTJsoj4Ep-El0h5ZrWolXtvn1gp46Y00OGJEESjGLNF3A4fxnxXB8fx-rtF4Pw'
  const thisAlbum = req.params.appleAlbumID
  let result

  request.get(  
  {  
    url: `https://api.music.apple.com/v1/catalog/us/albums/${thisAlbum}`,  
    auth: {  
      bearer: jwtToken  
    },  
    json: true  
  },  
  (err, appleResponse, albumResult) => {  
    if (err) return next(err) 
    if (albumResult && albumResult.data && albumResult.data[0]) {
      let resultAlbum = {
        appleAlbumID: albumResult.data[0].id,
        appleURL: albumResult.data[0].attributes.url,
        title: albumResult.data[0].attributes.name,
        artist: albumResult.data[0].attributes.artistName,
        releaseDate: albumResult.data[0].attributes.releaseDate,
        recordCompany: albumResult.data[0].attributes.recordLabel,
        songNames: _this.utility_getSongsArray(albumResult.data[0].relationships.tracks.data),
        genres: _this.utility_getRealGenresArray(albumResult.data[0].attributes.genreNames),
        cover: albumResult.data[0].attributes.artwork.url
      }
      res.send(resultAlbum)
      return
    } else {
      res.send({ "message" : `unable to find an album with ID ${thisAlbum}` })
    }
  })
}

exports.search_by_album_or_artist = function (req, res, next) {
  const jwtToken = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik05OVpGUEMyR1UifQ.eyJpYXQiOjE1NDY3NDEzOTMsImV4cCI6MTU2MjI5MzM5MywiaXNzIjoiUzJaUDI1NlBQSyJ9.uc5Wazj-mxf0t8NlmCm4rrwGxTJsoj4Ep-El0h5ZrWolXtvn1gp46Y00OGJEESjGLNF3A4fxnxXB8fx-rtF4Pw'
  // const thisSearch = req.params.search.replace(/\'/g, '%27').replace(/\s/g, '%20').replace(/\&/g, '%26').replace(/\,/g, '%2C')
  const thisSearch = req.params.search

  request.get(  
  {  
    url: `https://api.music.apple.com/v1/catalog/us/search?term=${thisSearch}&limit=25&types=artists,albums`, 
    auth: {  
      bearer: jwtToken  
    },  
    json: true  
  },  
  (err, appleResponse, resultAlbums) => {  
    if (err) return next(err) 
    if (resultAlbums) {
      let responseObject = {}
      let responseAlbums = []
      let responseArtists = []

      if (resultAlbums.results.albums) {
        resultAlbums.results.albums.data.forEach(album => {
          let albumObject = {
            appleAlbumID: album.id,
            appleURL: album.attributes.url,
            title: album.attributes.name,
            artist: album.attributes.artistName,
            releaseDate: album.attributes.releaseDate,
            recordCompany: album.attributes.recordLabel,
            genres: _this.utility_getRealGenresArray(album.attributes.genreNames),
            cover: album.attributes.artwork.url
          }
          responseAlbums.push(albumObject)
        })
      }

      if (resultAlbums.results.artists) {
        resultAlbums.results.artists.data.forEach(artist => {
          let albumArray = []
          artist.relationships.albums.data.forEach(album => {
            // ====== MORE DATA ======
            // if (album.attributes && album.attributes.name) { 
            //   albumArray.push({ "appleAlbumID": album.id, "title": album.attributes.name, "releaseDate": album.attributes.releaseDate })
            // }

            // ====== LESS DATA ======
            albumArray.push(album.id)
          })

          let artistObject = {
            name: artist.attributes.name,
            genres: _this.utility_getRealGenresArray(artist.attributes.genreNames),
            albums: albumArray,
            // just using to identify elements on the page in case of duplicate names
            appleArtistID: artist.id
          }
          responseArtists.push(artistObject)
        })
      }

      responseObject.albums = responseAlbums
      responseObject.artists = responseArtists
      res.json(responseObject)
      return
    } else {
      res.send({ "message" :  "Apple was unable to find any data with these search params" })
    }
  })
}
