var express = require('express');
var router = express.Router(); 
var request = require('request'); 

router.get('/', function(req, res, next) {
    // res.setHeader("Cache-Control", "private, max-age=600");
    res.render('alltags', {
        pageTitle: ': All Tags',
        subTitle: 'Search All Tags',
    });
});

router.get('/database', function(req, res, next) {
    // res.setHeader("Cache-Control", "private, max-age=600");
    var db = req.db;
    var collection = db.get('musictags');
    collection.find({}, {}, function(e,docs){
        res.json(docs);
    })
});

// ======== NEW TAGS COLLECTION ===========
router.get('/newtags/database', function(req, res, next) {
    // res.setHeader("Cache-Control", "private, max-age=600");
    var db = req.db;
    var collection = db.get('album-tags');
    collection.find({}, {}, function(e,docs){
        res.json(docs);
    })
});

module.exports = router;
