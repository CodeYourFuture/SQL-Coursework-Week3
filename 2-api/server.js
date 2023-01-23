const express = require("express");
const app = express();

const { Pool } = require("pg");

const pool = new Pool({
  user: "christianmfuke",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "Genese@1992",
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

// app.get("/products", function (req, res) {
//   const sqlQuery =
//     "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM product_availability JOIN products ON product_availability.prod_id = products.id JOIN suppliers ON product_availability.supp_id = suppliers.id";
//   pool
//     .query(sqlQuery)
//     .then((result) => res.json(result.rows))
//     .catch((error) => {
//       console.error(error);
//       res.status(500).json(error);
//     });
// });

app.get("/products", function (req, res) {
  let sqlQuery =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM product_availability JOIN products ON product_availability.prod_id = products.id JOIN suppliers ON product_availability.supp_id = suppliers.id";
  if (req.query.name) {
    sqlQuery += " WHERE products.product_name = $1";
  }
  pool
    .query(sqlQuery, [req.query.name])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/customers/:customerId", (req, res) => {
  const { customerId } = req.params;
  const queryString = `SELECT * FROM customers WHERE id = $1`;
  pool
    .query(queryString, [customerId])
    .then((result) => {
      console.log(result.rows);
      res.json(result.rows);
    })
    .catch((err) => res.json(err));
});

app.post("/customers", (req, res) => {
  const { id, name, address, city, country } = req.body;
  const queryString = `INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)`;
  pool
    .query(queryString, [id, name, address, city, country])
    .then((result) => {
      console.log("Customer created successfully");
      res.json({ message: "Customer created successfully" });
    })
    .catch((err) => res.json(err));
});

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
