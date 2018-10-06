const express = require('express');
const router = express.Router(); 

router.get('/', function(req, res, next) {
  res.render('alltags', {
    pageTitle: ': All Tags',
    subTitle: 'Search All Tags',
  });
});

module.exports = router;
