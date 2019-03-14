const express = require('express');
const router = express.Router();
const album_controller = require('../controllers/album.controller');

router.get('/:tags', album_controller.find_by_tags);
router.post('/', album_controller.add_tag);
// router.delete('/', album_controller.delete_favorite);

module.exports = router;