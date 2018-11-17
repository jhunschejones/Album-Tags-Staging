// const newrelic = require('newrelic')
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

// ====== Set up database connection ======
const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false)
mongoose.connect('mongodb://joshua:roofuzz@album-tags-shard-00-00-qntxy.mongodb.net:27017,album-tags-shard-00-01-qntxy.mongodb.net:27017,album-tags-shard-00-02-qntxy.mongodb.net:27017/Album-Tags?ssl=true&replicaSet=Album-Tags-shard-0&authSource=admin&retryWrites=true', { useNewUrlParser: true })
let db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

// ====== Set up routes ======
const albumRoutes = require('./routes/album.routes')
const appleAPIRoutes = require('./routes/appleAPI.routes')
const staticRoutes = require('./routes/static.routes')
app.use('/api/v1/album', albumRoutes)
app.use('/api/v1/apple', appleAPIRoutes)
app.use('/', staticRoutes)

// This functionality is in `lib/www.js` now
// const PORT = process.env.PORT || 3000
// app.listen(PORT, () => {
//   // console.log(`Albumtags worker ${cluster.worker.id} is running on port ${PORT}.`)
// })

module.exports = app