const express = require('express')
const router = express.Router() 

/* GET "my favorites" page. */
router.get('/', function(req, res, next) {
    res.setHeader("Cache-Control", "private, max-age=600")
    res.render('myfavorites', { 
      pageTitle: ': My Favorites',
      subTitle: 'Your Favorited Albums'
  })
})

module.exports = router
