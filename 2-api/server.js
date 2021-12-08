const { query, json } = require("express");
const express = require("express");
const app = express();
const { Pool } = require("pg");
app.use(express.json());

const pool = new Pool({
  user: "mya",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "mya",
  port: 5432,
});

app.get("/", function (req, res) {
  res.send("hello");
});

app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result))
    .catch((e) => console.error(e));
});

app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result))
    .catch((e) => console.error(e));
});

app.get("/products", function (req, res) {
  const productName = req.query.product_name;
  let query =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM ((products INNER JOIN product_availability ON products.id = product_availability.prod_id) INNER JOIN suppliers ON suppliers.id = product_availability.supp_id)";

  if (productName) {
    query = `SELECT * FROM products WHERE product_name LIKE '%${productName}%'`;
  }
  pool
    .query(query)
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const query = "SELECT cust.* FROM customers cust  WHERE cust.id=$1";
  pool
    .query(query, [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

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

app.post("/products", function (req, res) {
  const newProduct = req.body.product_name;

  pool
    .query("SELECT product_name FROM products WHERE product_name=$1", [
      newProduct,
    ])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send("Product Already Exists!");
      } else {
        const query = "INSERT INTO products (product_name) VALUES ($1)";

        pool
          .query(query, [newProduct])
          .then(() => res.send("New product added"))
          .catch((e) => console.error(e));
      }
    });
});

app.post("/availability", function (req, res) {
  const productId = req.body.prod_id;
  const supplierId = req.body.supp_id;
  const unitPrice = req.body.unit_price;

  if (unitPrice <= 0) {
    return res.status(400).send("Invalid price");
  }

  pool
    .query(
      "SELECT p.id, s.id FROM  products p, suppliers s  WHERE p.id=$1 AND s.id=$2",
      [productId, supplierId]
    )
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(400).send("Product or Supplier is not Exists");
      } else {
        const query =
          "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";

        pool
          .query(query, [productId, supplierId, unitPrice])
          .then(() => res.send("New product availability added"))
          .catch((e) => console.error(e));
      }
    });
});

app.post("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;
  const orderDate = req.body.order_date;
  const orderRef = req.body.order_reference;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(400).send("Customer not Exist");
      } else {
        const query =
          "INSERT INTO orders (order_date, order_reference, customer_id)VALUES ($1, $2, $3)";
        pool
          .query(query, [orderDate, orderRef, customerId])
          .then(() => res.send("New order created"))
          .catch((e) => console.error(e));
      }
    });
});

app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const newName = req.body.name;
  const newAdd = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(400).send("Customer not exist");
      } else {
        const query =
          "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5";

        pool
          .query(query, [newName, newAdd, newCity, newCountry, customerId])
          .then(() => res.send("Customer info been update"))
          .catch((e) => console.error(e));
      }
    });
});

app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query("DELETE FROM orders WHERE customer_id=$1", [orderId])
    .then(() => {
      pool
        .query("DELETE FROM customers WHERE id=$1", [orderId])
        .then(() => res.send("customer deleted"))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM orders WHERE customer_id=$1", [customerId])
    .then((result) => {
      if (result.rowCount.length !== 0) {
        res.status(400).send("Can't delete customer with orders");
      } else {
        pool
          .query("DELETE FROM customers WHERE id=$1", [customerId])
          .then(() => res.send("customer deleted"))
          .catch((e) => console.error(e));
      }
    })
    .catch((e) => console.error(e));
});

app.get("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;

  const query = "SELECT o.order_reference, o.order_date, p.product_name, pa.unit_price, s.supplier_name, oi.quantity  FROM orders o INNER JOIN order_items oi ON o.id = oi.order_id INNER JOIN products p ON oi.product_id = p.id INNER JOIN product_availability pa ON oi.product_id = pa.prod_id INNER JOIN suppliers s ON oi.supplier_id = s.id WHERE customer_id=$1"

  pool
    .query(query, [customerId])
    .then((result) => json(result.rows))
    .catch((e) => console.error(e));
});


app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
