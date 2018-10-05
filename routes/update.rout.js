var express = require('express');
var router = express.Router(); 
const request = require("request"); 

/* GET album update page. */
router.get('/:albumId', function(req, res) {
    res.render('update', {
        pageTitle: ': Update',
        subTitle: 'Update Album Tags',
        albumId: req.params.albumId
    });
});

router.get('/database/:albumId', function(req, res) {
    var db = req.db;
    var collection = db.get('musictags');
    var thisAlbum = req.params.albumId;
    collection.find({ "albumId" : thisAlbum }, function(e,docs){
        res.json(docs);
    })
});

// theres no logic in here really, but it takes a json aray as input and 
// uses it to replace the tags array
router.put('/database/:albumId', function(req, res) {
    var db = req.db;
    var collection = db.get('musictags');
    var thisAlbum = req.params.albumId;

    // ------ previous functionality ---------
    // collection.update({ "albumId" : thisAlbum }, {$set: { "tags" : Object.values(req.body)[0]}});
    // collection.update({ "albumId" : thisAlbum }, {$set: { "createdBy" : Object.values(req.body)[1]}});

    // ------- new functionality 07/02/18 --------
    collection.update(
        { "albumId" : thisAlbum }, 
        // https://docs.mongodb.com/manual/reference/operator/update/set/
        { $set: 
            { 
                "tags": Object.values(req.body)[0],
                "createdBy": Object.values(req.body)[1]
            }
        }
    );
    res.sendStatus(200)   
});

// POST to database
router.post('/database/:albumId', function(req, res) {
    var db = req.db;
    var collection = db.get('musictags');
    var thisAlbum = req.params.albumId;

    collection.insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});


// ================== NEW TAGS ===================

// GET NEW TAGS
router.get('/newtags/database/:albumId', function(req, res, next) {
    var db = req.db;
    var collection = db.get('album-tags');
    var thisAlbum = req.params.albumId;
    collection.find({ "albumId" : thisAlbum }, function(e,docs){
        // res.setHeader("Cache-Control", "private, max-age=600");
        res.json(docs);
    })
});

// POST WHEN NO ALBUM EXISTS IN DATABASE
router.post('/newtags/database/:albumId', function(req, res) {
    var db = req.db;
    var collection = db.get('album-tags');
    var thisAlbum = req.params.albumId;

    collection.insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

// PUT TAGS IN ALBUM IN DATABASE
router.put('/newtags/database/:albumId', function(req, res) {
    var db = req.db;
    var collection = db.get('album-tags');
    var thisAlbum = req.params.albumId;

    collection.update(
        { "albumId": thisAlbum }, 
        // https://docs.mongodb.com/manual/reference/operator/update/set/
        { $set: 
            { 
                "tags": req.body.tags,
                "createdBy": req.body.createdBy,
                "artistName": req.body.artistName,
                "albumName": req.body.albumName
            }
        }
    );
    res.sendStatus(200)   
});


module.exports = router;
