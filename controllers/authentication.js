/**
 * 
 * AUTHENTICATION CONTROLLERS
 * 
 */
require('dotenv').config()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../database/manager')

const controllers = {

  /**
   * REGISTER
   * 
   * @swagger
   * /register:
   *   post:
   *     summary: Register a new user.
   *     description: Allows a new user to register, creating a new user record in the database.
   *     tags: [Registration]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: The user's username.
   *               password:
   *                 type: string
   *                 description: The user's password.
   *     responses:
   *       201:
   *         description: User created successfully.
   *       400:
   *         description: This user already exists.
   */
  async register(req, res) {
    const {
      username,
      password
    } = req.body;

    const data = db.read()
    const users = data.users

    // User exists?
    if (users.find(user => user.username === username)) {
      return res.status(400).send('This user already exists.')
    }

    // Password hash
    const hashedPassword = await bcrypt.hash(password, 10)

    // Save user
    data.users.push({
      username,
      password: hashedPassword
    })

    db.update(data)

    res.status(201).send('User created successfully.')
  },


  /**
   * LOGIN
   * 
   * @swagger
   * /login:
   *   post:
   *     summary: Authenticate a user and return a token.
   *     description: Verifies user's credentials and returns a JWT token for authenticated sessions.
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: The user's username.
   *               password:
   *                 type: string
   *                 description: The user's password.
   *     responses:
   *       200:
   *         description: Authentication successful, JWT token returned.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                   description: JWT token for the authenticated session.
   *       400:
   *         description: User not found or wrong password.
   */
  async login(req, res) {
    const {
      username,
      password
    } = req.body

    const data = db.read()
    const users = data.users

    // User exists?
    const user = users.find(user => user.username === username)
    if (!user) {
      return res.status(400).send('User not found.')
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(400).send('Wrong password.')
    }

    // Generate token
    const token = jwt.sign({
      username: user.username
    }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    })

    res.status(200).send({
      token: token
    })
  }
}

module.exports = controllers