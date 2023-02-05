const express = require("express");
const app = express();
const { Pool } = require("pg");

app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "omid",
  port: 5432,
});

app.get("/customers", (req, res) => {
  pool
    .query(`SELECT * FROM customers`)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/customers/:customerId", (req, res) => {
  const customerID = req.params.customerId;

  pool
    .query(`SELECT * FROM customers WHERE id::text = $1`, [customerID])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/suppliers", (req, res) => {
  pool
    .query(`SELECT * FROM suppliers`)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/products", (req, res) => {
  const name = req.query.name.toLowerCase();

  pool
    .query(`SELECT * FROM products WHERE LOWER(product_name) LIKE $1`, [
      `%${name}%`,
    ])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.post("/products", (req, res) => {
  const id = req.body.id;
  const name = req.body.name;

  pool
    .query("INSERT INTO products VALUES($1,$2)", [id, name])
    .then((result) =>
      res.json({ message: `Product ID ${id} Saved into successfully. ` })
    )
    .catch((err) => {
      console.log(err);
      res.status(500).json("Request denied, server issue");
    });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("server is up");
});
