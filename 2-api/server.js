const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const PORT = 3000;
const { Pool } = require("pg");

app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const pool = new Pool({
  user: "selcukkarakus",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.get("/", (req, res) => {
  res.json({ info: "Node.js, Express, and Postgres API" });
});

const getCustomers = (req, res) => {
  return pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
};

const getCustomerById = (req, res) => {
  const { customerId } = req.params;
  return pool
    .query("SELECT * FROM customers WHERE id = $1", [customerId])
    .then((result) => res.send(result.rows))
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
};

const setNewCustomer = (req, res) => {
  const { name, address, city, country } = req.body;

  const query =
    "INSERT INTO customers (name, address, city, country) VALUES($1, $2, $3, $4)";

  return pool
    .query(query, [name, address, city, country])
    .then(() => res.send("Added!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
};

const setNewProduct = (req, res) => {
  const { product_name } = req.body;

  const query = "INSERT INTO products ( product_name ) VALUES($1)";

  return pool
    .query(query, [product_name])
    .then(() => res.send("Added!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
};

const setProductAvailability = (req, res) => {
  const { prod_id, supp_id, unit_price } = req.body;
  const query =
    "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";

  return pool
    .query(query, [prod_id, supp_id, unit_price])
    .then(() => res.send("Added!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
};

const setNewOrder = (req, res) => {
  console.log(req.params);
};

const getSuppliers = (req, res) => {
  return pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
};

const getProducts = (req, res) => {
  return pool
    .query(
      "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM product_availability INNER JOIN products ON products.id=product_availability.prod_id LEFT JOIN suppliers ON suppliers.id=product_availability.supp_id"
    )
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
};

const getCustomerOrder = (req, res) => {
  const { customerId } = req.params;

  const query =
    "SELECT DISTINCT order_reference, order_date, product_name, unit_price, supplier_name, quantity FROM orders " +
    "INNER JOIN order_items ON order_items.order_id = orders.id " +
    "INNER JOIN product_availability ON product_availability.prod_id = order_items.product_id " +
    "INNER JOIN products ON products.id = order_items.product_id " +
    "INNER JOIN suppliers ON suppliers.id = order_items.supplier_id " +
    "INNER JOIN customers ON customers.id = orders.customer_id " +
    "WHERE customers.id = $1";

  return pool
    .query(query, [customerId])
    .then((result) => res.send(result.rows))
    .catch((error) => console.log(error));
};

const deleteOrder = (req, res) => {
  const { orderId } = req.params;

  return pool
    .query("DELETE FROM orders WHERE id = $1", [orderId])
    .then(() => res.send("Deleted!"))
    .catch((error) => console.log(error));
};

const deleteCustomer = (req, res) => {
  const { customerId } = req.params;

  return pool
    .query("DELETE FROM customers WHERE id = $1", [customerId])
    .then(() => res.send("Deleted!"))
    .catch((error) => console.log(error));
};

app.get("/customers", getCustomers);
app.get("/customers/:customerId", getCustomerById);
app.get("/customers/:customerId/orders", getCustomerOrder);
app.get("/suppliers", getSuppliers);
app.get("/products", getProducts);

app.post("/customers", setNewCustomer);
app.post("/products", setNewProduct);
app.post("/availability", setProductAvailability);
app.post("/customers/:customerId/order", setNewOrder);

app.delete("/orders/:orderId", deleteOrder);
app.delete("/customers/:customerId", deleteCustomer);

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}.`);
});
