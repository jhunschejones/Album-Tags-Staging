const mongoose = require('mongoose')
const Schema = mongoose.Schema

// ====== Model Notes: ======

let AlbumSchema = new Schema({
  appleAlbumID: {type: String, required: true, maxlength: 20},
  appleURL: {type: String, required: true, maxlength: 180},
  title: {type: String, required: true, maxlength: 180},
  titleKeyWords: {type: Array, required: true},
  artist: {type: String, required: true, maxlength: 180},
  artistKeyWords: {type: Array, required: true},
  releaseDate: {type: String, required: false, maxlength: 20},
  recordCompany: {type: String, required: false, maxlength: 180},
  songNames: {type: Array, required: true},
  cover: {type: String, required: true, maxlength: 180},
  genres: {type: Array, required: false},
  tagObjects: {type: Array, required: false},
  tags: {type: Array, required: false},
  connectionObjects: {type: Array, required: false},
  favoritedBy: {type: Array, required: false}
}, { collection : 'album-collection' })

module.exports = mongoose.model('Album', AlbumSchema)