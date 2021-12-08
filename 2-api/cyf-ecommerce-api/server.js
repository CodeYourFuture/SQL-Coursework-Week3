const express = require("express");
const app = express();
const { Pool } = require("pg");

const pool = new Pool({
  user: "Maha",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "coder2021",
  port: 5432,
});

app.get("/customers", function (req, res) {
  pool.query("SELECT name FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/suppliers", function (req, res) {
  pool.query("SELECT supplier_name FROM suppliers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/products", function (req, res) {
  pool.query("SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON product_availability.prod_id = products.id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id"
, (error, result) => {
    res.json(result.rows);
  });
});

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
