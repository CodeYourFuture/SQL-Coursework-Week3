const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const { Pool } = require("pg");

const pool = new Pool({
  user: "carte",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "p",
  port: 5432,
});

app.get("/customers", function (req, res) {
  pool.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/suppliers", function (req, res) {
  pool.query("SELECT * FROM suppliers", (error, result) => {
    res.json(result.rows);
  });
});


app.get("/products/all", function (req, res) {
  pool.query("SELECT products.product_name, suppliers.supplier_name FROM products INNER JOIN suppliers on products.supplier_id = suppliers.id", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  pool
    .query("SELECT * FROM customers WHERE id = $1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.get("/products", function (req, res) {
  const productQuery = req.query.name.toLowerCase();
  let query = "SELECT products.product_name, suppliers.supplier_name FROM products INNER JOIN suppliers on products.supplier_id = suppliers.id";

  if (productQuery) {
    query = `SELECT * FROM products WHERE LOWER (product_name) LIKE '%${productQuery}%' ORDER BY product_name`;
  }

  pool
    .query(query)
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  pool
    .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("An customer with the same name already exists!");
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
          .catch((e) => console.error(e));
      }
    });
});



app.post("/products", function (req, res) {
  const newProductName = req.body.name;
  const newProductPrice = req.body.price;
  const newProductSupplier = req.body.supplier;

  pool
    .query("SELECT * FROM products WHERE supplier_id=$1", [newProductSupplier])
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(400).send("This supplier ID does not exist.");
      } else if (!Number.isInteger(newProductPrice) || newProductPrice <= 0) {
        return res
          .status(400)
          .send("The price should be a positive integer.");
      } else {
        const query =
          "INSERT INTO products(product_name, unit_price, supplier_id) VALUES ($1, $2, $3)";

        pool
          .query(query, [newProductName, newProductPrice, newProductSupplier])
          .then(() => res.send("Product created!"))
          .catch((e) => console.error(e));
      }
    });
});

app.post("/customers/:customerId/orders", function (req, res) {
  const newOrderDate = req.body.date;
  const newOrderReference = req.body.reference;

  const customerId = req.params.customerId;

  pool.query("SELECT * FROM customers WHERE id = $1", [customerId])
.then((result) => {
        if (result.rows.length === 0) {
        return res.status(400).send("This customer ID does not exist.");
      } else {
        const query =
          "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";

  pool
    .query(query, [newOrderDate, newOrderReference, customerId])
    .then(() => res.send("Order created!"))
    .catch((e) => console.error(e));
      }
    });
});

app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;
pool.query("SELECT * FROM customers WHERE id = $1", [customerId])
.then((result) => {
        if (result.rows.length === 0) {
        return res.status(400).send("This customer ID does not exist.");
      } else {
        const query = "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5";
  pool
    .query(query, [newName, newAddress, newCity, newCountry, customerId])
    .then(() => res.send(`Customer ${customerId} updated!`))
    .catch((e) => console.error(e));
}
});
});

app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query("DELETE FROM orders WHERE id=$1", [orderId])
    .then(() => res.send(`Order ${orderId} deleted!`))
    .catch((e) => console.error(e));
});

app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM orders WHERE customer_id=$1", [customerId])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send("This customer has existing orders.");
      } else {
        pool
          .query("DELETE FROM customers WHERE id=$1", [customerId])
          .then(() => res.send(`Customer ${customerId} deleted!`))
          .catch((e) => console.error(e));
      }
    });
});


app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
