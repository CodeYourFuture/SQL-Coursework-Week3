const express = require("express");
const app = express();

const { Pool } = require("pg");

const pool = new Pool({
  user: "cyf_ecommercedb_user",
  host: "dpg-cf6122da499d72thdda0-a",
  database: "cyf_ecommercedb",
  password: "CAfiklRk7P7QDBSqxyj0I1LyKeVpudiC",
  port: 5432,
});

app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.listen(5432, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
