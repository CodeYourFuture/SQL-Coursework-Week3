const express = require("express");
const app = express();

const { Pool } = require('pg');
require('dotenv').config()

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const pool = new Pool({
    user: process.env.USERNAME,
    host: 'localhost',
    database: 'cyf_ecommerce',
    password: process.env.PASSWORD,
    port: 5432
});

// filter customers by Id
app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

//customers
app.get("/customers", function(req, res) {
    pool.query('SELECT * FROM customers', (error, result) => {
        res.json(result.rows);
    }); });
//suppliers
    app.get("/suppliers", function(req, res) {
    pool.query('SELECT * FROM suppliers', (error, result) => {
        res.json(result.rows);
    });});

    //stretch goal //already done in week 2
app.get("/products", function(req, res) {
    pool.query('SELECT products.product_name, suppliers.supplier_name FROM products INNER JOIN suppliers ON suppliers.id = products.supplier_id', (error, result) => {
        res.json(result.rows);
    });
});

   // filter products by name
app.get("/products/products", function (req, res) {
  const productNameQuery = req.query.name;
  let query = `SELECT * FROM products`;
  pool
    .query(`SELECT * FROM products WHERE product_name LIKE '%${productNameQuery}%'`)
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

// create a new customer

app.post("/customers", function (req, res) {
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry= req.body.country;

  pool
    .query(`INSERT INTO customers (name, address, city, country) VALUES ('${newName}', '${newAddress}', '${newCity}', '${newCountry}')`)
    .then(() => res.send("Customer created!"))
    .catch((e) => console.error(e));
});

// create a new product

app.post("/products", function (req, res) {
  const newProductName = req.body.product_name;
  const newUnitPrice = req.body.unit_price;
  const newSupplierId = req.body.supplier_id;
  if (!Number.isInteger(newUnitPrice) || newUnitPrice <= 0) {
    return res
      .status(400)
      .send("The Unit Price should be a positive integer.");
  }

  pool
    .query("SELECT * FROM suppliers WHERE id=$1", [newSupplierId])
    .then((result) => {
      if (result.rows.length <= 0) {
        return res
          .status(400)
          .send("The supplier does not exists in the database!");
      } else {
        const query =
          "INSERT INTO products (product_name, unit_price, supplier_id) VALUES ($1, $2, $3)";
        pool
          .query(query, [newProductName, newUnitPrice, newSupplierId])
          .then(() => res.send("Product created!"))
          .catch((e) => console.error(e));
      }
    });
});

// create a new Order

app.post("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;
  const newOrderDate = req.body.order_date;
  const newOrderReference = req.body.order_reference;
  const newCustomerId = customerId;
 
  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rows.length <= 0) {
        return res
          .status(400)
          .send("The customer does not exists in the database!");
      } else {
        const query =
          "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
        pool
          .query(query, [newOrderDate, newOrderReference, newCustomerId])
          .then(() => res.send("Order created!"))
          .catch((e) => console.error(e));
      }
    });
});

// update an existing customer
app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;
 
  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rows.length <= 0) {
        return res
          .status(400)
          .send("The customer does not exists in the database!");
      } else {
        const query =
          "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5";
        pool
          .query(query, [newName, newAddress, newCity, newCountry, customerId])
          .then(() => res.send("Customer updated!"))
          .catch((e) => console.error(e));
      }
    });
});

// delete an existing order along all the associated order items.

app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;
   pool
    .query("SELECT FROM orders WHERE id=$1", [orderId])
    .then((result) => {
    if (result.rows.length <= 0) {
        return res
          .status(400)
          .send("The order does not exists in the database!");
      } else {
  pool
    .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
    .then(() => {
      pool
        .query("DELETE FROM orders WHERE id=$1", [orderId])
        .then(() => res.send(`Order ${orderId} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));}})
});

// delete an existing customer only if this customer does
// not have orders

app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
   pool
    .query("SELECT FROM orders WHERE customer_id=$1", [customerId])
    .then((result) => {
    if (result.rows.length > 0) {
        return res
          .status(400)
          .send("you cannot delete the customer who have orders in the system!");
      } else {
  pool
        .query("DELETE FROM customers WHERE id=$1", [customerId])
        .then(() => res.send(`Customer ${customerId} deleted!`))
        .catch((e) => console.error(e));
      }})
    .catch((e) => console.error(e));
    
  });

  //load all the orders along the items in the order
  //order references, order dates, product names, 
  //unit prices, suppliers and quantities
app.get("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;
  pool
    .query("SELECT * FROM orders WHERE customer_id=$1", [customerId])
    .then((result) => {
      if (result.rows.length <= 0) {
        return res
          .status(400)
          .send("The customer does not have any order!");
      } else {
        pool
          .query("SELECT order_reference, order_date, quantity, product_name, unit_price, supplier_name FROM orders INNER JOIN order_items ON order_items.order_id=orders.id INNER JOIN products ON products.id=order_items.product_id INNER JOIN suppliers ON suppliers.id =products.supplier_id")
          .then((result) => res.json(result.rows))
          .catch((e) => console.error(e));
      }
    });
});



app.listen(3000, function() {
    console.log("Server is listening on port 3000. Ready to accept requests!");
});