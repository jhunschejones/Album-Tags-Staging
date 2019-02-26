const mongoose = require('mongoose')
const Schema = mongoose.Schema

let ListSchema = new Schema({
  user: {type: String, required: true},
  displayName: {type: String, required: false},
  title: {type: String, required: true},
  notes: {type: String, required: false},
  isPrivate: {type: Boolean, required: false}, 
  albums: [{
    _id:false,
    id:false,
    appleAlbumID: {type: String, required: true},
    title: {type: String, required: true},
    artist: {type: String, required: true},
    releaseDate: {type: String, required: true},
    cover: {type: String, required: true},
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