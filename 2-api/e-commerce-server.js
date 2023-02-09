const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
// const cors = require("cors");
// app.use(cors());

app.use(express.json());
app.use(cors());
const { Pool } = require("pg");


const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "sharifa",
  port: 5432,
});

app.get("/", function(req, res){
  res.json("Welcome to the CYF e-Commerce API");
})

// GET the entire products
app.get("/products", function(req, res){
  const productNameQuery = req.query.name;
  let query =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id;";
  let params = [];
  if(productNameQuery){
    query =
      "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id WHERE products.product_name LIKE $1";
      params.push(`%${productNameQuery}%`);
  }     
    pool.query(query, params)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// Get the entire customers
app.get("/customers", function(req, res){
  let query = "SELECT * FROM customers";

  pool
    .query(query)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
})

// Get the customers by their IDs
app.get("/customers/:customerId", function(req, res){
  const custId = req.params.customerId;
  let query = "SELECT * FROM customers WHERE id=$1";
  let params = [custId];
  pool.query(query, params)
  .then((result) => res.json(result.rows))
  .catch((error) => {
    console.error(error);
    res.status(500).json(error);
  })
})

// Post a new customer data
app.post("/customers", function(req, res){
  const newCustomerName = req.body.name;
  const newCustomerAdd = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  pool.query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
  .then((result) => {
    if(result.rows.length > 0){
      return res.status(400).send("A customer with the entered name already exists!");
    } else {
      pool.query("INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)", [newCustomerName, newCustomerAdd, newCustomerCity, newCustomerCountry])
      .then(() => res.send("A new customer is created!"))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
    }
  });
});




app.listen(port, function () {
  console.log("Server is listening on port "+port+". Ready to accept requests!");
});