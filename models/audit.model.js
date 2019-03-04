const mongoose = require('mongoose')
const Schema = mongoose.Schema

// ====== Model Notes: ======

let AuditSchema = new Schema({
  message: {type: String, required: true},
  payload: {type: Array, required: true},
}, { timestamps: true }, { collection : 'album-audits' })

module.exports = mongoose.model('Audit', AuditSchema)