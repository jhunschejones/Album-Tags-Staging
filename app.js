var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compression = require('compression')

// security
var helmet = require('helmet'); 
var redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;
// var csp = require('express-csp-header');
var cors = require('cors');

var index = require('./routes/index.route');
var about = require('./routes/about.route')
var favorites = require('./routes/favorites.route');
var myfavorites = require('./routes/myfavorites.route')
var search = require('./routes/search.route');
var albumdetails = require('./routes/albumdetails.route');
var update = require('./routes/update.route');
var alltags = require('./routes/alltags.route');
var apiRout = require('./routes/api.v1.route')

// Connecting my database
var mongo = require('mongodb');
var monk = require('monk');
// var db = monk('mongodb://joshua:roofuzz@ds263948.mlab.com:63948/music-tags');
var db = monk('mongodb://joshua:roofuzz@album-tags-shard-00-00-qntxy.mongodb.net:27017,album-tags-shard-00-01-qntxy.mongodb.net:27017,album-tags-shard-00-02-qntxy.mongodb.net:27017/Album-Tags?ssl=true&replicaSet=Album-Tags-shard-0&authSource=admin&retryWrites=true');

// Use this to see when the database is connected
// db.then(() => {
//   console.log('Connected correctly to database server')
// })

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// security
app.use(helmet());
app.use(redirectToHTTPS([/localhost:(\d{4})/]));
app.use(cors());


// Making my DB accessable to the router
app.use(function(req,res,next){
	req.db = db;
	next();
});

// compress all responses
app.use(compression())

app.use('/', index);
app.use('/about', about);
app.use('/favorites', favorites);
app.use('/myfavorites', myfavorites);
app.use('/search', search);
app.use('/albumdetails', albumdetails);
app.use('/update', update);
app.use('/alltags', alltags);
app.use('/api/v1', apiRout);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
