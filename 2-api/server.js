const express = require("express");
const app = express();
const { Pool } = require("pg");
const bodyParser = require("body-parser");
require("dotenv").config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const port = process.env.PORT || 3000;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.get("/", (req, res) => {
  res.send("Welcome to Express");
});
app.get("/customers", (req, res) => {
  pool
    .query("SELECT name FROM customers")
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});
app.get("/suppliers", (req, res) => {
  pool
    .query("SELECT supplier_name FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((err) => console.error(err));
});
app.get("/products", (req, res) => {
  pool
    .query(
      "SELECT p.product_name, pa.unit_price, s.supplier_name FROM products p JOIN product_availability pa ON p.id = pa.prod_id JOIN suppliers s ON pa.supp_id = s.id"
    )
    .then((result) => res.json(result.rows))
    .catch((err) => console.error(err));
});
app.listen(port, () => console.log(`Listening on port ${port}`));
