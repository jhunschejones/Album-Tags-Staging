const express = require('express');
const router = express.Router();
const album_controller = require('../controllers/album.controller');

router.get('/:appleAlbumID', album_controller.get_connections);
router.post('/', album_controller.add_connection);
router.delete('/', album_controller.delete_connection);

module.exports = router;