require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const { resourceLimits } = require("worker_threads");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "patryk22",
  port: 5432,
});

/* Queries to DB */
let customersQ = "SELECT * from customers";
let supQ = "SELECT * from suppliers";
// const prodQ =
//   "SELECT product_name, unit_price, supplier_name from products INNER JOIN product_availability on products.id = product_availability.prod_id INNER JOIN suppliers on product_availability.supp_id = suppliers.id;";

app.get("/customers", async (req, res) => {
  try {
    const customers = await pool.query(customersQ);
    res.status(200).json({
      status: "success",
      data: customers.rows,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/customers", async (req, res) => {
  const { name, address, city, country } = req.body;
  const queryConstructor =
    "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
  try {
    const customers = await pool.query(queryConstructor, [
      name,
      address,
      city,
      country,
    ]);
    res.status(200).json({
      status: "success",
      data: customers.rows,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/customers/:customerId", async (req, res) => {
  const reqCustomerId = req.params.customerId;
  const reqCusByID = customersQ + " WHERE id=$1";
  console.log(customersQ);

  try {
    const customers = await pool.query(reqCusByID, [reqCustomerId]);
    res.status(200).json({
      status: "success",
      data: customers.rows,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/suppliers", async (req, res) => {
  try {
    const suppliers = await pool.query(supQ);
    res.status(200).json({
      status: "success",
      data: suppliers.rows,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// - Update the previous GET endpoint `/products` to filter the list of products by name using a query parameter,
// for example `/products?name=Cup`. This endpoint should still work even if you don't use the `name` query parameter!
let prodQ =
  "SELECT product_name, unit_price, supplier_name from products INNER JOIN product_availability on products.id = product_availability.prod_id INNER JOIN suppliers on product_availability.supp_id = suppliers.id";

app.get("/products", async (req, res) => {
  const queryParam = req.query.name;

  let queryArray;
  if (req.query.name) {
    prodQ += queryArray = [
      prodQ + " WHERE product_name ILIKE $1;",
      [`%${queryParam}%`],
    ];
  }
  if (!req.query.name) {
    queryArray = [prodQ + ";"];
  }

  try {
    const products = await pool.query(...queryArray);
    res.status(200).json({
      status: "success",
      data: products.rows,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/products", async (req, res) => {
  const { product_name } = req.body;
  const queryConstructor = "INSERT INTO products (product_name) VALUES ($1)";
  try {
    const customers = await pool.query(queryConstructor, [product_name]);
    res.status(200).json({
      status: "success",
      data: customers.rows,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/availability", async (req, res) => {
  try {
    const { supplierId, unitPrice, productId } = req.body;

    //basic validation without checking if input is a number
    if (!supplierId || !productId || !unitPrice || unitPrice < 0) {
      return res.status(400).json({
        status: "error",
        msg: "check provided supplier id and price - must be more than 0",
      });
    }
    // guard requests
    const product = await pool.query(`SELECT * FROM products WHERE id = $1;`, [
      productId,
    ]);
    if (product.rowCount === 0)
      throw new Error("There is no product with that id");
    const supplier = await pool.query(
      `SELECT * FROM suppliers WHERE id = $1;`,
      [supplierId]
    );
    if (product.supplier === 0)
      throw new Error("There is no supplier with that id");

    const customers = await pool.query(
      `INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3);`,
      [productId, supplierId, unitPrice]
    );
    res.status(200).json({
      status: "success",
      data: customers.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: error.message });
  }
});

app.listen(3000, function () {
  console.log("Server is listening on port 3000.");
});
