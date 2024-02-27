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

## Installation

Ce dont vous avez besoin pour installer le service et comment les installer :

`git clone` **_https://github.com/Angelina974/Yspotify_**

```
npm install node
npm install express
npm install axios
npm install fs
npm install qs
npm install dotenv
npm install jsonwebtoken
npm installbcrypt
```

## Configuration

Ajouter un fichier .env à la racine du projet qui stocke le `CLIENT_ID`, `CLIENT_SECRET` et le `REDIRECT_URI`.
Voici la route que le `REDIRECT_URI` doit avoir : **_http://localhost:3000/oAuthCallback_**

## Technologies utilisées lors du projet

+ **[Node](https://nodejs.org/en)** - Environnement d'exécution pour JavaScript
+ **[Express](https://expressjs.com/)** - Infrastructure de l'application web
+ **[Spotify Web API](https://developer.spotify.com/documentation/web-api)** - API pour intégrer les services Spotify

## Auteur

**Julia Grossi**


