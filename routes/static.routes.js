const express = require('express')
const router = express.Router()

// GET home page
router.get('/', function(req, res, next) {
  res.setHeader("Cache-Control", "private, max-age=600")
  res.render('index', { 
    pageTitle: "",
    subTitle: "Find Something New",
  })
})

// GET about page
router.get('/about', function(req, res, next) {
  res.render('about', { 
    pageTitle: ": About",
    subTitle: "What is Album Tags?",
    thisYear: `${(new Date()).getFullYear()}`
  })
})

// GET album details page
router.get('/albumdetails/:albumId', function(req, res, next) {
  // res.render('albumdetails', {
  //   pageTitle: ': Details',
  //   subTitle: 'Album Details',
  //   albumId: req.params.albumId
  // })
  res.redirect('/album/' + req.params.albumId)
})

// GET album page
router.get('/album/:albumId', function(req, res, next) {
  res.render('album', {
    pageTitle: ': Details',
    subTitle: 'Album Details'
  })
})

// GET alltags page 
router.get('/alltags', function(req, res, next) {
  res.render('alltags', {
    pageTitle: ': All Tags',
    subTitle: 'Search All Tags',
  })
})

// GET our favorites page
router.get('/favorites', function(req, res, next) {
  res.setHeader("Cache-Control", "private, max-age=600")
  res.render('favorites', { 
    pageTitle: `: ${(new Date()).getFullYear()}`,
    subTitle: `Our Favorite Albums of ${(new Date()).getFullYear()}`
  })
})

// GET "my favorites" page
router.get('/myfavorites', function(req, res, next) {
  res.setHeader("Cache-Control", "private, max-age=600")
  res.render('myfavorites', { 
    pageTitle: ': My Favorites',
    subTitle: 'Your Favorite Albums'
  })
})

// GET search page
router.get('/search', function(req, res, next) {
  res.setHeader("Cache-Control", "private, max-age=600")
  res.render('search', {
    pageTitle: ': Search',
    subTitle: 'Search By Album or Artist'
  })
})

// GET tags-search page
router.get('/search/tags/:selectedtags', function(req, res, next) {
  res.render('tagsearch', {
    pageTitle: ': Tag Search',
    subTitle: 'Tag Search Results',
    selectedTags: req.params.selectedtags
  })
})

// GET album update page
router.get('/update/:albumId', function(req, res) {
  // res.render('update', {
  //   pageTitle: ': Update',
  //   subTitle: 'Update Album Tags',
  //   albumId: req.params.albumId
  // })
  res.redirect('/album/' + req.params.albumId)
})

// GET my-lists page
router.get('/mylists', function(req, res) {
  res.render('mylists', {
    pageTitle: ': My Lists',
    subTitle: 'Create & Manage Album Lists'
  })
})

// GET specific lists page
router.get('/list', function(req, res) {
  res.render('list', {
    pageTitle: ': List',
    subTitle: 'View & Edit Album Lists'
  })
})

// GET utility page
router.get('/utility', function(req, res) {
  res.render('utility', {
    pageTitle: ': Utility',
    subTitle: 'Utility Tools',
  })
})

module.exports = router