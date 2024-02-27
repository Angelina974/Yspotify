/**
 * 
 * MIDDLEWARES
 * 
 * Fonctions qui s'exécutent avant les controllers pour :
 * - enrichir les objets req/res
 * - vérifier des conditions, comme les tokens
 * 
 */
const db = require('../database/manager')
const jwt = require('jsonwebtoken')

const middlewares = {
    /**
     * 
     * VERIFY TOKEN
     * - Check if the user exists and has a valid token
     * - add the username to req.username
     * 
     */
    verifyToken(req, res, next) {
        const authorization = req.headers['authorization']

        if (!authorization) {
            return res.status(403).send('Un token est requis pour l\'authentification');
        }

        // The token arrives as "Bearer <token"
        // So we split the string into 2 parts from the space, and take the 2nd part to get the token
        const token = authorization.split(' ')[1]

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.username = decoded.username
        } catch (err) {
            return res.status(401).send('Token invalide')
        }

        // With Express, calling "next()" passes the request to the next controller with the modified req/res parameters
        // In this case, we add the decoded username to req.username
        next()
    },

    /**
     * 
     * SET THE SPOTIFY TOKEN
     * 
     */
    setSpotifyToken(req, res, next) {
        const username = req.username

        const data = db.read()
        const users = data.users

        // User exists?
        const user = users.find(user => user.username === username)
        if (!user) {
            return res.status(400).send('Utilisateur non trouvé.')
        }

        // User has a Spotify token?
        if (!user.spotifyToken) {
            return res.status(400).send("L'utilisateur n'a pas de token Spotify.")
        }

        // Set the token in the req object
        req.spotifyToken = user.spotifyToken

        next()
    }
}

module.exports = middlewares