const mongoose = require('mongoose')
const Schema = mongoose.Schema

let ListSchema = new Schema({
  user: {type: String, required: true},
  displayName: {type: String, required: false},
  title: {type: String, required: true},
  notes: {type: String, required: false},
  albums: {type: Array, required: false},
  attributes: {type: Array, required: false}
}, { collection : 'album-lists' })

module.exports = mongoose.model('List', ListSchema)