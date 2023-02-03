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

app.use(express.json());

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});

// GET all customers
app.get("/customers", async function (req, res) {
  try {
    let result = await pool.query("SELECT * FROM customers");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// GET customer by id
app.get("/customers/:customerId", async function (req, res) {
  try {
    const customerId = req.params.customerId;

    let result = await pool.query("SELECT * FROM customers WHERE id=$1", [
      customerId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// GET all suppliers
app.get("/suppliers", async function (req, res) {
  try {
    let result = await pool.query("SELECT * FROM suppliers");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// GET all products
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

// POST new customer
app.post("/customers", async function (req, res) {
  try {
    const newCustomerName = req.body.name;
    const newCustomerAddress = req.body.address;
    const newCustomerCity = req.body.city;
    const newCustomerCountry = req.body.country;

    let result = await pool.query("SELECT * FROM customers WHERE name=$1", [
      newCustomerName,
    ]);

    if (result.rows.length > 0) {
      return res
        .status(400)
        .send("A customer with the same name already exists!");
    } else {
      const query =
        "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
      await pool.query(query, [
        newCustomerName,
        newCustomerAddress,
        newCustomerCity,
        newCustomerCountry,
      ]);
      res.send(`New customer added!`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// POST new product
app.post("/products", async function (req, res) {
  try {
    const newProductName = req.body.product_name;
    let result = await pool.query(
      "SELECT * FROM products WHERE product_name=$1",
      [newProductName]
    );
    if (result.rows.length > 0) {
      return res
        .status(400)
        .send("A product with the same name already exists!");
    } else {
      const query = "INSERT INTO products (product_name) VALUES ($1)";
      await pool.query(query, [newProductName]);
      res.send(`New product added!`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});
