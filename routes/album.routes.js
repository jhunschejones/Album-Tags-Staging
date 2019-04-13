const express = require('express');
const router = express.Router();
const album_controller = require('../controllers/album.controller');

router.get('/', album_controller.get_all_albums);
router.post('/', album_controller.add_new_album);
router.get('/:appleAlbumID', album_controller.get_album);
router.delete('/:appleAlbumID', album_controller.delete_album);
// router.delete('/', album_controller.reset_database); // temporary utility to drop all tables quickly from postman

module.exports = router;