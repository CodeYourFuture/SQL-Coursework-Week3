//Week2

const express = require("express");
const app = express();
const { Pool } = require("pg");

app.use(express.json());

// app.listen(4000, function () {
//   console.log("Server is listening on port 4000. Ready to accept requests!");
// });

const pool = new Pool({
  user: "codeyourfuture",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "CYFStudent123",
  port: 5432,
});

//return all customers
app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//return all suppliers
app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//Week 3

app.get("/products", (req, res) => {
  let query =
    "SELECT p.product_name, pa.unit_price, s.supplier_name from products p inner join product_availability pa on p.id = pa.prod_id inner join suppliers s on pa.supp_id = s.id";
  let params = [];

  if (req.query.name) {
    query += "Where p.product_name = $1";
    params.push(req.query.name);
  }
  pool
    .query(query, params)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.listen(4000, function () {
  console.log("Server is listening on port 4000. Ready to accept request");
});
