const express = require('express')
const router = express.Router()
const utility_controller = require('../controllers/utility.controller')

// utility page calls
router.get('/missingtags', utility_controller.find_albums_missing_tags)
router.get('/blankalbums', utility_controller.find_blank_albums)
router.get('/duplicates', utility_controller.find_duplicate_albums)
router.get('/expired', utility_controller.find_expired_albums)
router.get('/missingsongs', utility_controller.find_albums_missing_songs)
// audit calls
router.get('/audit/last', utility_controller.get_most_recent_audit)
router.delete('/audit/purge', utility_controller.purge_all_audits)

module.exports = router