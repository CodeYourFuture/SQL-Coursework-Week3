const express = require("express");
const app = express();
const { Pool } = require("pg");

const PORT = 3000;

const pool = new Pool({
  user: "harsheek",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5433,
});

app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers;")
    .then((result) => res.json(result))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers;")
    .then((result) => res.json(result))
    .catch((error) => {
      console.log(error);
      res.status(500), json(error);
    });
});

// Stretch goal endpoint
app.get("/products", function (req, res) {
  pool
    .query(
      "select products.product_name, product_availability.unit_price, suppliers.supplier_name from products inner join product_availability on products.id = product_availability.prod_id inner join suppliers on suppliers.id = product_availability.supp_id;"
    )
    .then((result) => res.json(result))
    .catch((error) => {
      console.log(error);
      res.status(500), json(error);
    });
});

app.listen(PORT, () => {
  console.log(`Hello my service is running on port ${PORT}`);
});
