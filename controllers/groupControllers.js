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
     * JOIN GROUP
     * 
     * @swagger
     * /joinGroup:
     *   post:
     *     summary: Join or create a group.
     *     description: Allows the user to join a group specified by its name. If the group does not exist, it is created. If the user was already a member of another group, he is removed from it.
     *     tags:
     *       - Groups
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *             properties:
     *               name:
     *                 type: string
     *                 description: The name of the group to join or create.
     *     security:
     *      - bearerAuth: []
     *     responses:
     *       200:
     *         description: Returns a message confirming that the user has successfully joined the group, or that he was already a member of it.
     *       400:
     *         description: Invalid request if the group name is missing.
     *       500:
     *         description: Error server if an unexpected error occurs.
     */
    async joinGroup(req, res) {
        try {

            const {
                name
            } = req.body

            if (!name) {
                return res.status(400).send('Invalid request: group name is missing.')
            }

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
                    res.status(200).send('You were already in this group.')
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
        } catch (err) {
            res.status(500).send('An error occured')
        }
    },

    /**
     * GET GROUP LIST
     * 
     * @swagger
     * /getGroupList:
     *   get:
     *     summary: Obtain a list of all available groups.
     *     description: returns a list of groups with their names and the number of members.
     *     tags:
     *       - Groups
     *     security:
     *      - bearerAuth: []
     *     responses:
     *       200:
     *         description: A list of groups with their names and the number of members.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   name:
     *                     type: string
     *                     description: The name of the group.
     *                   numberOfUsers:
     *                     type: integer
     *                     description: The number of members in the group.
     *       500:
     *         description: Error server if an unexpected error occurs.
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
     * 
     * @swagger
     * /getGroupMembers:
     *   get:
     *     summary: Obtain a list of all members of the group to which the current user belongs.
     *     description: Returns a list of all members of the group to which the current user belongs, including information about being the leader of the group, and the currently listened Spotify track for each member if they are connected to Spotify and currently playing.
     *     tags:
     *       - Groups
     *     security:
     *      - bearerAuth: []
     *     responses:
     *       200:
     *         description: A list of all members of the group to which the current user belongs.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   username:
     *                     type: string
     *                     description: The username of the member.
     *                   isLeader:
     *                     type: boolean
     *                     description: Tells if the member is the leader of the group.
     *                   currentTrack:
     *                     type: string
     *                     description: The song currently played by the member on Spotify, if available.
     *                   device:
     *                     type: string
     *                     description: The device currently used by the member on Spotify, if available.
     *       400:
     *         description: The user does not belong to any group.
     */
    async getGroupMembers(req, res) {
        const username = req.username

        const data = db.read()
        const groups = data.groups

        // Find the user's group
        const userGroup = groups.find(group => group.members.includes(username))

        // Check if the user is in a group
        if (!userGroup) {
            return res.status(400).send("You don't belong to any group.")
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
                const request = spotifyController._getSpotifyUserCurrentTrack(member, spotifyToken)
                spotifyCalls.push(request)
            }
        })

        // Wait for all the Spotify calls to be done
        let spotifyResults = await Promise.all(spotifyCalls)

        // Filter calls which returned an error
        spotifyResults = spotifyResults.filter(result => result)

        // Add the Spotify data to the members list
        membersList.forEach(member => {
            const spotifyResult = spotifyResults.find(result => result.user === member.username)
            if (spotifyResult) {
                member.currentTrack = spotifyResult.track
                member.device = spotifyResult.device
            }
        })

        // Return the list of members
        res.status(200).json(membersList)
    }
}

module.exports = groupControllers