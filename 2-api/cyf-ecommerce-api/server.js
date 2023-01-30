const express = require("express");

const app = express();

const { Pool } = require("pg");

const pool = new Pool({
  user: "patoumabando",
  host: "dpg-cf8es9hgp3jqqeroset0-a.oregon-postgres.render.com",
  database: "cyf_ecommerce_eou5",
  password: "RFtzomMBJKTnQGmXnv9Li7y3v8JAzvdx",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
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

app.get("/products", function (req, res) {
  const sqlQuery =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM product_availability JOIN products ON product_availability.prod_id = products.id JOIN suppliers ON product_availability.supp_id = suppliers.id";
  pool
    .query(sqlQuery)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.li


app.listen(3000, function () {
    console.log("Server is listening on port 3000. Ready to accept requests!");
  });