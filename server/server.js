const express = require("express");
const app = express();
const { Pool } = require("pg");
const moment = require("moment");

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

app.post("/availability", (req, res) => {
  const productId = req.body.prodID;
  const supplierId = req.body.supID;
  const unitPrice = req.body.price;

  pool
    .query("INSERT INTO product_availability VALUES($1,$2,$3)", [
      productId,
      supplierId,
      unitPrice,
    ])
    .then((result) => res.json({ message: "Product saved successfully" }))
    .catch((err) => {
      console.error(err);
      res.status(500).json("Request denied, server issues");
    });
});

app.post("/customers/:customerId/orders", (req, res) => {
  const id = 11;
  const customerId = req.params.customerId;
  const date = moment().format("YYYY-MM-DD");
  const ref = `ORD0${id}`;

  pool
    .query("INSERT INTO orders VALUES($1,$2,$3,$4)", [
      id,
      date,
      ref,
      customerId,
    ])
    .then((result) => res.json({ message: "Product saved successfully" }))
    .catch((err) => {
      console.error(err);
      res.status(500).json("Request denied, server issues");
    });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("server is up");
});
