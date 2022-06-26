# SQL Week 3 - Coursework
To use Heroku as node.js server and save postgresql data on it:
- Copy package.json to root and change : 
 ```
 "scripts": {
    "start": "node server/server.js",
    "dev": "nodemon server/server.js"
  },
 ```
- Create a new app on Heroku
- Heroku/Settings/Buildpacks/Add buildpack add node.js
- Heroku/Resources/Add-ons add Heroku Postgres
- select GitHub in Deploy menu of Heroku and select repo to deploy.
