const newrelic = require('newrelic')
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
  require('dotenv').config();
}
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const compression = require('compression')
// security
const helmet = require('helmet') 
const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS
const cors = require('cors')
// module.exports allows me to access `app` later in tests
const app = express()
// in express, this lets you call newrelic from within a template
app.locals.newrelic = newrelic;

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.set('etag', 'strong')
if (process.env.NODE_ENV !== 'development') {
  app.use(express.static(path.join(__dirname, 'public'), {
    lastModified: true,
    etag: true,
    setHeaders: function (res, filePath) {
      if (path.extname(filePath) === '.png' || path.parse(filePath).name === 'favicon') {
        res.setHeader('Cache-Control', 'public, max-age=86400')
      } else {
        res.setHeader('Cache-Control', 'public, max-age=180');
      }
    }
  }))
} else {
  app.use(express.static(path.join(__dirname, 'public')));
}
app.use(bodyParser.json())
app.use(compression())

// security
app.use(helmet())
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') { 
  app.use(redirectToHTTPS([/localhost:(\d{4})/])) 
}
app.use(cors())

// limit requests to 120 per 10mins in production and staging
const rateLimit = require("express-rate-limit");
app.enable("trust proxy"); 
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  message: "Too many requests from this IP, please try again in 15 minutes",
  statusCode: 429
});
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') { 
  app.use("/api/v1/", apiLimiter); 
}

// ====== Set up routes ======
const appleAPIRoutes = require('./routes/appleAPI.routes')
const staticRoutes = require('./routes/static.routes')
const albumRoutes = require('./routes/album.routes')
const favoriteRoutes = require('./routes/favorite.routes')
const tagRoutes = require('./routes/tag.routes')
const connectionRoutes = require('./routes/connection.routes')
const listRoutes = require('./routes/list.routes')
app.use('/api/v1/list', listRoutes)
app.use('/api/v1/connection', connectionRoutes)
app.use('/api/v1/tag', tagRoutes)
app.use('/api/v1/album', albumRoutes)
app.use('/api/v1/favorite', favoriteRoutes)
app.use('/api/v1/apple', appleAPIRoutes)
app.use('/', staticRoutes)
// ====== Error Handler ======
app.use(function(err, res) {
	res.status(err.status || 404);
	res.render('error', { error: err.message || "Page not found." });
});

module.exports = app
