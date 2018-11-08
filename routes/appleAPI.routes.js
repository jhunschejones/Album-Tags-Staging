const express = require('express')
const router = express.Router()

const apple_api_controller = require('../controllers/appleAPI.controller')

router.get('/details/:appleAlbumID', apple_api_controller.return_album_details)
router.get('/search/:search', apple_api_controller.search_by_album_or_artist)

module.exports = router