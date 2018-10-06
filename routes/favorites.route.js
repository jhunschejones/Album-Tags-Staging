const express = require('express')
const router = express.Router() 

/* GET our favorites page. */
router.get('/', function(req, res, next) {
    res.setHeader("Cache-Control", "private, max-age=600")
    res.render('favorites', { 
      pageTitle: `: ${(new Date()).getFullYear()}`,
      subTitle: `Our Favorite Albums of ${(new Date()).getFullYear()}`
  })
})

module.exports = router
