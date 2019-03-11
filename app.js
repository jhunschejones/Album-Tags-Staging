if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
  require('dotenv').load();
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

// ====== Set up database connection ======
const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false)
mongoose.connect(process.env.MONGO_STRING, { useNewUrlParser: true })
let db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

// ====== Set up routes ======
const albumRoutes = require('./routes/album.routes')
const listRoutes = require('./routes/list.routes')
const appleAPIRoutes = require('./routes/appleAPI.routes')
const staticRoutes = require('./routes/static.routes')
const utilityRoutes = require('./routes/utility.routes')
app.use('/api/utility', utilityRoutes)
app.use('/api/v1/album', albumRoutes)
app.use('/api/v1/list', listRoutes)
app.use('/api/v1/apple', appleAPIRoutes)
app.use('/', staticRoutes)

// ====== Error Handler ======
app.use(function(err, res) {
	res.status(err.status || 404);
	res.render('error', { error: err.message || "Page not found." });
});

module.exports = app
