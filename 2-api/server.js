const express = require("express");
require("dotenv").config();
const app = express();
const { Pool } = require("pg");

app.use(express.json());

header('Content-Type: application/json');

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

// 4 
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

// 5
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

// 6 
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

// 7
app.post("/customers/:customerId/order", (req, res) => {
  const newOrderCustomerId = Number(req.params.customerId);
  const newOrderDate = req.body.order_date;
  const newOrderReference = req.body.order_reference;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [newOrderCustomerId])
    .then((result) => {
      if (!result.rows.length > 0) {
        return res.status(400).send("This customer does not exist");
      } else {
        const query =
          "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
        pool
          .query(query, [newOrderDate, newOrderReference, newOrderCustomerId])
          .then(() => res.send("Order created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// 8
// Content-Type:application/json
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

// 9
app.delete("/orders/:orderId", function (req, res) {
  let orderId = parseInt(req.params.orderId);

  pool
    .query("DELETE FROM order_items WHERE order_id =$1", [orderId])
    .then(() => pool.query("DELETE FROM orders WHERE id=$1", [orderId]))
    .then(() => res.send(`Order ${orderId} and order items deleted!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// 10
app.delete("/customers/:customerId", function (req, res) {
  let customerId = parseInt(req.params.customerId);

  pool
    .query("SELECT * from orders where customer_id=$1", [customerId])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send("This customer has existing orders");
      } else {
        const query = "DELETE FROM customers WHERE id =$1";
        pool
          .query(query, [customerId])
          .then(() =>
            pool.query("DELETE FROM customers WHERE id=$1", [customerId])
          )
          .then(() => res.send(`Customer ${customerId} deleted!`))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// 11
app.get("/customers/:customerId/orders", function (req, res) {
  let customerId = parseInt(req.params.customerId);

  pool
    .query(
      "select orders.id as order_id, orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity from orders inner join order_items on orders.id = order_items.order_id inner join product_availability on order_items.product_id = product_availability.prod_id inner join products on products.id = product_availability.prod_id inner join suppliers on suppliers.id = product_availability.prod_id where orders.customer_id = $1;",
      [customerId]
    )
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

app.listen(process.env.PORT, () => {
  console.log(`Listen in http://localhost:${process.env.PORT}`);
});
