/**
 * 
 * AUTHENTICATION CONTROLLERS
 * 
 */
require('dotenv').config()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../database/manager')

const controllers = {

  /**
   * 
   * REGISTER
   * 
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
   * 
   * LOGIN
   * 
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