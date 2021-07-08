const { Pool } = require("pg");

const db = new Pool(); //get configs automatically from .env using require("dotenv").config();

module.exports = db;
