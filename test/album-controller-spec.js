const should = require('should')
const album_controller = require('../controllers/album.controller')

// ====== TESTING GETKEYWORDS UTILITY FUNCTION ======
describe('getKeyWords', function() {
  it('should return an array', function() {
    const result = album_controller.utility_getKeyWords("")
    result.should.be.an.Array()
  })
  it('result should contain only strings', function() {
    const result = album_controller.utility_getKeyWords("test")
    let arrayOfStrings = true
    result.forEach(element => {
      if (typeof element === 'string' || element instanceof String) {  }
      else { arrayOfStrings = false }
    })

    arrayOfStrings.should.not.be.false()
  })
  it('result should not contain special characters', function() {
    const result = album_controller.utility_getKeyWords("test's & more tests!")
    result.should.matchEach(/[a-zA-Z0-9]/)
  })
  it('result should not contain duplicate elements', function() {
    const result = album_controller.utility_getKeyWords("tests tests tests")
    let testResults = []
    result.forEach(element => {
      if (testResults.indexOf(element) === -1) { testResults.push(element) }
    })

    should.equal(result.length, testResults.length, 'there are duplicates in the returned array')
  })
  it('result should not contain unimportant words', function() {
    const result = album_controller.utility_getKeyWords("a test is a test and that is that")
    const unimportant = ["AND","THE","OR","OF","A", ""]
    let uninmportantWordsIncluded = []

    result.forEach(element => {
      if (unimportant.includes(element)) { uninmportantWordsIncluded.push(element) }
    })

    should.equal(uninmportantWordsIncluded.length, 0, 'unimportant words exist in the returned array')
  })
})