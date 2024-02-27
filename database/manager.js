/**
 * 
 * DATABASE MANAGER
 * 
 * Here we simulate a database using a JSON file to store users and groups.
 * 
 */
const fs = require('fs')

const databaseController = {
    read() {
        return JSON.parse(fs.readFileSync(__dirname + '/data.json', 'utf8'))
    },

    update(data) {
        fs.writeFileSync(__dirname + '/data.json', JSON.stringify(data))
    },

    getUser(username) {
        const data = this.read()
        const users = data.users
        return users.find(user => user.username === username)
    },

    getUserSpotifyToken(username) {
        const data = this.read()
        const users = data.users
        const user = users.find(user => user.username === username)
        if (!user) return false
        return user.spotifyToken
    }
}

module.exports = databaseController