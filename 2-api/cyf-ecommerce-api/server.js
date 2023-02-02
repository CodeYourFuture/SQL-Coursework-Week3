const express = require("express");
const app = express();
const { Pool } = require("pg");
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});

// Get all customers
app.get("/customers", async function (req, res) {
  try {
    let result = await pool.query("SELECT * FROM customers");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// Get all suppliers
app.get("/suppliers", async function (req, res) {
  try {
    let result = await pool.query("SELECT * FROM suppliers");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// Get all products
app.get("/products", async function (req, res) {
  try {
    let query =
      "SELECT p.product_name , pa.unit_price , s.supplier_name FROM products p INNER JOIN product_availability pa ON (p.id = pa.prod_id) INNER JOIN suppliers s ON (s.id = pa.supp_id)";
    let productName = req.query.name;
    let params = [];
    if (productName) {
      query = `SELECT p.product_name , pa.unit_price , s.supplier_name FROM products p INNER JOIN product_availability pa ON (p.id = pa.prod_id) INNER JOIN suppliers s ON (s.id = pa.supp_id) WHERE p.product_name LIKE $1`;
      params.push(`%${productName}%`);
    }
    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});
