require("dotenv").config();
const { Pool } = require("pg");
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(require("cors")());

const pool = new Pool({
  host:  'seble',
  user: "localhost",
  database: "cyf-ecommerce",
  password: process.env.PASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/customers", (req, res) => {
  pool.query("SElECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.id;
  pool
    .query("SELECT * FROM customers Where id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((error) => console.error(error));
});

app.get("/suppliers", (req, res) => {
  pool.query("SELECT * FROM suppliers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/products", (req, res) => {
  const productNameQuery = req.query.name;
  let query =
    "SELECT product_name, unit_price, supplier_name FROM products INNER JOIN product_availability on products.id=product_availability.prod_id INNER JOIN suppliers ON suppliers.id=product_availability.supp_id";
  if (productNameQuery) {
    query = `SELECT product_name, unit_price, supplier_name FROM products INNER JOIN product_availability on products.id=product_availability.prod_id INNER JOIN suppliers ON suppliers.id=product_availability.supp_id WHERE product_name LIKE '%${productNameQuery}%'`;
  }
  pool
    .query(query)
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => console.log(error));
});

app.post("/customers", (req, res) => {
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;
  const query =
    "INSERT INTO customers(name, address, city, country) VALUES ($1, $2, $3, $4)";
  pool
    .query(query, [newName, newAddress, newCity, newCountry])
    .then(() => res.send("Customer Added"))
    .catch((error) => console.error(error));
});

app.post("/products", (req, res) => {
  const { product_name } = req.body;
  let query = "SELECT * FROM products WHERE product_name=$1";

  pool.query(query, [product_name]).then((result) => {
    if (result.rows.length > 0) {
      return res.status(500).send("Product already exist!");
    } else {
      query = "INSERT INTO products(product_name) VALUES ($1)";
    }
    pool
      .query(query, [product_name])
      .then(() => res.send("product Added"))
      .catch((error) => console.error(error));
  });
});

app.post("/customers/:customerId/Orders", (req, res) => {
  const customerId = req.params.customerId;
  const { order_date, order_reference } = req.body;
  pool
    .query("Select * FROM customers Where id=$1", [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(400).send("Please enter a valid customer ID");
      } else {
        pool
          .query(
            "INSERT into orders(order_date, order_reference, customer_id) values ($1, $2, $3)",
            [order_date, order_reference, customerId]
          )
          .then(() => res.send("Order created"))
          .catch((error) => console.log(error));
      }
    });
});

app.put("/customers/:customerId", (req, res) => {
  const { customerId } = req.params;
  const { name, address, city, country } = req.body;

  pool
    .query(
      "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5",
      [name, address, city, country, customerId]
    )
    .then(() => res.send(`Customer ${customerId} updated!`))
    .catch((error) => console.error(error));
});

app.delete("/orders/:orderId", (req, res) => {
  const { orderId } = req.params;
  pool
    .query("DELETE FROM order_items Where Order_id=$1", [orderId])
    .then(() => {
      pool
        .query("DELETE FROM orders WHERE id=$1", [orderId])
        .then(() =>
          res.send("Order deleted").then((error) => console.error(error))
        );
    })
    .then((error) => console.error(error));
});

app.delete("/customers/:customerId", (req, res) => {
  const { customerId } = req.params;
  pool
    .query("SELECT * FROM orders WHERE customer_id=$1", [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        pool
          .query("DELETE FROM customers WHERE id=$1", [customerId])
          .then(() => res.send("Customer deleted"))
          .catch((error) => console.log(error));
      } else {
        res.send("Customer has orders and can not be deleted");
      }
    })
    .catch((error) => console.log(error));
});

app.listen(port, () => console.log(`Listening on port ${port}`));