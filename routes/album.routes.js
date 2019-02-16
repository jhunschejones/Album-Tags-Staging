const express = require('express')
const router = express.Router()

const album_controller = require('../controllers/album.controller')

// Album CRUD functionality
router.get('/', album_controller.return_all_albums)
router.post('/', album_controller.add_new_album)
router.get('/:id', album_controller.get_album_details) // by database _id
router.put('/:id', album_controller.update_entire_album)
router.delete('/:id', album_controller.delete_album)
router.get('/albumid/:id', album_controller.find_by_apple_album_id) // by appleAlbumID
// connections and tags
router.post('/tags/:id', album_controller.add_tag)
router.delete('/tags/:id', album_controller.delete_tag)
router.post('/connections/:id', album_controller.add_connection)
router.delete('/connections/:id', album_controller.delete_connection)
router.get('/matchingtags/:tags', album_controller.find_by_tags)
// favorites
router.get('/favorites/:user', album_controller.get_favorites)
router.post('/favorites/:id', album_controller.add_favorite) // by database _id
router.delete('/favorites/:id', album_controller.delete_favorite) // by database _id
// utility page calls
router.get('/utility/missingtags', album_controller.find_albums_missing_tags)
router.get('/utility/blankalbums', album_controller.find_blank_albums)
router.get('/utility/duplicates', album_controller.find_duplicate_apple_album_id)

module.exports = router