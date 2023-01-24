const express = require("express");
const app = express();

const { Pool } = require("pg");

const pool = new Pool({
  user: "test_user",
  host: "dpg-cf60rapa6gdjkk3bbkvg-a.oregon-postgres.render.com",
  //host: "postgres://test_user:mgC8PDhAovGQrULdAtHazqSLuwTXA2F9@dpg-cf60rapa6gdjkk3bbkvg-a.oregon-postgres.render.com/cyf_ecommerce_l80y",
  database: "cyf_ecommerce_l80y",
  password: "mgC8PDhAovGQrULdAtHazqSLuwTXA2F9",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(express.json());

app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/", function (req, res) {
  let searchQuery = req.query.search;
  res.send("Hello World! You searched for " + searchQuery);
});

//Add a new GET endpoint `/products` to return all the product names along with their prices and supplier names.

//week 3
app.get("/products", function (req, res) {
  let productQuery = req.query.name;
  let query = `select products.product_name, product_availability.unit_price, suppliers.supplier_name from product_availability inner join products on products.id=product_availability.prod_id inner join suppliers on suppliers.id=product_availability.supp_id`;
  let params = [];
  if (productQuery) {
    query = `select products.product_name, product_availability.unit_price, suppliers.supplier_name from product_availability inner join products on products.id=product_availability.prod_id inner join suppliers on suppliers.id=product_availability.supp_id where products.product_name = $1`;
    params.push(productQuery);
  }
  pool
    .query(query, params)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// Add a new GET endpoint `/customers/:customerId` to load a single customer by ID.
app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM customers WHERE customers.id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

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
});

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
