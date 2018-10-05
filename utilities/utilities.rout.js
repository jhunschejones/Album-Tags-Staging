var express = require('express');
var router = express.Router(); 
var request = require('request'); 

/* GET album details page. */
router.get('/', function(req, res, next) {
    res.render('utilities', {
        pageTitle: ': Utilities',
        subTitle: 'Utilities'
    });
});

// ======= SHOW ALL OLD TAGS =======
router.get('/oldtags', function(req, res, next) {
    var db = req.db;
    var collection = db.get('musictags');
    collection.find({}, {}, function(e,docs){
        res.json(docs);
    })
});


// POST WHEN NO ALBUM EXISTS IN DATABASE
router.post('/newtags/database/:albumId', function(req, res) {
    var db = req.db;
    var collection = db.get('album-tags');
    var thisAlbum = req.params.albumId;
    // console.log(req.body)
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


// FIND INFO FROM APPLE

router.get('/apple/:albumId', function(req, res, next) {
    const jwtToken = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik05OVpGUEMyR1UifQ.eyJpYXQiOjE1MzExODgwMDQsImV4cCI6MTU0Njc0MDAwNCwiaXNzIjoiUzJaUDI1NlBQSyJ9.drOZUEcvLw_r0NeU_0_HNIWA3RcMLr4rtArUNt0QGmCe2dwXIrSzrUTgpyjcQcpIJob-mYJzVczlunOkvAljDg';
    var thisAlbum = req.params.albumId;
    request.get(  
      {  
        url: `https://api.music.apple.com/v1/catalog/us/albums/${thisAlbum}`,  
        auth: {  
            bearer: jwtToken  
        },  
        json: true  
    },  
    (err, response, body) => {  
        if (err) {  
            console.log(err);  
        } else { 
            res.json(body);
        }  
    })
});

module.exports = router;