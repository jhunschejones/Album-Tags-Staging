const express = require('express')
const router = express.Router()
const newrelic = require('newrelic')

const album_controller = require('../controllers/album.controller')

// Album CRUD functionality
router.get('/', album_controller.return_all_albums)
router.post('/', album_controller.add_new_album)
// Deprecated 02.20.19, redirecting to find by apple album ID endpoint
// Turned back on 03.02.19 for tests 
router.get('/:id', album_controller.get_album_details) // by database _id
// Deprecated 02.20.19, replacing with warning message
// Turned back on 03.02.19 for database error corrections 
router.put('/:id', album_controller.update_entire_album)
router.delete('/:id', album_controller.delete_album)
router.get('/albumid/:id', album_controller.find_by_apple_album_id) // by appleAlbumID
// connections and tags
router.get('/tags/all', album_controller.get_all_tags)
router.post('/tags/:id', album_controller.add_tag)
router.delete('/tags/:id', album_controller.delete_tag)
router.get('/matchingtags/:tags', album_controller.find_by_tags)
router.post('/connections/:id', album_controller.add_connection)
router.delete('/connections/:id', album_controller.delete_connection)
// favorites
router.get('/favorites/:user', album_controller.get_favorites)
router.post('/favorites/:id', album_controller.add_favorite) // by database _id
router.delete('/favorites/:id', album_controller.delete_favorite) // by database _id

module.exports = router