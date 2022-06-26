# SQL Week 3 - Coursework
## Deploy a GitHub repo includes a server directory on Heroku
To use Heroku as node.js server and save postgresql data on it when the server is inside of a sub-directory:
- Copy package.json to root and change : 
 ```
 "scripts": {
    "start": "node <sub-directory>/server.js",
    "dev": "nodemon <sub-directory>/server.js"
  },
 ```
- Create a new app on Heroku
- Heroku/Settings/Buildpacks/Add buildpack add node.js
- Heroku/Resources/Add-ons add Heroku Postgres
- select GitHub in Deploy menu of Heroku and select repo to deploy.

Example: 
https://github.com/DavoodKhoshnood/SQL-Coursework-Week3/blob/main/package.json
