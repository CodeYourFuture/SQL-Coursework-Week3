const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();
const app = express();
const password = process.env.PASSWORD;
const host = process.env.HOST;
const user = process.env.USER;
const database = process.env.DATABASE;

const dbConfig = {
  host,
  port: 5432,
  user,
  password,
  database,
};
const pool = new Pool(dbConfig);

// psql queries

const allCustomers = `select name from customers`;
const allSuppliers = `select supplier_name from suppliers`;
const allProducts = `select product_name,supplier_name,unit_price from products 
inner join product_availability on products.id=product_availability.prod_id
inner join suppliers on product_availability.supp_id=suppliers.id;
`;

// customers end point

app.get("/customers", (req, res) =>
  pool
    .query(allCustomers)
    .then((result) => {
      res.send(result.rows);
    })
    .catch((error) => res.status(500).send(error))
);

// suppliers end point

app.get("/suppliers", (req, res) =>
  pool
    .query(allSuppliers)
    .then((result) => {
      res.send(result.rows);
    })
    .catch((error) => res.status(500).send(error))
);

// products end point

app.get("/products", (req, res) =>
  pool
    .query(allProducts)
    .then((result) => {
      res.send(result.rows);
    })
    .catch((error) => res.status(500).send(error))
);

app.listen(3000, () => console.log("Running on port 3000"));
