const express = require('express')
const app = express()
app.use(express.json())

// Controllers
const middlewares = require('./controllers/middlewares')
const authentication = require('./controllers/authentication')
const groupControllers = require('./controllers/groupControllers')
const spotifyControllers = require('./controllers/spotifyAPI')

// Routes
app.post('/register', authentication.register)
app.post('/login', authentication.login)
app.get("/oAuthLogin", spotifyControllers.oAuthLogin)
app.get("/oAuthCallback", spotifyControllers.oAuthCallback)
app.post('/joinGroup', middlewares.verifyToken, groupControllers.joinGroup)
app.get('/getGroupList', middlewares.verifyToken, groupControllers.getGroupList)
app.get('/getGroupMembers', middlewares.verifyToken, groupControllers.getGroupMembers)
app.get('/getUserPersonality', middlewares.verifyToken, middlewares.setSpotifyToken, spotifyControllers.getUserPersonality)
app.get('/syncCurrentTrack', middlewares.verifyToken, middlewares.setSpotifyToken, spotifyControllers.syncCurrentTrack)

// Start server
app.listen(3000, () => {
  console.log(`Serveur en écoute sur http://localhost:3000`)
})