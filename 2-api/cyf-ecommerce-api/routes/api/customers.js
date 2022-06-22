const express = require("express");
const router = express.Router();
const pool = require("../../pool");

// Customers
// Gets all the customers
router.get("/", (req, res) => {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.send(result.rows))
    .catch((error) => console.log(error));
});

// Individual customer's orders
router.get("/:customerId/orders", (req, res) => {
  const { customerId } = req.params;

  const queryString =
    "SELECT DISTINCT order_reference, order_date, product_name, unit_price, supplier_name, quantity FROM orders " +
    "INNER JOIN order_items ON order_items.order_id = orders.id " +
    "INNER JOIN product_availability ON product_availability.prod_id = order_items.product_id " +
    "INNER JOIN products ON products.id = order_items.product_id " +
    "INNER JOIN suppliers ON suppliers.id = order_items.supplier_id " +
    "INNER JOIN customers ON customers.id = orders.customer_id " +
    "WHERE customers.id = $1";

  pool
    .query(queryString, [customerId])
    .then((result) => res.send(result.rows))
    .catch((error) => console.log(error));
});

// Individual Customer
router.get("/:customerId", (req, res) => {
  const { customerId } = req.params;

  pool
    .query("SELECT * FROM customers WHERE id = $1", [customerId])
    .then((result) => res.send(result.rows))
    .catch((error) => console.log(error));
});

// Post a new customer
router.post("/", (req, res) => {
  const { name, address, city, country } = req.body;

  for (let key in req.body) {
    if (!req.body[key]) {
      return res.status(400).send("Please fill in all the details");
    }
  }

  pool
    .query(
      "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)",
      [name, address, city, country]
    )
    .then(() => res.send("Successful"))
    .catch((error) => console.log(error));
});

router.post("/:customerId/orders", (req, res) => {
  const { customerId } = req.params;
  const { orderDate, orderRef } = req.body;

  // 1st pool to check if customer exists
  pool
    .query("SELECT * FROM customers WHERE id = $1", [customerId])
    .then((data) => {
      if (data.rows <= 0) {
        return res.status(400).send("Customer does not exist");
      } else {
        pool
          .query(
            "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)",
            [orderDate, orderRef, customerId]
          )
          .then(() => res.send("Successful"))
          .catch((error) => console.log(error));
      }
    })
    .catch((error) => console.log(error));
});

// Updates customer data
router.put("/:customerId", (req, res) => {
  const { customerId } = req.params;

  const keyArr = [];
  const valueArr = [];

  // Loops through and pushes the keys and value into separate arrays
  for (let key in req.body) {
    if (req.body[key]) {
      keyArr.push(key);
      valueArr.push(req.body[key]);
    }
  }

  // This creates a set statement based on the array/object
  const newkeyArr = keyArr.map(
    (data, index, array) => `${data} = $${array.indexOf(data) + 2}`
  );

  let queryString = `UPDATE customers SET ${newkeyArr} WHERE id = $1`;

  pool
    .query(queryString, [customerId, ...valueArr])
    .then(() => res.send("successful"))
    .catch((error) => console.log(error));
});

// Deletes a customer if they do not have any orders
router.delete("/:customerId", (req, res) => {
  const { customerId } = req.params;

  // 1st pool to check if the customer has any orders
  pool
    .query("SELECT * FROM orders WHERE customer_id = $1", [customerId])
    .then((data) => {
      if (data.rows.length > 0) {
        return res.status(400).send("Could not delete, customer has orders");
      } else {
        // 2nd pool to delete the user
        pool
          .query("DELETE FROM customers WHERE id = $1", [customerId])
          .then(() => res.send("Succesful"))
          .catch((error) => console.log(error));
      }
    })
    .catch((error) => console.log(error));
});

module.exports = router;
