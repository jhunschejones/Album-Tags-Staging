const express = require('express')
const router = express.Router()
const utility_controller = require('../controllers/utility.controller')

// utility page calls
router.get('/missingtags', utility_controller.find_albums_missing_tags)
router.get('/blankalbums', utility_controller.find_blank_albums)
router.get('/duplicates', utility_controller.find_duplicate_albums)
router.get('/expired', utility_controller.find_expired_albums)
router.get('/missingsongs', utility_controller.find_albums_missing_songs)

module.exports = router