const qs = require("querystring")
const axios = require('axios')
const fs = require('fs')

// Fonction pour enregistrer le token Spotify dans le fichier JSON des utilisateurs
function storeSpotifyToken(username, spotifyToken) {
    const data = JSON.parse(fs.readFileSync('./database/data.json', 'utf8'))
    const userIndex = data.users.findIndex(user => user.username === username)

    if (userIndex !== -1) {
        data.users[userIndex].spotifyToken = spotifyToken
        fs.writeFileSync('./database/data.json', JSON.stringify(data))
    } else {
        console.log('Utilisateur non trouvé')
    }
}

const spotifyController = {
    /**
     * 
     * LOGIN via la page de connexion avec spotify, avec le protocole OAuth 2.0
     * 
     */
    async oAuthLogin(req, res) {
        const username = req.username
        const scopes = 'user-read-private user-read-email user-top-read user-library-read user-read-playback-state user-modify-playback-state playlist-modify-public user-read-currently-playing'

        res.redirect('https://accounts.spotify.com/authorize' +
                '?response_type=code' +
                '&client_id=' + process.env.CLIENT_ID +
                (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
                '&redirect_uri=' + encodeURIComponent(process.env.REDIRECT_URI)) +
            '&state=' + username
    },

    /**
     * 
     * Gestion de la redirection après l'authentification Spotify
     * 
     */
    async oAuthCallback(req, res) {
        const code = req.query.code || null;
        const username = req.query.state || null;

        try {
            const response = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
                code: code,
                redirect_uri: process.env.REDIRECT_URI,
                grant_type: 'authorization_code'
            }), {
                headers: {
                    'Authorization': 'Basic ' + (Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64')),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const access_token = response.data.access_token;

            // On peut maintenant enregistrer le token Spotify dans le fichier JSON des utilisateurs
            storeSpotifyToken(username, access_token)
            res.send('Access Token: ' + access_token)

        } catch (error) {
            console.error(error);
            res.status(500).send('Erreur lors de la récupération du token Spotify');
        }
    },

    /**
     * 
     * GET SPOTIFY USER TOP SONGS
     * 
     */
    async getUserPersonality(req, res) {
        console.log('coucou')
        try {
            // Récupérer les chansons les plus écoutées par l'utilisateur
            const url = 'https://api.spotify.com/v1/me/tracks&limit=50'
            const headers = {
                'Authorization': 'Bearer ' + req.spotifyToken
            }

            const response = await axios.get(url, {
                headers: headers
            })
            const tracks = response.data.items;

            // Si l'utilisateur n'a pas de chansons likées, on renvoie une erreur
            if (tracks.length === 0) {
                return res.status(400).send('Aucune chanson likée, personnalité impossible à définir')
            }

            // Sinon, on récupère les ids des chansons pour pouvoir récupérer les caractéristiques audio
            const trackIds = tracks.map(track => track.id).join(',')

            // Récupérer les caractéristiques audio des chansons
            const audioFeaturesUrl = `https://api.spotify.com/v1/audio-features?ids=${trackIds}`
            const audioFeaturesResponse = await axios.get(audioFeaturesUrl, {
                headers: headers
            })

            const audioFeatures = audioFeaturesResponse.data.audio_features

            // Fonction 'Moyenne' pour obtenir les moyennes des caractéristiques audio
            const average = (arr, prop) => arr.reduce((acc, cur) => acc + cur[prop], 0) / arr.length

            // Synthétiser les données pour obtenir la personnalité de l'utilisateur
            danceAvg = average(audioFeatures, 'danceability')
            tempoAvg = average(audioFeatures, 'tempo')
            instrumentalnessAvg = average(audioFeatures, 'instrumentalness')
            speechinessAvg = average(audioFeatures, 'speechiness')
            valenceAvg = average(audioFeatures, 'valence')

            // Renvoyer la "personnalité" audio de l'utilisateur 
            res.send({
                dance: (danceAvg * 10),
                agitation: (tempoAvg) + 200,
                preference: (instrumentalnessAvg > speechinessAvg) ? 'instrumental' : 'vocal',
                attitude: (valenceAvg > 0.5) ? 'positive' : 'negative'
            })

        } catch (error) {
            console.log(error)
            res.status(500).send('Erreur lors de la récupération des chansons Spotify ou des statistiques audio')
        }
    },

    /**
     * 
     * GET SPOTIFY USER TOP SONGS
     * 
     */
    async getUserPersonality(req, res) {
        try {
            // Récupérer les chansons les plus écoutées par l'utilisateur
            const url = 'https://api.spotify.com/v1/me/top/tracks?limit=10'
            const headers = {
                'Authorization': 'Bearer ' + req.spotifyToken
            };

            const response = await axios.get(url, {
                headers
            });
            const tracks = response.data.items

            // Si l'utilisateur n'a pas de chansons likées, on renvoie une erreur
            if (tracks.length === 0) {
                return res.status(400).send('Aucune chanson likée, personnalité impossible à définir')
            }

            // Sinon, on récupère les ids des chansons pour pouvoir récupérer les caractéristiques audio
            const trackIds = tracks.map(track => track.id).join(',');

            // Récupérer les caractéristiques audio des chansons
            const audioFeaturesUrl = `https://api.spotify.com/v1/audio-features?ids=${trackIds}`
            const audioFeaturesResponse = await axios.get(audioFeaturesUrl, {
                headers: headers
            });

            const audioFeatures = audioFeaturesResponse.data.audio_features

            // Fonction 'Moyenne' pour obtenir les moyennes des caractéristiques audio
            const average = (arr, prop) => arr.reduce((acc, cur) => acc + cur[prop], 0) / arr.length

            // Synthétiser les données pour obtenir la personnalité de l'utilisateur
            danceAvg = average(audioFeatures, 'danceability')
            tempoAvg = average(audioFeatures, 'tempo')
            instrumentalnessAvg = average(audioFeatures, 'instrumentalness')
            speechinessAvg = average(audioFeatures, 'speechiness')
            valenceAvg = average(audioFeatures, 'valence')

            // Renvoyer la "personnalité" audio de l'utilisateur
            res.send({
                dance: Math.round(danceAvg * 10),
                agitation: Math.round(tempoAvg),
                preference: (instrumentalnessAvg > speechinessAvg) ? 'instrumental' : 'vocal',
                attitude: (valenceAvg > 0.5) ? 'positive' : 'negative'
            })

        } catch (error) {
            console.log(error);
            res.status(500).send('Erreur lors de la récupération des chansons Spotify ou des statistiques audio')
        }
    },

    /**
     * 
     * SYNC CURRENT TRACK WITH GROUP MEMBERS
     * 
     */
    async syncCurrentTrack(req, res) {
        try {
            // Récupérer la musique et la progression dans le morceau
            const url = 'https://api.spotify.com/v1/me/player/currently-playing'
            const headers = {
                'Authorization': 'Bearer ' + req.spotifyToken
            }

            const response = await axios.get(url, {
                headers
            })

            const trackURI = response.data.context.uri
            const trackProgress = response.data.progress_ms

            // Trouver le groupe dans lequel le user se trouve
            const data = JSON.parse(fs.readFileSync('./database/data.json', 'utf8'))
            const groups = data.groups
            const myGroup = groups.find(group => group.members.includes(req.username))
            if (!myGroup) {
                return res.status(400).send("Le user n'appartient à aucun groupe")
            }

            // Pour chaque membre de mon groupe, récupérer les infos de chaque de user
            const myGroupUsers = myGroup.members.map(member => {
                const user = data.users.find(user => user.username == member)
                return user
            })

            // Création d'un tableau de promesses pour les appels API
            const spotifyCalls = []

            for (const user of myGroupUsers) {
                const url = 'https://api.spotify.com/v1/me/player/play'
                const headers = {
                    'Authorization': 'Bearer ' + user.spotifyToken,
                    'Content-Type': "application/json"
                }
                const body = {
                    context_uri: trackURI,
                    position_ms: trackProgress
                }

                // Ajout de la promesse au tableau
                spotifyCalls.push(spotifyController.callSpotifyAPI(user, url, body, headers))
            }

            // Attendre que toutes les promesses soient résolues avec Promise.all
            const results = await Promise.all(spotifyCalls)
            console.log("Résultats des appels API : ", results)

            res.send(results)

        } catch (err) {
            console.log(err)
            res.status(500).send("Erreur lors de la récupération du titre en cours")
        }
    },

    /**
     * Crée une Promesse d'appel au service Spotify
     */
    async callSpotifyAPI(user, url, body, headers) {
        try {
            await axios.put(url, body, {
                headers
            })
            console.log("Appel API Spotify **réussi** pour : ", user.username)
            return {
                user,
                success: true
            }
        } catch (err) {
            console.log("Appel API Spotify **échoué** pour : ", user.username)
            return {
                user,
                success: false
            }
        }
    }
}

module.exports = spotifyController