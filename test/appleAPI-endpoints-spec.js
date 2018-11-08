const should = require('should')
const api = require('../app.js')
const request = require('supertest').agent(api.listen())

// ====== TESTING APPLE SEARCH API ENDPOINT ======
describe('GET Apple API search results for Emery', function() {
  it('should return 200', function(done) {
    request
      .get('/api/v1/apple/search/emery')
      .expect(200)
      .end(done) 
  })
  it('should return expected result for Emery search', function(done){
    request
      .get('/api/v1/apple/search/emery')
      .expect("Content-type",/json/)
      .expect(200) 
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.artists[0].name.should.equal('Emery')
        res.body.artists[0].genres[0].should.equal('Rock')
        done()
      })
  })
})

// ====== TESTING APPLE ALBUM DETAILS API ENDPOINT ======
describe('GET Apple API search results for Emery', function() {
  it('should return 200', function(done) {
    request
      .get('/api/v1/apple/details/1434931148')
      .expect(200)
      .end(done) 
  })
  it('should return expected result for Emery search', function(done){
    request
      .get('/api/v1/apple/details/1434931148')
      .expect("Content-type",/json/)
      .expect(200) 
      .end(function(err,res){
        res.status.should.equal(200)
        res.body.title.should.equal('Eve')
        res.body.artist.should.equal('Emery')
        done()
      })
  })
})
