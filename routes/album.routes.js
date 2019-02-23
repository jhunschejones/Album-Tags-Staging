const express = require('express')
const router = express.Router()
const newrelic = require('newrelic')

const album_controller = require('../controllers/album.controller')

// Album CRUD functionality
router.get('/', album_controller.return_all_albums)
router.post('/', album_controller.add_new_album)

// Deprecated 02.20.19, redirecting to find by apple album ID endpoint
// router.get('/:id', album_controller.get_album_details) // by database _id
router.get('/:id', function(req, res) { 
  newrelic.recordCustomEvent('DeprecatedEndpointCalled', {'call': 'GET', 'endpoint': `/api/v1/album${req.url}`})
  res.redirect('/api/v1/album/albumid/' + req.params.id); 
})

// Deprecated 02.20.19, replacing with warning message
// router.put('/:id', album_controller.update_entire_album)
router.put('/:id', function(req, res) {
  newrelic.recordCustomEvent('DeprecatedEndpointCalled', {'call': 'PUT', 'endpoint': `/api/v1/album${req.url}`})
  res.send({ "message": "the full album update endpoint was deprecated on 02.20.19" })
})

router.delete('/:id', album_controller.delete_album)
router.get('/albumid/:id', album_controller.find_by_apple_album_id) // by appleAlbumID
// connections and tags
router.post('/tags/:id', album_controller.add_tag)
router.delete('/tags/:id', album_controller.delete_tag)
router.get('/matchingtags/:tags', album_controller.find_by_tags)
router.post('/connections/:id', album_controller.add_connection)
router.delete('/connections/:id', album_controller.delete_connection)
// favorites
router.get('/favorites/:user', album_controller.get_favorites)
router.post('/favorites/:id', album_controller.add_favorite) // by database _id
router.delete('/favorites/:id', album_controller.delete_favorite) // by database _id
// utility page calls
router.get('/utility/missingtags', album_controller.find_albums_missing_tags)
router.get('/utility/blankalbums', album_controller.find_blank_albums)
router.get('/utility/duplicates', album_controller.find_duplicate_apple_album_id)

module.exports = router