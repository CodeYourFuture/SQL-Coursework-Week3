//Week2

const express = require("express");
const app = express();
const { Pool } = require("pg");

app.use(express.json());

// app.listen(4000, function () {
//   console.log("Server is listening on port 4000. Ready to accept requests!");
// });

const pool = new Pool({
  user: "codeyourfuture",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "CYFStudent123",
  port: 5432,
});

//return all customers
app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//return all suppliers
app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//Week 3

app.get("/products", (req, res) => {
  let query =
    "SELECT p.product_name, pa.unit_price, s.supplier_name from products p inner join product_availability pa on p.id = pa.prod_id inner join suppliers s on pa.supp_id = s.id";
  let params = [];

  if (req.query.name) {
    query += "Where p.product_name = $1";
    params.push(req.query.name);
  }
  pool
    .query(query, params)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.listen(4000, function () {
  console.log("Server is listening on port 4000. Ready to accept request");
});

//customer by id

app.get("/customers/:id", (req, res) => {
  const customerId = req.params.id;
  const query = "select * from customers where id = $1";
  pool
    .query(query, [customerId])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(400).json(error);
    });
});

//Add a new POST endpoint `/customers` to create a new customer with name, address, city and country.

app.post("/customers", (req, res) => {
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;
  const query =
    "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4) RETURNING *;";
  console.log(req.body);
  pool
    .query(query, [newName, newAddress, newCity, newCountry])
    .then(() => res.send("Customer created!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


app.post("/products" , (req, res) => {
  const newProduct =  req.body.product_name;
  const query = "INSERT INTO PRODUCTS (product_name) VALUES ($1)";
  pool
  .query(query, [newProduct])
  .then(() => res.send("Product created!"))
  .catch((error) => {
    console.error(error);
    res.status(500).json(error);
  });
});