const mongoose = require('mongoose')
const Schema = mongoose.Schema

// ====== Model Notes: ======

let AlbumSchema = new Schema({
  appleAlbumID: {type: String, required: true},
  appleURL: {type: String, required: true},
  title: {type: String, required: true},
  titleKeyWords: {type: Array, required: true},
  artist: {type: String, required: true},
  artistKeyWords: {type: Array, required: true},
  releaseDate: {type: String, required: false},
  recordCompany: {type: String, required: false},
  songNames: {type: Array, required: true},
  cover: {type: String, required: true},
  genres: {type: Array, required: false},
  tagObjects: {type: Array, required: false},
  tags: {type: Array, required: false},
  connectionObjects: {type: Array, required: false},
  favoritedBy: {type: Array, required: false}
}, { collection : 'album-collection' })

module.exports = mongoose.model('Album', AlbumSchema)