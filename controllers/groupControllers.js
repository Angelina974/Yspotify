/**
 * 
 * AUTHENTICATION CONTROLLERS
 * 
 */
const db = require('../database/manager')
const spotifyController = require('./spotifyAPI')
const log = (txt) => console.log(txt)

const groupControllers = {

    /**
     * JOINGROUP
     */
    async joinGroup(req, res) {
        const {
            name
        } = req.body

        const data = db.read()
        const groups = data.groups

        // Test variables
        const groupExist = groups.find(group => group.name === name)
        const previousGroup = groups.find(group => group.members.includes(req.username))
        const wasLeaderOfPreviousGroup = groups.find(group => group.members.includes(req.username) && group.leader === req.username)

        log("Check if the group : " + name + " exists")
        if (!groupExist) {
            // Group does not exist, create it
            log("The group does not exist")

            const newGroup = {
                name: name,
                leader: req.username,
                members: [req.username]
            }
            log("The new group is : " + newGroup.name + " and the leader is : " + newGroup.leader)
            data.groups.push(newGroup)

        } else {
            // The group exists, join it
            log("The group exists, join it...")

            data.groups.forEach(group => {
                if (group.name === name) {
                    group.members.push(req.username)
                }
            })
        }

        // Was the user already in a group?
        if (previousGroup) {
            log("The user was already in the group : " + previousGroup.name)

            // Yes: remove from previous group but...
            // If the user want to join again his current group, do nothing
            if (previousGroup.name === name) {
                res.status(200).send('You was already in this group.')
                return
            }

            previousGroup.members = previousGroup.members.filter(member => member !== req.username)

            // Check if the previous group is empty after the user left
            const isPreviousGroupEmpty = previousGroup.members.length === 0

            // If the previous group is empty, remove it
            if (isPreviousGroupEmpty) {
                log("The previous group is now empty... ")
                data.groups = data.groups.filter(group => group.name !== previousGroup.name)

            } else if (wasLeaderOfPreviousGroup) {
                // Check if the user was the leader of the group
                // If yes, choose a new leader for the previous group
                log("The user was the leader of the group : " + previousGroup.name)
                const newLeader = previousGroup.members[Math.floor(Math.random() * previousGroup.members.length)]
                previousGroup.leader = newLeader
            }
        }

        db.update(data)
        res.status(200).send('Group successfully joined')
    },

    /**
     * GET GROUP LIST
     */
    async getGroupList(req, res) {
        const data = db.read()
        const groups = data.groups

        // Create a group list with the group name and the number of members
        const groupList = groups.map(groups => {
            return {
                name: groups.name,
                numberOfUsers: groups.members.length
            }
        })

        res.status(200).json(groupList)
    },

    /**
     * GET GROUP MEMBERS
     */
    async getGroupMembers(req, res) {
        const username = req.username

        const data = db.read()
        const groups = data.groups

        // Find the user's group
        const userGroup = groups.find(group => group.members.includes(username))

        // Check if the user is in a group
        if (!userGroup) {
            return res.status(403).send("You don't belong to any group.")
        }

        // Build the list of members and if the user is the leader
        const membersList = userGroup.members.map(username => {
            return {
                username,
                isLeader: username === userGroup.leader
            }
        })

        // For each user of the group, checks if the user has a Spotify token
        const spotifyCalls = []

        userGroup.members.forEach(member => {
            const spotifyToken = db.getUserSpotifyToken(member)
            if (spotifyToken) {
                const request = spotifyController._getSpotifyUserCurrentTrack(spotifyToken)
                spotifyCalls.push(request)
            }
        })

        // Wait for all the Spotify calls to be done
        const spotifyResults = await Promise.all(spotifyCalls)
        

        // Return the list of members
        res.status(200).json(membersList)
    }
}

module.exports = groupControllers