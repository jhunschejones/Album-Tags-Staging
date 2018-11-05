const should = require('should')
const appleAPI_controller = require('../controllers/appleAPI.controller')

// ====== TESTING GETSONGSARRAY UTILITY FUNCTION ======
describe('getSongsArray', function() {
  it('should return an array', function() {
    const result = appleAPI_controller.utility_getSongsArray("")
    result.should.be.an.Array()
  })
  it('should pull just song names from array of objects with pre-defined properties', function() {
    const songArray = [
      { 
        "attributes": {
          "name": "Test Song 1",
          "artist": "The Best Test Artist" 
        },
        "sneaky extra property": {
          "name": "This name should not show up"
        }
      },
      { 
        "attributes": {
          "name": "My Love Is Not A Test",
          "artist": "The Second Best Test Artist" 
        },
        "sneaky extra property": {
          "name": "This name should not show up"
        }
      }
    ]
    const result = appleAPI_controller.utility_getSongsArray(songArray)
    should.deepEqual(result, ["Test Song 1","My Love Is Not A Test"], 'the result array does not match expected')
  })
})

// ====== TESTING GETREALGENRESARRAY UTILITY FUNCTION ======
describe('getRealGenresArray', function() {
  it('should return an array', function() {
    const result = appleAPI_controller.utility_getRealGenresArray("")
    result.should.be.an.Array()
  })
  it('should remove the Music genre', function() {
    const genreArray = ["Rock","Music","Alternative"]
    const result = appleAPI_controller.utility_getRealGenresArray(genreArray)
    should.deepEqual(result, ["Rock","Alternative"], 'the result array contains an invalid genre')
  })
})