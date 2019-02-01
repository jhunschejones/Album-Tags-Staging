if (process.env.NODE_ENV !== 'production') {
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

// module.exports allows me to use app in tests
const app = express()
// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json())
app.use(compression())

// security
app.use(helmet())
if (process.env.NODE_ENV === 'production') { app.use(redirectToHTTPS([/localhost:(\d{4})/])) }
app.use(cors())

// limit requests to 100 per 15mins in production
const rateLimit = require("express-rate-limit");
app.enable("trust proxy"); 
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  message: "Too many requests from this IP, please try again in 15 minutes",
  statusCode: 429
});
if (process.env.NODE_ENV === 'production') { app.use("/api/", apiLimiter); }

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
app.use('/api/v1/album', albumRoutes)
app.use('/api/v1/list', listRoutes)
app.use('/api/v1/apple', appleAPIRoutes)
app.use('/', staticRoutes)

// This functionality is in `lib/www.js` now
// const PORT = process.env.PORT || 3000
// app.listen(PORT, () => {
//   // console.log(`Albumtags worker ${cluster.worker.id} is running on port ${PORT}.`)
// })

module.exports = app
