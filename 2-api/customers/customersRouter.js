const express = require("express");
const router = express.Router();
router.use(express.json());

// supplementary functions
const services = require("./customersServices");
// pg Pool object
const pool = require("../config");

// GET "/customers"
router.get("/", (req, res) => {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => res.send(error));
});

// POST "/customers"
router.post("/", (req, res) => {
  const newCostomerInfo = Object.values(req.body);

  pool
    .query("SELECT * FROM customers WHERE name=$1", [newCostomerInfo[0]])
    .then((result) => {
      if (result.rowCount > 0) {
        return res
          .status(400)
          .send("A customer with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
        pool
          .query(query, [...newCostomerInfo])
          .then(() => res.send("Customer created!"))
          .catch((error) => res.send(error));
      }
    });
});

// GET "/customers/{customerId}"
router.get("/:customerId", (req, res) => {
  const customerId = Number(req.params.customerId);
  const query = "SELECT * FROM customers WHERE id=$1";
  pool
    .query(query, [customerId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).send("The requested customer does not exist!");
      } else {
        res.status(200).send(result.rows);
      }
    })
    .catch((error) => res.send(error));
});

// POST "/customers/{customerId}/orders"
router.post("/:customerId/orders", (req, res) => {
  const newOrderInfo = Object.values(req.body);
  const customerId = req.params.customerId;
  // return res.send(newOrderInfo)
  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).send("The specified customer does not exist!");
      } else {
        const query =
          "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
        pool
          .query(query, [...newOrderInfo, customerId])
          .then(() => res.send("Order added!"))
          .catch((error) => res.send(error));
      }
    });
});

// PUT ("/customers/{customerId}")
router.put("/:customerId", (req, res) => {
  const customerId = Number(req.params.customerId);
  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).send("The requested customer does not exist!");
      }
      const errors = services.allowOrForbidCustomerUpdate(
        req.body,
        result.rows
      );
      if (errors.length > 0) {
        return res.status(400).json(errors);
      }
      const updatedFields = services.compareWithOriginal(result.rows, req.body);
      if (updatedFields) {
        const query = services.buildUpdateQuery(updatedFields);
        return pool
          .query(query, [...Object.values(updatedFields), customerId])
          .then(() => res.send(`Customer ${customerId} updated!`))
          .catch((error) => res.send(error));
      }
    });
});

// DELETE ("/customers/{customerId}")
router.delete("/:customerId", (req, res) => {
  const customerId = Number(req.params.customerId);
  pool
    .query("SELECT * FROM orders WHERE customer_id = $1;", [customerId])
    .then((result) => {
      if (result.rowCount > 0) {
        return res.status(403).send({
          error: `Action failed. Deleting a customer with existing order history is not allowed.`,
        });
      }
      pool
        .query("DELETE FROM customers WHERE id = $1", [customerId])
        .then(() => res.status(204).send(`Customer ${customerId} deleted!`))
        .catch((error) => res.send(error));
    });
});

// GET /customers/{customerId}/orders
router.get("/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  pool
    .query("SELECT * FROM orders WHERE customer_id = $1;", [customerId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(404).send("The requested customer does not exist!");
      }
      pool
        .query(services.getCustomerOrdersQuery(customerId), [customerId])
        .then((result) => res.send(result.rows))
        .catch((error) => res.send(error));
    })
    .catch((error) => res.send(error));
});

module.exports = router;
