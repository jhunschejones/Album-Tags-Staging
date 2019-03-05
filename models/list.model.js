const mongoose = require('mongoose')
const Schema = mongoose.Schema

let ListSchema = new Schema({
  user: {type: String, required: true, maxlength: 40},
  displayName: {type: String, required: false, maxlength: 30},
  title: {type: String, required: true, maxlength: 60},
  notes: {type: String, required: false, maxlength: 180},
  isPrivate: {type: Boolean, required: false}, 
  albums: [{
    _id:false,
    id:false,
    appleAlbumID: {type: String, required: true, maxlength: 20},
    title: {type: String, required: true, maxlength: 180},
    artist: {type: String, required: true, maxlength: 180},
    releaseDate: {type: String, required: true, maxlength: 20},
    cover: {type: String, required: true, maxlength: 180},
    genres: {type: Array, required: true},
  }],
  attributes: {type: Array, required: false}
}, { collection : 'album-lists' } )

ListSchema.path('albums').schema.virtual('album', {
  ref: 'Album',
  localField: 'appleAlbumID',
  foreignField: 'appleAlbumID',
  justOne: true, 
})

// virtuals are not returned by mongoose schemas by default
const options = { virtuals: true }
ListSchema.paths.albums.schema.set('toJSON', options)

module.exports = mongoose.model('List', ListSchema)