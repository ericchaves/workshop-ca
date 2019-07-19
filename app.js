// Module Dependencies
// -------------------
const express = require('express')
const path = require('path')
const serveStatic = require('serve-static')
const bodyParser = require('body-parser')
const app = express()

// Configure Express
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(serveStatic(path.join(__dirname, 'public')))

// Register middleware that parses the request payload.
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(require('body-parser').raw({
  type: 'application/jwt'
}))

// Set application routes, using /routes/index.js
const routes = require('./routes')
app.use('/', routes)

// Start server
var port = process.env.PORT || 8081
app.listen(port)
console.log('server started ' + port)

