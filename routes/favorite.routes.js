const express = require('express');
const router = express.Router();
const album_controller = require('../controllers/album.controller');

router.get('/:userID', album_controller.get_user_favorites);
router.post('/', album_controller.add_favorite);
router.delete('/', album_controller.delete_favorite);
router.post('/virtual/:id', album_controller.create_virtual_favorites_list);
router.get('/virtual/:id', album_controller.get_virtual_favorites_list);

module.exports = router;