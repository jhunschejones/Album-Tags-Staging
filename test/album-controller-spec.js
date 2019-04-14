const should = require('should')
require('dotenv').load();
const album_controller = require('../controllers/album.controller')

// ====== TESTING CLEANALBUMDATA UTILITY FUNCTION ======
describe('cleanAlbumData', function() {
  it('should return an object when passed an object', function() {
    const result = album_controller.cleanAlbumData({})
    result.should.be.an.Object()
  })
  it('adds `tagObjects` property with the value of `tags` property', function() {
    const result = album_controller.cleanAlbumData({ "tags": [ "Tag 1", "Tag 2" ] })
    should.deepEqual(result, { "tags": [ "Tag 1", "Tag 2" ], "tagObjects": [ "Tag 1", "Tag 2" ] }, 'the result object does not match expected')
  })
  it('should split songname strings and genre strings', function() {
    const result = album_controller.cleanAlbumData({ "songNames": "Song One,,Song Two", "genres": "Rock,,Metal" })
    should.deepEqual(result, { "songNames": [ "Song One", "Song Two" ], "genres": [ "Rock", "Metal" ] }, 'the result object does not match expected')
  })
})

// ====== TESTING CREATESONGSTRING UTILITY FUNCTION ======
describe('createSongString', function() {
  it('should return a string from input array', function() {
    const result = album_controller.createSongString([ "Song One", "Song Two" ])
    result.should.be.a.String()
  })
  it('should build string from array', function() {
    const result = album_controller.createSongString([ "Song One", "Song Two" ])
    should.deepEqual(result, "Song One,,Song Two", 'the result string does not match expected')
  })
})

// ====== TESTING CREATEGENRESTRING UTILITY FUNCTION ======
describe('createGenreString', function() {
  it('should return a string from input array', function() {
    const result = album_controller.createGenreString([ "Rock", "Metal" ])
    result.should.be.a.String()
  })
  it('should build string from array', function() {
    const result = album_controller.createGenreString([ "Rock", "Metal" ])
    should.deepEqual(result, "Rock,,Metal", 'the result string does not match expected')
  })
})