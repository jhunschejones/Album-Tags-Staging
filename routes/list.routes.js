const express = require('express')
const router = express.Router()

const list_controller = require('../controllers/list.controller')

router.post('/', list_controller.new_list)
router.get('/:id', list_controller.get_list)
router.put('/:id', list_controller.update_list)
router.delete('/:id', list_controller.delete_list)
router.get('/album/:id', list_controller.find_lists_with_album)
router.get('/user/:id', list_controller.find_all_user_lists)
router.get('/favorites/:id', list_controller.get_virtual_favorites_list)
router.post('/favorites/:id', list_controller.create_virtual_favorites_list)

module.exports = router