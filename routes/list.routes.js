const express = require('express');
const router = express.Router();
const album_controller = require('../controllers/album.controller');

router.post('/', album_controller.create_new_list);
router.get('/:list', album_controller.get_list);
router.put('/:list', album_controller.update_list);
router.delete('/:list', album_controller.delete_list);
router.get('/user/:userID', album_controller.get_user_lists);
router.get('/album/:appleAlbumID', album_controller.get_album_lists);

module.exports = router;