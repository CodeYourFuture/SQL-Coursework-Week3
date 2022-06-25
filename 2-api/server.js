const express = require("express");
require("dotenv").config();
const app = express();
const { Pool } = require("pg");
const PORT = process.env.PORT || 5000;

app.use(express.json());

// DATABASE
const pool = new Pool({
  user: "cyf",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "cyfcyf",
  port: 5432,
});

app.listen(PORT, () => {
  console.log(`Listen in http://localhost:${PORT}`);
});

// Get Products
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

// Get all customers
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

// Get customers by id
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

// POST new customer

app.post("/customers", (req, res) => {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  pool
    .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A Customer with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
        pool
          .query(query, [
            newCustomerName,
            newCustomerAddress,
            newCustomerCity,
            newCustomerCountry,
          ])
          .then(() => res.send("Customer created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});
