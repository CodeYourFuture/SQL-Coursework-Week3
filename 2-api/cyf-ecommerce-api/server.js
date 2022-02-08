const express = require("express");

const dotenv = require("dotenv");
dotenv.config();
const app = express();
app.use(express.json());
const { Pool } = require("pg");
const { query } = require("express");

const pool = new Pool({
  connectionString: process.env.PG_CONNECT,
});

// GET ALL THE CUSTOMERS
app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.post("/customers", function (req, res) {
  let customerName = req.body.name;
  let customerAddress = req.body.address;
  let customerCity = req.body.city;
  let customerCountry = req.body.country;

  if (!customerName || !customerAddress || !customerCity || !customerCountry) {
    return res
      .status(400)
      .send({ msg: "Please fill in all the required fields" });
  }
  pool
    .query(`SELECT name FROM customers WHERE name = $1`, [customerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send({ msg: `Customer name:${customerName} already exist` });
      } else {
        let query = `INSERT INTO customers(name, address, city, country) VALUES ($1,$2,$3,$4)`;
        let params = [
          customerName,
          customerAddress,
          customerCity,
          customerCountry,
        ];
        pool
          .query(query, params)
          .then(() =>
            res.send({ msg: `Customer ${customerName} added Successfully` })
          )
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// GET ALL THE SUPPLIERS
app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// ADVANCED LEVEL
app.get("/products", function (req, res) {
  let productsQuery = `SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name
        FROM product_availability
        JOIN products
        ON products.id = product_availability.prod_id
        JOIN suppliers
        ON suppliers.id = product_availability.supp_id`;
  let searchQuery = req.query.name;

  if (searchQuery) {
    pool
      .query(
        `${productsQuery} WHERE product_name LIKE '%${searchQuery}%' ORDER BY product_name`
      )
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  } else {
    pool
      .query(productsQuery)
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  }
});

// ADDING A NEW PRODUCT

app.post("/products", function (req, res) {
  let productName = req.body.product_name;
  pool
    .query(`SELECT * FROM products WHERE product_name = $1`, [productName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send({
          msg: `A product with similar name:${productName} already exists !`,
        });
      } else {
        let query = `INSERT INTO products (product_name) VALUES($1)`;
        let params = [productName];
        pool
          .query(query, params)
          .then(() =>
            res.send({ msg: `Product ${productName} added successfully ` })
          )
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// GET CUSTOMER WITH AN ID
app.get("/customers/:customerId", function (req, res) {
  let customerId = req.params.customerId;
  let query = `SELECT * FROM customers WHERE id = $1`;
  const params = [customerId];
  pool
    .query(query, params)
    .then((result) => {
      if (result.rows.length == 0) {
        return res
          .status(404)
          .send({ msg: `Customer ${customerId} doesn't exist` });
      }
      res.json(result.rows);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.listen(3001, function () {
  console.log("Server is listening on port 3001. Ready to accept requests!");
});
