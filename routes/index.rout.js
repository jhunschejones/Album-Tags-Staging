var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.setHeader("Cache-Control", "private, max-age=600");
    res.render('index', { 
      pageTitle: "",
      subTitle: "Find Something New",
  });
});

module.exports = router;
