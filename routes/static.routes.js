const express = require('express')
const router = express.Router()
const newrelic = require('newrelic')

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

// GET legacy album details page
// Deprecated winter 2018, redirecting to new `album` page
router.get('/albumdetails/:albumId', function(req, res, next) {
  newrelic.recordCustomEvent('DeprecatedPageCalled', {'call': 'GET', 'page': req.url});
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

// GET legacy our-favorites page
// Deprecated 02.25.19, redirecting to `myfavorites` page
router.get('/favorites', function(req, res, next) {
  newrelic.recordCustomEvent('DeprecatedPageCalled', {'call': 'GET', 'page': req.url});
  res.redirect('/myfavorites'); 
})

// GET custom link to Josh's favorites as a list
router.get('/josh', function(req, res, next) {
  newrelic.recordCustomEvent('JoshFavoritesCalled', {'call': 'GET', 'page': req.url});
  res.redirect(`/list?type=favorites&id=07ade7507501f3c242640832f57a323a9ca66c70b6496d0ff1b2262a9f12c83a8b45023f4eda83826b5d43726a16e7f9f50d9d60d37459f57a&year=${(new Date()).getFullYear()}`); 
})

// GET "my favorites" page
router.get('/myfavorites', function(req, res, next) {
  res.render('list', {
    pageTitle: ': My Favorites',
    subTitle: 'Your Favorite Albums'
  })
})

// GET legacy search page
// Deprecated 02.25.19, redirecting to `home` page
router.get('/search', function(req, res, next) {
  newrelic.recordCustomEvent('DeprecatedPageCalled', {'call': 'GET', 'page': req.url});
  res.redirect('/'); 
})

// GET tags-search page
router.get('/search/tags/:selectedtags', function(req, res, next) {
  res.render('tagsearch', {
    pageTitle: ': Tag Search',
    subTitle: 'Tag Search Results',
    selectedTags: req.params.selectedtags
  })
})

// GET legacy album update page
// Deprecated winter 2018, redirecting to new `album` page
router.get('/update/:albumId', function(req, res) {
  newrelic.recordCustomEvent('DeprecatedPageCalled', {'call': 'GET', 'page': req.url});
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