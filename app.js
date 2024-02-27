/**
 * 
 * APPLICATION SERVER
 * 
 * Our app creates a simple service that allows users to share music with each other using Spotify.
 * 
 * The service is auto-documented thanks to swagger-jsdoc and swagger-ui.
 * To check the API documentation, please visit http://localhost:3000/docs and enter the following URL in Swagger: http://localhost:3000/api-docs
 *  
 */
const express = require('express')
const app = express()
app.use(express.json())

// Swagger UI
const swaggerUi = require('swagger-ui-dist')
const swaggerUiPath = swaggerUi.getAbsoluteFSPath()
app.use('/docs', express.static(swaggerUiPath))

// Controllers
const middlewares = require('./controllers/middlewares')
const authentication = require('./controllers/authentication')
const groupControllers = require('./controllers/groupControllers')
const spotifyControllers = require('./controllers/spotifyAPI')

//
// Routes
//

// Authentication
app.post('/register', authentication.register)
app.post('/login', authentication.login)

// Groups
app.post('/joinGroup', middlewares.verifyToken, groupControllers.joinGroup)
app.get('/getGroupList', middlewares.verifyToken, groupControllers.getGroupList)
app.get('/getGroupMembers', middlewares.verifyToken, groupControllers.getGroupMembers)

// Spotify
app.get("/oAuthLogin", spotifyControllers.oAuthLogin)
app.get("/oAuthCallback", spotifyControllers.oAuthCallback)
app.get('/getUserPersonality', middlewares.verifyToken, middlewares.setSpotifyToken, spotifyControllers.getUserPersonality)
app.get('/syncCurrentTrack', middlewares.verifyToken, middlewares.setSpotifyToken, spotifyControllers.syncCurrentTrack)
app.get('/createPlaylistFromUserTopTracks', middlewares.verifyToken, middlewares.setSpotifyToken, spotifyControllers.createPlaylistFromUserTopTracks)

// Documentation
app.get('/api-docs', (req, res) => res.sendFile(__dirname + '/docs/swagger-output.json'))
app.get('/docs', (req, res) => res.sendFile(path.join(swaggerUiPath, 'index.html')))

// Start server
app.listen(3000, () => {
  console.log(`Serveur en écoute sur http://localhost:3000`)
})