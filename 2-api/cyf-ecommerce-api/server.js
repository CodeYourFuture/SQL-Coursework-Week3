const express = require("express");
const app = express();
app.use(express.json());
const { Pool } = require("pg");

const pool = new Pool({
  user: "Maha",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "coder2021",
  port: 5432,
});

app.get("/customers", function (req, res) {
  pool.query("SELECT name FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT name FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.get("/suppliers", function (req, res) {
  pool.query("SELECT supplier_name FROM suppliers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/products", function (req, res) {
  let nameQuery = req.query.name;
  dBQuery =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON product_availability.prod_id = products.id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id";

  //if name query used, returns only results matching the name value
  if (nameQuery) {
    dBQuery += ` WHERE product_name LIKE '%${nameQuery}%' ORDER BY product_name`;
  }

  pool
    .query(dBQuery)
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});


// POST REQUESTS---------------------

app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerAdd = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  if (!newCustomerName) {
    return res.status(400).send("Please enter customer name");
  }
  pool
    .query("SELECT name FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send("Customer name is already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES ($1,$2,$3,$4)";
        pool
          .query(query, [
            newCustomerName,
            newCustomerAdd,
            newCustomerCity,
            newCustomerCountry,
          ])
          .then(() => res.send("customer added"))
          .catch((e) => console.error(e));
      }
    });
});

// -----------------

app.post("/products", function (req, res) {
    const newProductName = req.body.name;

  if (!newProductName) {
    return res.status(400).send("Please enter product name");
  }
  pool
    .query("SELECT product_name FROM products WHERE product_name=$1", [
      newProductName,
    ])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send("PRODUCT already exists!");
      } else {
        const query = "INSERT INTO products (product_name) VALUES ($1)";
        pool
          .query(query, [newProductName])
          .then(() => res.send("product added"))
          .catch((e) => console.error(e));
      }
    });
});




app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
