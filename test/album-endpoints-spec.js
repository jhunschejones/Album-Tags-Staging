const should = require('should')
const api = require('../app.js')
const request = require('supertest').agent(api.listen())

const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.ENCRYPT_KEY);
const apiToken = cryptr.encrypt(process.env.API_TOKEN);

// NOTE: using 4-digit appleAlbumID values will bypass creating song and genre strings 

// ====== TESTING POST/DELETE NEW ALBUM ======
describe('POST, GET, and DELETE a new album in the database', function() {
  it('should POST a new album', function(done) {
    request
      .post('/api/v1/album')
      .send({
        appleAlbumID: 0001,
        appleURL: "Test Apple URL",
        title: "Test Title",
        artist: "Test Artist",
        songNames: [ "Test Song 1", "My Love Is Not A Test" ],
        cover: "Test Cover",
        releaseDate: "2019-04-01",
        recordCompany: "Test Records",
        genres: [ "Genre 1", "Genre 2" ]
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        done()
      })
  })
  it('should return the details of the new album', function(done){
    request
      .get('/api/v1/album/0001')
      .expect("Content-type",/json/)
      .expect(200) 
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.appleAlbumID.should.equal(0001)
        res.body.recordCompany.should.equal("Test Records")
        done()
      })
  })
  it('should delete the new album', function(done) {
    request
      .delete('/api/v1/album/0001')
      .send({
        "apiToken": apiToken
      })
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
  it('should add a tag and a new album', function(done){
    this.timeout(3000);
    request
      .post('/api/v1/tag')
      .send({
        tag: "Boop!",
        creator: "Josh Jones",
        customGenre: false,
        album: {
          appleAlbumID: 0002,
          appleURL: "Test Apple URL",
          title: "Test Title",
          artist: "Test Artist",
          songNames: [ "Test Song 1", "My Love Is Not A Test" ],
          cover: "Test Cover",
          releaseDate: "2019-04-01",
          recordCompany: "Test Records",
          genres: [ "Genre 1", "Genre 2" ]
        }
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.tagObjects[0].text.should.equal("Boop!")
        done()
      })
  })
  it('should remove a tag from the new album', function(done){
    request
      .delete('/api/v1/tag')
      .send({
        text: "Boop!",
        creator: "Josh Jones",
        customGenre: false,
        appleAlbumID: 0002
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.tagObjects.length.should.equal(0)
        done()
      })
  })
  it('should delete the new album', function(done) {
    request
      .delete('/api/v1/album/0002')
      .send({
        "apiToken": apiToken
      })
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
  let newAlbumOne = {
    appleAlbumID: 0003,
    appleURL: "Test URL 1",
    title: "Test Album One",
    artist: "Nifty Artist",
    releaseDate: "2019-04-01",
    recordCompany: "Test Records",
    cover: "Test URL 1",
    songNames: [ "Test Song 1", "My Love Is Not A Test" ],
    genres: [ "French Pastry", "Quite Delicate" ]
  }
  let newAlbumTwo = {
    appleAlbumID: 0004,
    appleURL: "Test URL 2",
    title: "Test Album Two",
    artist: "Nifty Artist",
    releaseDate: "2019-04-01",
    recordCompany: "Test Records",
    cover: "Test URL 2",
    songNames: [ "Test Song 1", "My Love Is Not A Test" ],
    genres: [ "Hair Jazz", "Quite Delicate" ]
  }

  it('should add a connection between two new albums', function(done){
    this.timeout(3000);
    request
      .post('/api/v1/connection')
      .send({
        albumOne: newAlbumOne,
        albumTwo: newAlbumTwo,
        creator: "Test User"
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body[0].appleAlbumID.should.equal(0004)
        done()
      })
  })
  it('should get the other side of the new connection', function(done){
    request
      .get('/api/v1/connection/0004')
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body[0].appleAlbumID.should.equal(0003)
        done()
      })
  })
  it('should remove the connection between the new albums', function(done){
    request
      .delete('/api/v1/connection')
      .send({
        albumOne: newAlbumOne.appleAlbumID,
        albumTwo: newAlbumTwo.appleAlbumID,
        creator: "Test User"
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.message.should.equal('This user has not created any connections for this album.')
        done()
      })
  })
  it('should delete the first new album', function(done) {
    request
      .delete(`/api/v1/album/${newAlbumOne.appleAlbumID}`)
      .send({
        "apiToken": apiToken
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        done()
      })
  })
  it('should delete the second new album', function(done) {
    request
      .delete(`/api/v1/album/${newAlbumTwo.appleAlbumID}`)
      .send({
        "apiToken": apiToken
      })
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
  it('should add a new album to favorites', function(done){
    request
      .post('/api/v1/favorite')
      .send({
        user: "Test User",
        album: {
          appleAlbumID: 0005,
          appleURL: "Test Apple URL",
          title: "Test Title",
          artist: "Test Artist",
          songNames: [ "Test Song 1", "My Love Is Not A Test" ],
          cover: "Test Cover",
          releaseDate: "2019-04-01",
          recordCompany: "Test Records",
          genres: [ "Genre 1", "Genre 2" ]
        }
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.message.should.equal("Favorite added!")
        done()
      })
  })
  it('should remove the new album from favorites', function(done){
    request
      .delete('/api/v1/favorite')
      .send({
        user: "Test User",
        appleAlbumID: 0005
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.message.should.equal("Album successfully removed from user favorites.")
        done()
      })
  })
  it('should delete the new album', function(done) {
    request
      .delete('/api/v1/album/0005')
      .send({
        "apiToken": apiToken
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        done()
      })
  })
})

// ====== TESTING CREATE/EDIT/DELETE LIST FUNCTIONALITY ======
describe('create, edit, delete list', function() {
  let newListID
  it('should create a new list', function(done){
    request
      .post('/api/v1/list')
      .send({
        user: "Test User",
        displayName: "T. User",
        title: "Test List",
        isPrivate: false
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        newListID = res.body.id
        done()
      })
  })
  it('should change the list title', function(done){
    request
      .put('/api/v1/list/' + newListID)
      .send({
        title: "Improved Test List",
        method: "change title"
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.title.should.equal("Improved Test List")
        done()
      })
  })
  it('should change the list display name', function(done){
    request
      .put('/api/v1/list/' + newListID)
      .send({
        displayName: "Test User I",
        method: "change display name"
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.displayName.should.equal("Test User I")
        done()
      })
  })
  it('should delete the new list', function(done){
    request
      .delete('/api/v1/list/' + newListID)
      .send({
        "apiToken": apiToken
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.message.should.equal("List deleted!")
        done()
      })
  })
})

// ====== TESTING ADD TO LIST FUNCTIONALITY ======
describe('add albums to a new list', function() {
  let newListID
  it('create a new list with a new album', function(done){
    request
      .post('/api/v1/list')
      .send({
        user: "Test User",
        displayName: "T. User",
        title: "Test List",
        isPrivate: false,
        albums: [
          {
            appleAlbumID: 0006,
            appleURL: "Test Apple URL",
            title: "Test Title",
            artist: "Test Artist",
            songNames: [ "Test Song 1", "My Love Is Not A Test" ],
            cover: "Test Cover",
            releaseDate: "2019-04-01",
            recordCompany: "Test Records",
            genres: [ "Genre 1", "Genre 2" ]
          }
        ]
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        newListID = res.body.id
        done()
      })
  })
  it('should add a second new album to the list', function(done){
    request
      .put('/api/v1/list/' + newListID)
      .send({
        method: "add album",
        appleAlbumID: 0007,
        appleURL: "Test URL 2",
        title: "Test Album Two",
        artist: "Nifty Artist",
        releaseDate: "2019-04-01",
        recordCompany: "Test Records",
        cover: "Test URL 2",
        songNames: [ "Test Song 1", "My Love Is Not A Test" ],
        genres: [ "Hair Jazz", "Quite Delicate" ]
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        done()
      })
  })
  it('should return both new albums with the list', function(done){
    request
      .get('/api/v1/list/' + newListID)
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.albums.length.should.equal(2)
        done()
      })
  })
  it('should delete the new list', function(done){
    request
      .delete('/api/v1/list/' + newListID)
      .send({
        "apiToken": apiToken
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.message.should.equal("List deleted!")
        done()
      })
  })
  it('should delete the first new album', function(done) {
    request
      .delete('/api/v1/album/0006')
      .send({
        "apiToken": apiToken
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        done()
      })
  })
  it('should delete the second new album', function(done) {
    request
      .delete('/api/v1/album/0007')
      .send({
        "apiToken": apiToken
      })
      .expect("Content-type",/json/)
      .expect(200)
      .end(function(err,res){
        res.status.should.equal(200)
        done()
      })
  })
})