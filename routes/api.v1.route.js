const express = require('express')
const router = express.Router()
const request = require('request') 

// albumtags.com/api/v1/
router.get('/', function (req, res, next) {
  res.send("Welcome to the new API endpoint!")
})

// For retrieving album details from Apple API
// albumtags.com/api/v1/apple/albumdetails/:albumId
router.get('/apple/albumdetails/:albumId', function(req, res, next) {
  const jwtToken = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik05OVpGUEMyR1UifQ.eyJpYXQiOjE1MzExODgwMDQsImV4cCI6MTU0Njc0MDAwNCwiaXNzIjoiUzJaUDI1NlBQSyJ9.drOZUEcvLw_r0NeU_0_HNIWA3RcMLr4rtArUNt0QGmCe2dwXIrSzrUTgpyjcQcpIJob-mYJzVczlunOkvAljDg'
  const thisAlbum = req.params.albumId

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
      console.log(err)  
      res.send({ "error" : err })
      return
    } else { 
      res.setHeader("Cache-Control", "private, max-age=600")
      res.json(body)
    }  
  })
})

// For retrieving search results from Apple API
// albumtags.com/api/v1/apple/search/:request
router.get('/apple/search/:request', function(req, res, next) {
  const jwtToken = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik05OVpGUEMyR1UifQ.eyJpYXQiOjE1MzExODgwMDQsImV4cCI6MTU0Njc0MDAwNCwiaXNzIjoiUzJaUDI1NlBQSyJ9.drOZUEcvLw_r0NeU_0_HNIWA3RcMLr4rtArUNt0QGmCe2dwXIrSzrUTgpyjcQcpIJob-mYJzVczlunOkvAljDg'
  const thisSearch = req.params.request
  request.get(  
  {  
    url: `https://api.music.apple.com/v1/catalog/us/search?term=${thisSearch}&limit=25&types=artists,albums`, 
    auth: {  
      bearer: jwtToken  
    },  
    json: true  
  },  
  (err, response, body) => {  
    if (err) {  
      console.error(err)  
      res.send({ "error" : err })
      return
    } else { 
      res.setHeader("Cache-Control", "private, max-age=600")
      res.json(body)
      return
    }  
  })
})

// For retrieving all data from the Mlab MongoDB tags database
// albumtags.com/api/v1/tags
router.get('/tags', function (req, res, next) {
  const db = req.db
  const collection = db.get('album-tags')
  collection.find({}, {}, function (err, docs) {
    if(err){
      res.send({ "error" : err })
      console.error(err)
      return
    } else {
      if (docs.length === 0) {
        console.log('No results found')
        res.send({ "message" : 'no results' })
        return
      } else {
        res.json(docs)
      }
    }
  })
})

// For retrieving a specific album's data from the Mlab MongoDB tags database
// albumtags.com/api/v1/tags/:albumId
router.get('/tags/:albumId', function (req, res, next) {
  const db = req.db
  const collection = db.get('album-tags')
  const thisAlbum = req.params.albumId
  collection.find({ "albumId" : thisAlbum }, function (err, docs) {
    if(err){
      res.send({ "error" : err })
      console.error(err)
      return
    } else {
      if (docs.length === 0) {
        console.error(`No result matching query: ${thisAlbum}`)
        res.send({ "message" : `no result matching query: ${thisAlbum}` })
        return
      } else {
        res.json(docs)
      }
    }
  })
})

// For retrieving all albums with a specific set of tags
// albumtags.com/api/v1/tags/selection/:tags
router.get('/tags/selection/:tags', function(req, res, next) {
  const db = req.db
  const collection = db.get('album-tags')
  var selectedTags = req.params.tags

  // clean up tags pulled out of url
  selectedTags = selectedTags.split(",")
  selectedTags.forEach(element => {
    // go through the array and remove the item 
    let index = selectedTags.indexOf(element)
    selectedTags.splice(index, 1)
    // trim any spaces off the ends of the item
    element = element.trim()
    // put the item back in the array
    selectedTags.push(element)
  })

  collection.find({ "tags" : { $all: selectedTags } }, function (err,docs) {
    if(err){
        res.send({ "error" : err })
        console.error(err)
        return
    } else {
      if (docs.length === 0) {
        console.error(`no result matching query: ${selectedTags}`)
        res.send({ "message" : `no result matching query: ${selectedTags}` })
        return
      } else {
        res.json(docs)
      }
    }
  })
})

// For adding a record for a new album to the Mlab MongoDB tags database
// albumtags.com/api/v1/tags
router.post('/tags', function (req, res) {
  const db = req.db
  const collection = db.get('album-tags')
  collection.insert(req.body, function (err, result) {
    if(err){
      console.error(err)
      res.send({ "error" : err })
      return
  } else {
    if (docs.length === 0) {
      res.sendStatus(400)
      return
    } else {
      res.sendStatus(200)
    }
  }
  })
})

// For updating a record for a specific album to the Mlab MongoDB tags database
// albumtags.com/api/v1/tags/:albumId
router.put('/tags/:albumId', function(req, res) {
  const db = req.db
  const collection = db.get('album-tags')
  const thisAlbum = req.params.albumId

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
    },
    // https://stackoverflow.com/questions/24853114/how-to-handle-error-when-mongodb-collection-is-updating-in-javascriptnode-js
    function(err, result) {
      if (err) { 
        console.log(err) 
        res.send(err) 
        return
      }

      if (result) {
        res.sendStatus(200) 
        return
      } 
    }
  )
})

module.exports = router
