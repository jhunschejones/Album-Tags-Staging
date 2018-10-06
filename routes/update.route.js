const express = require('express')
const router = express.Router() 

/* GET album update page. */
router.get('/:albumId', function(req, res) {
  res.render('update', {
    pageTitle: ': Update',
    subTitle: 'Update Album Tags',
    albumId: req.params.albumId
  })
})

module.exports = router
