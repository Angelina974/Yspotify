# YSpotify Integration Service

Ce service permet une intégration poussée avec Spotify, offrant aux utilisateurs la possibilité de lier leurs comptes Spotify, de déduire leur personnalité musicale à partir de leurs titres likés, de synchroniser la lecture de musique au sein d'un groupe et de créer des playlists basées sur les préférences musicales.

## Fonctionnalités

- **FT-1 Inscription** : L’Utilisateur anonyme peut s’inscrire sur le Service. Il doit alors fournir les informations suivantes :
    - un nom d'utilisateur (username)
    - un mot de passe 
- **FT-2 Connexion** : L’Utilisateur anonyme peut se connecter au Service en fournissant sont username et mot de passe.
- **FT-3 Liaison du compte Spotify** : Les utilisateurs peuvent autoriser le service à accéder à leur compte Spotify pour utiliser l'API en leur nom.
- **FT-4 Rejoindre un groupe** : L’Utilisateur peut rejoindre un Groupe.
- **FT-5 Consultation des Groupes et Utilisateurs** : L’Utilisateur peut consulter la liste de tous les Groupes existant sur le Service et il peut également consulter la liste de tous les Utilisateurs appartenant à son Groupe. 
- **FT-6 Personnalité de l'Utilisateur** : Analyse des titres likés pour déduire des traits de personnalité musicaux.
- **FT-7 Synchronisation de Groupe** : Le chef de groupe peut synchroniser la lecture de musique sur tous les appareils actifs des membres du groupe.
- **FT-8 Création de Playlist** : Création de playlists sur Spotify basées sur les préférences musicales des utilisateurs.
***
## Fonctionnalités optionnelles
- **FT-9 Tests et qualité** : Non réalisé - Je ne sais pas du tout comment faire cela, jamais vu en cours
- **FT-10** Conteneurisation : Création d'une image Docker
- **FT-11** Reverse proxy : Proposition d'utilisation de NGINX avec une configuration spécifique pour rediriger le traffic du port 80 vers 3000

## Installation

Ce dont vous avez besoin pour installer le service et comment les installer :

1) Cloner le code du projet depuis le repository Github :

```
git clone https://github.com/Angelina974/Yspotify
```

2) Installer les dépendances NodeJS :

```
npm install
```

3) Créez votre fichier ".env". Vous pouvez copier le fichier ".sample.env" et compléter avec vos informations :

```
JWT_SECRET = YOUR_JWT_SECRET 
CLIENT_ID = YOUR_SPOTIFY_CLIENT_ID
CLIENT_SECRET = YOUR_PASSWORD_HASH_SECRET
REDIRECT_URI = http://localhost:3000/oAuthCallback
```

4) Lancer l'application :

```
node app
```

5) Le service est en écoute sur le port 3000. Ouvrez cette URL dans votre navigateur :

```
http://localhost:3000
```

## Technologies utilisées lors du projet

+ **[NodeJS](https://nodejs.org/en)** - Environnement d'exécution pour JavaScript
+ **[Express](https://expressjs.com/)** - Framework de serveur web pour NodeJS
+ **[Spotify Web API](https://developer.spotify.com/documentation/web-api)** - API pour intégrer les services Spotify
+ **[Swagger JSDoc](https://www.npmjs.com/package/swagger-jsdoc)** - Outil de génération automatique de la documentation au format OpenAPI 3.0

## A propos de la génération automatique de la documentation Swagger

Pour que la documentation puisse être générée à partir du code :
- la définition d'une route a été écrite au format YAML dans l'entête de fonction du controleur, juste après le tag @swagger.
- la génération automatique de la documentation se fait avec la commande :
```
node generateDoc
```

Exemple d'entête de fonction d'un contrôleur au format YAML pour SwaggerJSDoc :
```
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
    // Code du contrôleur
    // ...
  }
```

La documentation produite par **SwaggerJSDoc** est accessible dans le fichier /docs/swagger-output.json
<br>Cette documentation est exposée sur l'url : http://localhost:3000/api-docs

Le projet inclut SwaggerUI, et vous pouvez directement y accéder par la route suivante :
```
http://localhost:3000/docs
```
Il vous faudra ensuite préciser à SwaggerUI l'url de la documentation (http://localhost:3000/api-docs)

## Conteneurisation du projet

Une image Docker du projet peut être créée grâce au fichier Docker file, via la commande:
```
docker build -t shared-music-with-spotify .
```

L'image Docker réalise les actions suivantes :
- part d'une image node:alpine (qui contient déjà les outils comme NPM...)
- crée un répertoire de travail /app/Yspotify
- clone le repository Github du projet
- crée un fichier de script "run.sh" qui permet, à chaque relance du conteneur, de faire un "git pull", puis "npm install" et "npm update", afin que les fichiers du projet soient toujours à jour quand on lance l'image Docker
- utilise ce fichier de script comme point d'entrée pour lancer l'app
- expose le port 3000

Lancer l'image Docker avec la commande :
```
docker run -d -p 3000:3000 shared-music-with-spotify
```

Pour voir si l'application répond, vous pouvez tester l'adresse: http://localhost:3000/docs

## Configuration de reverse proxy

Pour faire tourner le service derrière un reverse proxy, nous proposons l'utilisation de NGINX.
Dans ce cas, modifier la configuration de NGINX, au niveau du fichier de config /etc/nginx/nginx.conf (Windows) ou /etc/nginx/sites-available/ (Linux) :

```
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

De cette manière, le traffic http adressé au port 80 sera redirigé sur le port 3000 du serveur situé derrière le proxy.


## Auteur

**Julia Grossi**