const express = require('express');
const router = express.Router(); 

/* GET album details page. */
router.get('/:albumId', function(req, res, next) {
  res.render('albumdetails', {
    pageTitle: ': Details',
    subTitle: 'Album Details',
    albumId: req.params.albumId
  });
});

module.exports = router;
