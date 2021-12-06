const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

const { Pool } = require("pg");
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.get("/customers", function (req, res) {
  pool.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/suppliers", (request, response) => {
  pool.query("SELECT * FROM suppliers", (error, result) => {
    response.send(result.rows);
  });
});

app.get("/products", (request, response) => {
  const selectQuery = `SELECT product_name,unit_price, supplier_name
                      FROM products
                      INNER JOIN product_availability ON product_availability.prod_id = products.id
                      INNER JOIN suppliers ON product_availability.supp_id  = suppliers.id; `;
  pool.query(selectQuery, (error, result) => {
    response.send(result.rows);
  });
});

app.listen(PORT, () => {
  console.log(`Port running on ${PORT}`);
});
