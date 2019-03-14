const express = require('express');
const router = express.Router();
const album_controller = require('../controllers/album.controller');

router.get('/:userID', album_controller.get_user_favorites);
router.post('/', album_controller.add_favorite);
router.delete('/', album_controller.delete_favorite);

module.exports = router;