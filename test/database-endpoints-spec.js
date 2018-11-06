const should = require('should')
const api = require('../app.js')
const request = require('supertest').agent(api.listen())

// ====== TESTING GET ALL ALBUMS API ======
describe('GET all albums from the database', function() {
  it('should return 200', function(done) {
    request.get('/api/v1/album').expect(200).end(done)
  })
})

// ====== TESTING POST/DELETE NEW ALBUM ======
describe('POST, GET, and DELETE a new album in the database', function() {
  let newAlbum

  it('should POST a new album', function(done) {
    request
      .post('/api/v1/album')
      .send({
        appleAlbumID: "Test Apple Album ID",
        appleURL: "Test Apple URL",
        title: "Test Title",
        artist: "Test Artist",
        songNames: ["Test Song 1", "My Love Is Not A Test"],
        cover: "Test Cover"
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        newAlbum = res.body
        done()
      })
  })
  it('should return the details of the new album', function(done){
    request
      .get(`/api/v1/album/${newAlbum}`)
      .expect("Content-type",/json/)
      .expect(200) 
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.appleAlbumID.should.equal('Test Apple Album ID')
        res.body.songNames[0].should.equal('Test Song 1')
        done()
      })
  })
  it('should delete the new album', function(done) {
    request
      .delete(`/api/v1/album/${newAlbum}`)
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        done()
      })
  })
})
