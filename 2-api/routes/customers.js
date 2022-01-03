const express = require('express');
const router = express.Router();

const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "123456789",
  port: 5432,
});

// return all the customers from the database
router.get("/", (req, res) => {
  pool.query("SELECT * FROM customers", (error, result) => {
    if (error) {
      console.log(error);
      return res.send(error);
    }
    res.json(result.rows);
  });
});

//Add a new GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer
router.get("/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  //check if there is a customer with the customerId in the customers table
  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        res.send(`There is no customer with the id of ${customerId}!`);
        return;
      } else {
        // find the orders along with the items of a specific customer. Following information will be returned: order references, order dates, product names, unit prices, suppliers and quantities.
        const query =
          "SELECT ord.order_reference,  ord.order_date, ordit.quantity, pravab.unit_price, pr.product_name, supp.supplier_name FROM orders ord INNER JOIN order_items ordit ON ord.id = ordit.order_id INNER JOIN products pr ON ordit.product_id = pr.id INNER JOIN product_availability pravab ON pr.id = pravab.prod_id INNER JOIN suppliers supp ON pravab.supp_id = supp.id WHERE ord.customer_id = $1";
        pool
          .query(query, [customerId])
          .then((result) => {
            if (result.rows.length === 0) {
              res.send(
                `The customer with the if of ${customerId} has no orders.`
              );
            } else {
              res.send(result.rows);
            }
          })
          .catch((error) => {
            console.log(error);
            res.send(error);
          });
      }
    });
});

//Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.
router.post("/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  const customerIdExistsQuery = "SELECT * FROM customers WHERE id=$1";

  pool.query(customerIdExistsQuery, [customerId]).then((result) => {
    if (result.rows.length === 0) {
      return res
        .status(400)
        .send(`There is no customer with the id of ${customerId}`);
    } else {
      const { order_date, order_reference } = req.body;
      if (!order_date || !order_reference) {
        res
          .status(400)
          .send(`Please include both order date and order reference.`);
      } else {
        const insertOrderQuery =
          "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
        pool
          .query(insertOrderQuery, [order_date, order_reference, customerId])
          .then(() => {
            return res.send(
              `The order has been added for the customer with the id of ${customerId}`
            );
          })
          .catch((error) => {
            console.error(error);
            res.status(400).send(`Something went wrong!`);
          });
      }
    }
  });
});

// GET endpoint `/customers/:customerId` to load a single customer by ID.
router.get("/:customerId", (req, res) => {
  const customerId = req.params.customerId;

  //check if there is a customer with the customerId in the customers table
  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        res.send(`There is no customer with the id of ${customerId}!`);
        return;
      } else {
        res.send(result.rows);
      }
    })
    .catch((err) => {
      console.log(err);
      res.send(`Something went wrong!`);
    });
});

//PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country)
router.put("/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  const { name, address, city, country } = req.body;
  const selectCustomerQueryToUpdate = "SELECT * FROM customers WHERE id=$1";
  if (!name || !address || !city || !country) {
    return res
      .status(400)
      .send(
        `This code is programmed to update name, address, city and country altogether. Please make sure you have everything included.`
      );
  }
  pool.query(selectCustomerQueryToUpdate, [customerId]).then((result) => {
    if (result.rows.length === 0) {
      res
        .status(400)
        .send(`There is no customer to update with the id of ${customerId}`);
    } else {
      const updateCustomerQuery =
        "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5";
      pool
        .query(updateCustomerQuery, [name, address, city, country, customerId])
        .then((result) => {
          res.send(`Successfully amended.`);
        })
        .catch((error) => {
          console.error(error);
          res.status(400).send(`Something went wrong!`);
        });
    }
  });
});

//DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders - if customerId exists in orders table, then this customer has an order return error, if not delete the customer from customers table
router.delete("/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  const customerIdExistsQuery =
    "SELECT EXISTS(SELECT 1 FROM customers WHERE id=$1)";
  const customerHasAnOrderQuery =
    "SELECT EXISTS(SELECT 1 FROM orders WHERE customer_id=$1)";

  // check if the customerId is a valid id in customers table, if not return 400
  pool.query(customerIdExistsQuery, [customerId]).then((result) => {
    if (result.rows[0].exists === false) {
      return res
        .status(400)
        .send(
          `There is no customer with the id of ${customerId} in customers table.`
        );
    } else {
      // check if customer has an order in orders table, if so return 400, if not delete the customer
      pool.query(customerHasAnOrderQuery, [customerId]).then((result) => {
        console.log(result, "<----result");
        if (result.rows[0].exists === true) {
          // result.rows is an array
          return res
            .status(400)
            .send(
              `The customer with the id of ${customerId} has an order. Cannot delete it.`
            );
        } else {
          const deleteCustomerQuery = "DELETE FROM customers WHERE id=$1";
          pool.query(deleteCustomerQuery, [customerId]).then(() => {
            return res.send(
              `The customer with the id of ${customerId} has been deleted from the customers table.`
            );
          });
        }
      });
    }
  });
});


module.exports = router;