/**
 * 
 * SPOTIFY API CONTROLLERS
 * 
 */
const qs = require("querystring")
const axios = require('axios')
const db = require('../database/manager')

const spotifyController = {
    /**
     * LOGIN with Spotify, using OAuth 2.0 protocol
     * 
     * @swagger
     * /login:
     *   get:
     *     summary: LOGIN with Spotify, using OAuth 2.0 protocol.
     *     description: Redirects the user to the Spotify login page for authentication.
     *     tags: [Authentication]
     *     responses:
     *       302:
     *         description: Redirect to Spotify authentication page.
     */
    async oAuthLogin(req, res) {
        const username = req.username
        const scopes = 'user-read-private user-read-email user-top-read user-library-read user-read-playback-state user-modify-playback-state playlist-modify-public playlist-modify-private user-read-currently-playing'

        res.redirect('https://accounts.spotify.com/authorize' +
                '?response_type=code' +
                '&client_id=' + process.env.CLIENT_ID +
                (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
                '&redirect_uri=' + encodeURIComponent(process.env.REDIRECT_URI)) +
            '&state=' + username
    },

    /**
     * Manage the redirection after Spotify authentication
     * 
     * @swagger
     * /callback:
     *   get:
     *     summary: Manage the redirection after Spotify authentication.
     *     description: Handles the callback from Spotify OAuth flow, exchanges code for access token.
     *     tags: [Authentication]
     *     parameters:
     *       - in: query
     *         name: code
     *         required: true
     *         description: The authorization code returned by Spotify.
     *         schema:
     *           type: string
     *       - in: query
     *         name: state
     *         required: false
     *         description: The state parameter sent by the client to avoid CSRF.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Successfully retrieved the access token.
     *         content:
     *           text/plain:
     *             schema:
     *               type: string
     *               example: "Access Token: your_access_token_here"
     *       500:
     *         description: Error while getting the Spotify token.
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
            })

            const access_token = response.data.access_token
            spotifyController._storeSpotifyToken(username, access_token)
            res.send('Access Token: ' + access_token)

        } catch (error) {
            console.error(error);
            res.status(500).send('Error while getting the Spotify token')
        }
    },

    /**
     * GET USER PERSONALITY
     * 
     * @swagger
     * /getUserPersonality:
     *   get:
     *     summary: Get user's music listening personality.
     *     description: Analyzes the user's top listened tracks to deduce their musical personality based on various audio features.
     *     tags:
     *       - User
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Returns the user's music listening personality.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 dance:
     *                   type: integer
     *                   minimum: 0
     *                   maximum: 10
     *                   description: Danceability score on a scale of 1 to 10.
     *                 agitation:
     *                   type: integer
     *                   description: Average tempo of top tracks.
     *                 preference:
     *                   type: string
     *                   description: User's preference for instrumental or vocal tracks.
     *                 attitude:
     *                   type: string
     *                   description: User's overall positivity or negativity in music choice.
     *       400:
     *         description: No liked songs, personality impossible to define.
     *       500:
     *         description: Error while getting the Spotify songs or audio statistics.
     */
    async getUserPersonality(req, res) {
        try {
            // Get the user's top listened songs
            const url = 'https://api.spotify.com/v1/me/top/tracks?limit=10'
            const headers = {
                'Authorization': 'Bearer ' + req.spotifyToken
            }

            const response = await axios.get(url, {
                headers
            });
            const tracks = response.data.items

            // If the user has no liked songs, we send an error
            if (tracks.length === 0) {
                return res.status(400).send('No liked songs, personality impossible to define')
            }

            // Otherwise, we get the ids of the songs to get the audio features
            const trackIds = tracks.map(track => track.id).join(',')

            // Get the audio features of the songs
            const audioFeaturesUrl = `https://api.spotify.com/v1/audio-features?ids=${trackIds}`
            const audioFeaturesResponse = await axios.get(audioFeaturesUrl, {
                headers: headers
            })

            const audioFeatures = audioFeaturesResponse.data.audio_features

            // Average function to get the audio features average
            const average = (arr, prop) => arr.reduce((acc, cur) => acc + cur[prop], 0) / arr.length

            // Synthesize the data to get the user's audio "personality"
            danceAvg = average(audioFeatures, 'danceability')
            tempoAvg = average(audioFeatures, 'tempo')
            instrumentalnessAvg = average(audioFeatures, 'instrumentalness')
            speechinessAvg = average(audioFeatures, 'speechiness')
            valenceAvg = average(audioFeatures, 'valence')

            // Send the user's audio "personality"
            res.send({
                dance: Math.round(danceAvg * 10),
                agitation: Math.round(tempoAvg),
                preference: (instrumentalnessAvg > speechinessAvg) ? 'instrumental' : 'vocal',
                attitude: (valenceAvg > 0.5) ? 'positive' : 'negative'
            })

        } catch (error) {
            console.log(error);
            res.status(500).send('Error while getting the Spotify songs or audio statistics')
        }
    },

    /**
     * SYNC CURRENT TRACK WITH GROUP MEMBERS
     * 
     * @swagger
     * /syncCurrentTrack:
     *   post:
     *     summary: Synchronise le morceau actuellement joué avec tous les membres du groupe de l'utilisateur.
     *     description: Récupère le morceau actuellement joué par l'utilisateur ainsi que sa progression, puis synchronise ce morceau avec tous les membres du groupe auquel appartient l'utilisateur. Nécessite que l'utilisateur soit authentifié et membre d'un groupe.
     *     tags:
     *       - Groups
     *       - Music
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               spotifyToken:
     *                 type: string
     *                 description: Token Spotify de l'utilisateur pour accéder à ses informations de lecture en cours.
     *               username:
     *                 type: string
     *                 description: Nom d'utilisateur permettant d'identifier le membre et son groupe.
     *     responses:
     *       200:
     *         description: Retourne le résultat des appels API pour la synchronisation des morceaux chez les membres du groupe.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   status:
     *                     type: string
     *                     description: Statut de la réponse de l'API Spotify pour chaque membre du groupe.
     *                   message:
     *                     type: string
     *                     description: Message détaillant le résultat de l'opération de synchronisation pour chaque membre.
     *       400:
     *         description: Le user n'appartient à aucun groupe.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   description: Description de l'erreur.
     *       500:
     *         description: Erreur lors de la synchronisation du morceau actuel avec les membres du groupe.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   description: Description de l'erreur interne.
     */
    async syncCurrentTrack(req, res) {
        try {
            // Get the current track and its progress
            const url = 'https://api.spotify.com/v1/me/player/currently-playing'
            const headers = {
                'Authorization': 'Bearer ' + req.spotifyToken
            }

            const response = await axios.get(url, {
                headers
            })

            const trackURI = response.data.context.uri
            const trackProgress = response.data.progress_ms

            // Find the group the user is in
            const data = db.read()
            const groups = data.groups
            const myGroup = groups.find(group => group.members.includes(req.username))
            if (!myGroup) {
                return res.status(400).send("Le user n'appartient à aucun groupe")
            }

            // For each member of my group, get the user's info
            const myGroupUsers = myGroup.members.map(member => {
                const user = data.users.find(user => user.username == member)
                return user
            })

            // Creeate an array of promises for the API calls
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

                // Add the promise to the array
                spotifyCalls.push(spotifyController._callSpotifyAPI(user, url, body, headers))
            }

            // Wait for all promises to be resolved with Promise.all
            const results = await Promise.all(spotifyCalls)

            console.log("API calls result: ", results)
            res.send(results)

        } catch (err) {
            console.log(err)
            res.status(500).send("Error while syncing the current track with the group members")
        }
    },

    /**
     * CREATE A PLAYLIST FROM ANOTHER USER'S TOP TRACKS
     * 
     * @swagger
     * /createPlaylistFromUserTopTracks:
     *   post:
     *     summary: Crée une playlist à partir des morceaux les plus écoutés d'un autre utilisateur.
     *     description: Récupère les 10 morceaux les plus écoutés d'un utilisateur spécifié et crée une nouvelle playlist dans le compte Spotify de l'utilisateur actuel contenant ces morceaux.
     *     tags:
     *       - Playlists
     *       - Music
     *     parameters:
     *       - in: query
     *         name: username
     *         required: true
     *         description: Nom d'utilisateur du compte Spotify dont les top morceaux seront utilisés pour créer la playlist.
     *         schema:
     *           type: string
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Tracks added successfully to the playlist!
     *         content:
     *           application/json:
     *             schema:
     *               type: string
     *       400:
     *         description: User or spotify token not found.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   description: Description de l'erreur.
     *       500:
     *         description: Error while getting the user's top tracks or creating a playlist from them.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   description: Description de l'erreur interne.
     */
    async createPlaylistFromUserTopTracks(req, res) {
        try {
            // Get the user
            const username = req.query.username

            // Get the user's Spotify token
            const userSpotifyToken = db.getUserSpotifyToken(username)

            if (!userSpotifyToken) {
                return res.status(400).send("User or spotify token not found")
            }

            // Get user's top tracks
            const url = 'https://api.spotify.com/v1/me/top/tracks?limit=10'
            const headers = {
                'Authorization': 'Bearer ' + userSpotifyToken,
                'Content-Type': "application/json"
            }

            const response = await axios.get(url, {
                headers
            })

            userTracks = response.data.items

            if (userTracks) {

                // Create a playlist for the current user
                const currentUserSpotifyToken = db.getUserSpotifyToken(req.username)
                const spotifyUserInfos = await spotifyController._getSpotifyUserInfos(currentUserSpotifyToken)
                const spotifyUserId = spotifyUserInfos.id
                const createPlaylistUrl = `https://api.spotify.com/v1/users/${spotifyUserId}/playlists`

                const playlistResponse = await axios.post(createPlaylistUrl, {
                    name: "Top 10 Tracks Playlist from " + username,
                    description: `Created from ${username}'s top tracks.`
                }, {
                    headers: {
                        'Authorization': 'Bearer ' + currentUserSpotifyToken,
                        'Content-Type': 'application/json'
                    }
                })
                const playlistId = playlistResponse.data.id

                console.log("Playlist creared successfully (ID: ", playlistId, ")")

                // Add some tracks to the playlist
                const addTracksUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`
                const trackUris = response.data.items.map(item => item.uri)

                await axios.post(addTracksUrl, {
                    uris: trackUris
                }, {
                    headers: {
                        'Authorization': 'Bearer ' + currentUserSpotifyToken,
                        'Content-Type': 'application/json'
                    }
                })

                console.log("Tracks added successfully to the playlist!")
                res.send("Tracks added successfully to the playlist!")
            } else {
                res.status(500).send("Error while create a playlist from them")
            }

        } catch (err) {
            console.log(err)
            res.status(500).send("Error while getting the user's top tracks or create a playlist from them")
        }
    },

    /**
     * Tool function to create a Promise for a Spotify API call
     */
    async _callSpotifyAPI(user, url, body, headers) {
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
    },

    /**
     * Tool function to store the Spotify token in the users JSON file
     */
    _storeSpotifyToken(username, spotifyToken) {
        const data = db.read()
        const userIndex = data.users.findIndex(user => user.username === username)

        if (userIndex !== -1) {
            data.users[userIndex].spotifyToken = spotifyToken
            db.update(data)
        } else {
            console.log('User not found')
        }
    },

    /**
     * Tool function to get the Spotify user ID
     * 
     * @param {string} spotifyToken
     * @returns {object} Spotify user ID and display name, like {id: '123456789', pseudo: 'John Doe'}
     */
    async _getSpotifyUserInfos(spotifyToken) {
        const response = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': 'Bearer ' + spotifyToken
            }
        })

        return {
            id: response.data.id,
            pseudo: response.data.display_name
        }
    },

    /**
     * Tool function to get the Spotify user's current track and device
     * 
     * @param {string} spotifyToken
     * @returns {object} Spotify user's current track and device, like {trackURI: 'spotify:track:123456789', device: '123456789'}
     */
    async _getSpotifyUserCurrentTrack(spotifyToken) {
        try {
            const url = 'https://api.spotify.com/v1/me/player/currently-playing'
            const headers = {
                'Authorization': 'Bearer ' + spotifyToken
            }
    
            const response = await axios.get(url, {
                headers
            })
    
            const trackURI = response.data.context.uri
            const device = response.data.device.id
            return {
                track: trackURI,
                device
            }
        }
        catch(err) {
            log("Error while getting the user's current track")
            return false
        }
    }
}

module.exports = spotifyController