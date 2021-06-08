const express = require("express");
const app = express();

const PORT = process.env.PORT || 5000;

const { Pool } = require("pg");

const pool = new Pool({
  user: "cyf",
  password: "cyf",
  host: "localhost",
  database: "cyf_ecommerce",
  port: "5432",
});

app.get("/customers", (req, res) => {
  const query = "SELECT * FROM customers";

  pool
    .query(query)
    .then((result) => res.send(result.rows))
    .catch((e) => console.log(e));
});

app.get("/suppliers", (req, res) => {
  const query = "SELECT * FROM suppliers";

  pool
    .query(query)
    .then((result) => res.send(result.rows))
    .catch((e) => console.log(e));
});

app.get("/products", (req, res) => {
  const query = `SELECT p.product_name AS "Product Name", pa.unit_price AS
  "Unit Price", s.supplier_name AS "Supplier Name"
  FROM product_availability AS pa
  INNER JOIN products AS p ON pa.prod_id = p.id
  INNER JOIN suppliers AS s ON pa.supp_id = s.id;`;

  pool
    .query(query)
    .then((result) => res.send(result.rows))
    .catch((e) => console.log(e));
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}.`));
