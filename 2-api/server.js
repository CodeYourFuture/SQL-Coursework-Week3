const express = require("express");
require("dotenv").config();
const app = express();
const { Pool } = require("pg");

app.use(express.json());

// DATABASE
const pool = new Pool({
  user: process.env.SQL_USERNAME,
  host: "localhost",
  database: "cyf_ecommerce",
  password: process.env.SQL_PASSWORD,
  port: 5432,
});

app.listen(process.env.PORT, () => {
  console.log(`Listen in http://localhost:${process.env.PORT}`);
});

//Get
app.get("/products", (req, res) => {
  const { name } = req.query;

  let query =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id";

  if (name) {
    query += ` WHERE products.product_name ILIKE '%${name}%'`;
  }

  pool
    .query(query)
    .then(({ rows }) => res.json(rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

// Get all
app.get("/customers", (req, res) => {
  let query = "SELECT * FROM customers;";

  pool
    .query(query)
    .then(({ rows }) => res.json(rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

// Get by id
app.get("/customers/:customerId", (req, res) => {
  const id = req.params.customerId;

  pool
    .query("SELECT * FROM customers WHERE id=$1;", [id])
    .then(({ rows }) => res.json(rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});
