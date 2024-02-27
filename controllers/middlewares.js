const fs = require('fs')
const jwt = require('jsonwebtoken')

const middlewares = {
    /**
     * 
     * VERIFY TOKEN
     * (middleware pour vérifier si l'utilisateur est authentifié)
     * 
     */
    verifyToken(req, res, next) {
        const authorization = req.headers['authorization']

        if (!authorization) {
            return res.status(403).send('Un token est requis pour l\'authentification');
        }

        // Le token arrive sous la forme "Bearer <token>"
        // Donc on sépare la chaine de texte en 2 parties à partir de l'espace, et on prend la 2ème partie pour récupérer le token
        const token = authorization.split(' ')[1]

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.username = decoded.username
        } catch (err) {
            return res.status(401).send('Token invalide')
        }

        // Avec Express, appeler "next()" fait passer la requête au prochain controller avec les paramètres req/res modifiés
        // Dans le cas présent, on ajoute le nom d'utilisateur décodé dans req.username
        next()
    },

    /**
     * 
     * SET THE SPOTIFY TOKEN
     * 
     */
    setSpotifyToken(req, res, next) {
        const username = req.username

        // Lecture des utilisateurs depuis le fichier
        const data = JSON.parse(fs.readFileSync('./database/data.json', 'utf8'))
        const users = data.users

        // Recherche de l'utilisateur
        const user = users.find(user => user.username === username)
        if (!user) {
            return res.status(400).send('Utilisateur non trouvé.')
        }

        // Vérifiez si l'utilisateur a un token Spotify
        if (!user.spotifyToken) {
            return res.status(400).send("L'utilisateur n'a pas de token Spotify.")
        }

        // Met le token Spotify dans req.spotifyToken pour pouvoir l'utiliser dans le prochain controlleur
        req.spotifyToken = user.spotifyToken

        // Avec Express, appeler "next()" fait passer la requête au prochain controller avec les paramètres req/res modifiés
        next()
    }
}

module.exports = middlewares