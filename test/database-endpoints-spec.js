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

// ====== TESTING ADD AND REMOVE TAG FUNCTIONALITY ======
describe('add and remove a tag', function() {
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
  it('should add a tag to the new album', function(done){
    request
      .post(`/api/v1/album/tags/${newAlbum}`)
      .send({
        tag: "Test Tag",
        creator: "Test User",
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.tags[0].should.equal("Test Tag")
        done()
      })
  })
  it('should remove a tag from the new album', function(done){
    request
      .delete(`/api/v1/album/tags/${newAlbum}`)
      .send({
        tag: "Test Tag",
        creator: "Test User",
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.tags.length.should.equal(0)
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

// ====== TESTING ADD AND REMOVE CONNECTION FUNCTIONALITY ======
describe('add, view, and remove a connection', function() {
  let newAlbumOne
  let newAlbumTwo

  it('should POST a new album', function(done) {
    request
      .post('/api/v1/album')
      .send({
        appleAlbumID: "Test Apple Album ID 1",
        appleURL: "Test Apple URL",
        title: "Test Title 1",
        artist: "Test Artist",
        songNames: ["Test Song 1", "My Love Is Not A Test"],
        cover: "Test Cover"
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        newAlbumOne = {
          _id: res.body,
          appleAlbumID: "Test Apple Album ID 1",
          appleURL: "Test Apple URL",
          title: "Test Title 1",
          artist: "Test Artist",
          songNames: ["Test Song 1", "My Love Is Not A Test"],
          cover: "Test Cover"
        }
        done()
      })
  })
  it('should POST a second new album', function(done) {
    request
      .post('/api/v1/album')
      .send({
        appleAlbumID: "Test Apple Album ID 2",
        appleURL: "Test Apple URL",
        title: "Test Title 2",
        artist: "Test Artist",
        songNames: ["Test Song 1", "My Love Is Not A Test"],
        cover: "Test Cover"
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        newAlbumTwo = {
          _id: res.body,
          appleAlbumID: "Test Apple Album ID 2",
          appleURL: "Test Apple URL",
          title: "Test Title 2",
          artist: "Test Artist",
          songNames: ["Test Song 1", "My Love Is Not A Test"],
          cover: "Test Cover"
        }
        done()
      })
  })
  it('should add a connection between the new albums', function(done){
    request
      .post(`/api/v1/album/connections/${newAlbumOne._id}`)
      .send({
        albumOne: newAlbumOne,
        albumTwo: newAlbumTwo,
        creator: "Test User"
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.connectionObjects[0].title.should.equal("Test Title 2")
        done()
      })
  })
  it('should remove the connection between the new albums', function(done){
    request
      .delete(`/api/v1/album/connections/${newAlbumOne._id}`)
      .send({
        albumOne: newAlbumOne._id,
        albumTwo: newAlbumTwo._id,
        creator: "Test User"
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.connectionObjects.length.should.equal(0)
        done()
      })
  })
  it('should delete the first new album', function(done) {
    request
      .delete(`/api/v1/album/${newAlbumOne._id}`)
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        done()
      })
  })
  it('should delete the second new album', function(done) {
    request
      .delete(`/api/v1/album/${newAlbumTwo._id}`)
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        done()
      })
  })
})

// ====== TESTING ADD TO FAVORITES FUNCTIONALITY ======
describe('add and remove an album from favorites', function() {
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
  it('should add the new album to favorites', function(done){
    request
      .post(`/api/v1/album/favorites/${newAlbum}`)
      .send({
        user: "Test User"
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.favoritedBy[0].should.equal("Test User")
        done()
      })
  })
  it('should remove the new album from favorites', function(done){
    request
      .delete(`/api/v1/album/favorites/${newAlbum}`)
      .send({
        user: "Test User"
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.favoritedBy.length.should.equal(0)
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