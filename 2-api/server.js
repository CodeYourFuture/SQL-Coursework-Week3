const express = require("express");
const cors = require("cors");
const app = express();
const { Pool } = require("pg");

const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: "sem",
  host: "localhost",
  database: "cyf_eccommerce",
  password: "",
  port: 5432,
});

pool.connect();

// GET "/customers" ; /?order=asc ; /?order=desc
app.get("/customers", (req, res) => {
  const query = "SELECT * FROM customers";
  pool
    .query(query)
    .then((data) => res.json(data.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// GET "/suppliers"
app.get("/suppliers", (req, res) => {
  const query = "SELECT * FROM suppliers";
  pool
    .query(query)
    .then((data) => res.json(data.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// GET "/products"
app.get("/products", (req, res) => {
  const query = "SELECT * FROM products";
  pool
    .query(query)
    .then((data) => res.json(data.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// GET "/availability"
app.get("/availability", (req, res) => {
  const query = "SELECT * FROM product_availability";
  pool
    .query(query)
    .then((data) => res.json(data.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// POST "/customers"
app.post("/customers", (req, res) => {
  const addedCustomerName = req.body.name.trim();
  const addedCustomerAddress = req.body.address.trim();
  const addedCustomerCity = req.body.city.trim();
  const addedCustomerCountry = req.body.country.trim();

  if (
    !addedCustomerName ||
    !addedCustomerAddress ||
    !addedCustomerCity ||
    !addedCustomerCountry
  ) {
    res.sendStatus(400);
    return;
  }
  pool
    .query("SELECT * FROM customers WHERE name=$1", [addedCustomerName])
    .then((data) => {
      if (data.rows.length > 0) {
        res.sendStatus(422); // name already exists
        return;
      }
      const query =
        "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
      pool
        .query(query, [
          addedCustomerName,
          addedCustomerAddress,
          addedCustomerCity,
          addedCustomerCountry,
        ])
        .then(() => res.sendStatus(201))
        .catch((error) => {
          console.error(error);
          res.status(500).json(error);
        });
    });
});

// POST "/availability"

app.post("/availability", (req, res) => {
  const newAvailabilityProdId = req.body.prod_id;
  const newAvailabilitySuppId = req.body.supp_id;
  const newAvailabilityPrice = req.body.unit_price;

  if (!Number.isInteger(newAvailabilityPrice) || newAvailabilityPrice <= 0) {
    return res.sendStatus(400);
  }
  const queryProducts = "SELECT * FROM products WHERE id=$1";
  const querySuppliers = "SELECT * FROM suppliers WHERE id=$1";
  pool.query(queryProducts, [newAvailabilityProdId]).then((data) => {
    if (!data.rows.length) {
      return res.sendStatus(400);
    } else {
      pool.query(querySuppliers, [newAvailabilitySuppId]).then((data) => {
        if (!data.rows.length) {
          return res.sendStatus(400);
        } else {
          const query =
            "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
          pool
            .query(query, [
              newAvailabilityProdId,
              newAvailabilitySuppId,
              newAvailabilityPrice,
            ])
            .then(() => res.sendStatus(201))
            .catch((error) => {
              console.error(error);
              res.status(500).json(error);
            });
        }
      });
    }
  });
});

// POST "/customers/:customerId/orders"
app.post("/customers/:customerId/orders", (req, res) => {
  const newOrderCustomerId = parseInt(req.params.customerId);
  const newOrderDate = req.body.order_date.trim();
  const newOrderReference = req.body.order_reference.trim();
  if (!newOrderCustomerId || !newOrderDate || !newOrderReference) {
    res.sendStatus(400);
    return;
  }
  pool
    .query("SELECT * FROM customers WHERE id = $1", [newOrderCustomerId])
    .then((data) => {
      if (data.rows.length === 0) {
        return res.sendStatus(400); // no customer with this id
      } else {
        const query =
          "INSERT INTO orders (order_date,order_reference,customer_id) VALUES ($1, $2, $3)";
        pool
          .query(query, [newOrderDate, newOrderReference, newOrderCustomerId])
          .then(() => res.sendStatus(201))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// GET "/customers:id"
app.get("/customers/:id", (req, res) => {
  const requestedCustomerId = parseInt(req.params.id);
  if (!requestedCustomerId) {
    res.sendStatus(404);
    return;
  }
  const query = "SELECT * FROM customers WHERE id=$1";
  pool
    .query(query, [requestedCustomerId])
    .then((data) => res.json(data.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// DELETE "/orders/:orderId"
app.delete("/orders/:orderId", (req, res) => {
  const deletedOrderId = parseInt(req.params.id);
  if (!deletedOrderId) {
    res.sendStatus(404);
    return;
  }
  const query = "DELETE FROM orders WHERE id=$1";
  pool
    .query(query, [deletedOrderId])
    .then(() => res.sendStatus(204))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// DELETE "/customers/:customerId"
app.delete("/customers/:customerId", (req, res) => {
  const deletedCustomerId = parseInt(req.params.customerId);
  pool
    .query("SELECT * FROM orders WHERE customer_id=$1", [deletedCustomerId])
    .then((data) => {
      if (data.rows.length > 0) {
        res.sendStatus(400); //customer have some order
        return;
      }
      const query = "DELETE FROM customers WHERE id=$1";
      pool
        .query(query, [deletedCustomerId])
        .then(() => res.sendStatus(201))
        .catch((error) => {
          console.error(error);
          res.status(500).json(error);
        });
    });
});

// PUT "/customers/:customerId"
app.put("/customers/:customerId", (req, res) => {
  const requestedCustomerId = parseInt(req.params.customerId);
  const changedCustomerName = req.body.name.trim();
  const changedCustomerAddress = req.body.address.trim();
  const changedCustomerCity = req.body.city.trim();
  const changedCustomerCountry = req.body.country.trim();

  if (!requestedCustomerId) {
    res.sendStatus(404);
    return;
  }
  if (
    !changedCustomerName ||
    !changedCustomerAddress ||
    !changedCustomerCity ||
    !changedCustomerCountry
  ) {
    res.sendStatus(400);
    return;
  }
  const query =
    "UPDATE customers SET name = $1, address = $2, city = $3, country = $4 WHERE id = $5";
  pool
    .query(query, [
      changedCustomerName,
      changedCustomerAddress,
      changedCustomerCity,
      changedCustomerCountry,
      requestedCustomerId,
    ])
    .then(() => res.sendStatus(201))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.listen(port, () => console.log(`Listening on port ${port}`));