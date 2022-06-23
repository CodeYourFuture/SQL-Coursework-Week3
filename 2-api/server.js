const express = require("express");
require("dotenv").config();
const app = express();
const { Pool } = require("pg");

app.use(express.json());

// DATABASE
const pool = new Pool({
  user: process.env.SQL_USERNAME,
  host: "localhost",
  database: "cyf_ecommerce",
  password: process.env.SQL_PASSWORD,
  port: 5432,
});

// 1-2 Get Products using query parameter
app.get("/products", (req, res) => {
  const { name } = req.query;

  let query =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id";

  if (name) {
    query += ` WHERE products.product_name ILIKE '%${name}%'`;
  }

  pool
    .query(query)
    .then(({ rows }) => res.json(rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

// Get all customers
app.get("/customers", (req, res) => {
  let query = "SELECT * FROM customers;";

  pool
    .query(query)
    .then(({ rows }) => res.json(rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

// 3 Get customer by id
app.get("/customers/:customerId", (req, res) => {
  const id = req.params.customerId;

  pool
    .query("SELECT * FROM customers WHERE id=$1;", [id])
    .then(({ rows }) => res.json(rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

// 4 Add a new POST endpoint `/customers` to create a new customer with name, address, city and country.
// changed the Headers (Content-Type : application/json)
app.post("/customers", (req, res) => {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  //   console.log(req.body);
  //   console.log(typeof newCustomerName);

  pool
    .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A Customer with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
        pool
          .query(query, [
            newCustomerName,
            newCustomerAddress,
            newCustomerCity,
            newCustomerCountry,
          ])
          .then(() => res.send("Customer created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// 5 Add a new POST endpoint `/products` to create a new product
app.post("/products", function (req, res) {
  const newProductName = req.body.product_name;

  pool
    .query("SELECT * FROM products WHERE product_name=$1", [newProductName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A Product with the same name already exists!");
      } else {
        let query = "INSERT INTO products (product_name) VALUES ($1)";
        pool
          .query(query, [newProductName])
          .then(() => res.send("Product created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// ** 6 Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.
app.post("/availability", function (req, res) {
  const newProductAvailabilityId = parseInt(req.body.prod_id);
  const newSupplierId = parseInt(req.body.supp_id);
  const newUnitPrice = parseInt(req.body.unit_price);

  if (newUnitPrice < 0) {
    return res.status(400).send("Please provide a valid number.");
  }

  pool
    .query(
      "SELECT * FROM product_availability WHERE prod_id=$1 AND supp_id=$2",
      [newProductAvailabilityId, newSupplierId]
    )
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A product with the same name and price already exists!");
      } else {
        const query =
          "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
        pool
          .query(query, [newProductAvailabilityId, newSupplierId, newUnitPrice])
          .then(() => res.send("Product created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).
app.put("/customers/:customerId", (req, res) => {
  const customerId = Number(req.params.customerId);
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  if (!newCustomerName) {
    return res.status(400).send("The name is empty");
  }

  pool
    .query(
      "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5;",
      [
        newCustomerName,
        newCustomerAddress,
        newCustomerCity,
        newCustomerCountry,
        customerId,
      ]
    )
    .then(() => res.json(`Customer ${customerId} updated!`))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

app.listen(process.env.PORT, () => {
  console.log(`Listen in http://localhost:${process.env.PORT}`);
});
