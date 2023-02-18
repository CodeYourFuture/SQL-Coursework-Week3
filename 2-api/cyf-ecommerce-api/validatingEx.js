const express = require("express");
const bodyParser = require("body-parser");
const app = express();

const { Pool } = require("pg");

app.use(bodyParser.json());

const db = new Pool({
  user: "codeyourfuture", // replace with you username
  host: "localhost",
  database: "cyf_hotel",
  password: "cyf123",
  port: 5432,
});

app.listen(3110, function () {
  console.log("Server is listening on port 3110. Ready to accept requests!");
});
