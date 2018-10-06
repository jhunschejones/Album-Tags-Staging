const express = require('express');
const router = express.Router(); 

/* GET search page. */
router.get('/', function(req, res, next) {
  res.setHeader("Cache-Control", "private, max-age=600");
  res.render('search', {
    pageTitle: ': Search',
    subTitle: 'Search By Album or Artist'
  });
});

/* GET tags-search page. */
router.get('/tags/:selectedtags', function(req, res, next) {
  res.render('tagsearch', {
    pageTitle: ': Tag Search',
    subTitle: 'Tag Search Results',
    selectedTags: req.params.selectedtags
  });
});

module.exports = router;
