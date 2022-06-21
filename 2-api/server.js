const express = require("express");
const { Pool } = require("pg");
const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  user: "ali",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "111111",
  port: 5432,
});

app.get("/", (req, res) => res.send("EXPRESS Server is running now!"));
app.get("/customers", (req, res) => {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((er) => {
      console.log(er);
      res.status(500).json(er);
    });
});
app.get("/suppliers", (req, res) => {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((er) => {
      console.log(er);
      res.status(500).send(er);
    });
});
app.get("/products", async (req, res) => {
  let nameQuery = req.query.name || Object.keys(req.query)[0];

  if (nameQuery) {
    const query =
      "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM product_availability INNER JOIN suppliers on suppliers.id = product_availability.supp_id INNER JOIN products on products.id = product_availability.prod_id WHERE product_name = $1";
    const result = await pool.query(query, [nameQuery]);
    res.send(result.rows);
  } else {
    const query =
      "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM product_availability INNER JOIN suppliers on suppliers.id = product_availability.supp_id INNER JOIN products on products.id = product_availability.prod_id";
    const result = await pool.query(query);
    res.send(result.rows);
  }
});
app.get("/customers/:cusId", async (req, res) => {
  const id = req.params.cusId;
  const query = "SELECT * FROM customers WHERE id = $1";
  const result = await pool.query(query, [id]);
  res.json(result.rows);
});

app.listen(PORT, () => console.log(`App is running on ${PORT}`));
