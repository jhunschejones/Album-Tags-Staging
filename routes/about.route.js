var express = require('express');
var router = express.Router();

/* GET about page. */
router.get('/', function(req, res, next) {
    res.render('about', { 
      pageTitle: "",
      subTitle: "What is Album Tags?",
      thisYear: `${(new Date()).getFullYear()}`
  });
});

/* GET contact page. */
router.get('/contact', function(req, res, next) {
  res.render('contact', { 
    pageTitle: "",
    subTitle: "Lets Get In Touch!"
  });
});

module.exports = router;
