const express = require("express");
const app = express();
const { Pool } = require("pg");

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const db = new Pool({
  user: "Yousef", // replace with you username
  host: "localhost",
  database: "cyf-ecommerce",
  password: "3610",
  port: 5432,
});

app.get("/", function (req, res) {
  // Send response to client and print an message
  res.send("<h1>Hotel Database project Home Page</h1>");
});
// Listen connections on port defined as PORT
const port = process.env.PORT || 3000;
app.listen(port, function () {
  // Callback called when server is listening
  console.log(`Server starter and listening on port ${port}.`);
});






