// Charge les libraries nécessaires:
require('dotenv').config()
const bcrypt = require('bcrypt')
const fs = require('fs')
const jwt = require('jsonwebtoken')

// Définit les controlleurs pour les routes
// Chaque controlleur est une fonction asynchrone qui prend deux paramètres: req et res, qui représentent respectivement la requête et la réponse dans Express
// Pour simplifier le code, on crée un objet "controllers" qui contient toutes les fonctions de controlleurs (register, login, oAuthLogin, oAuthCallback...)
// Puis on exporte cet objet à la fin pour pouvoir l'utiliser dans app.js
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

    // Lecture des utilisateurs depuis le fichier
    const data = JSON.parse(fs.readFileSync('./database/data.json', 'utf8'))
    const users = data.users

    // Vérifiez si l'utilisateur existe déjà. Si oui, on sort avec un code d'erreur 400
    if (users.find(user => user.username === username)) {
      return res.status(400).send('Cet utilisateur existe déjà.')
    }

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Enregistrement de l'utilisateur
    data.users.push({
      username,
      password: hashedPassword
    });

    // Ecriture dans le fichier JSON des utilisateurs
    try {
      fs.writeFileSync('./database/data.json', JSON.stringify(data))
    } catch (error) {
      console.error("Erreur lors de l'écriture dans le fichier :", error)
      return res.status(500).send('Erreur serveur.')
    }

    res.status(201).send('Utilisateur enregistré avec succès.')
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

    // Lecture des utilisateurs depuis le fichier
    const data = JSON.parse(fs.readFileSync('./database/data.json', 'utf8'))
    const users = data.users

    // Recherche de l'utilisateur
    const user = users.find(user => user.username === username)
    if (!user) {
      return res.status(400).send('Utilisateur non trouvé.')
    }

    // Comparaison du mot de passe
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(400).send('Mot de passe incorrect.')
    }

    // Génération du token d'accès (remplacez YOUR_SECRET_KEY par votre clé secrète)
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

// Exporte les controlleurs pour pouvoir les utiliser dans app.js
module.exports = controllers