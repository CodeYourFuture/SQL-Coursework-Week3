const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middelwares
app.use(express.json());
const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Configuring the database
const pool = new Pool({
  user: "farzad-nazif",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "7633",
  port: 5432,
});

// All customers
app.get("/customers", (req, res) => {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// Customer by ID
app.get("/customers/:id", (req, res) => {
  const id = req.params.id;
  pool
    .query("SELECT * FROM customers WHERE id = $1", [id])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// Update a customer
app.put("/customers/:customerId", (req, res) => {
  const customerID = Number(req.params.customerId);
  const customerName = req.body.name;
  const customerAddress = req.body.address;
  const customerCity = req.body.city;
  const customerCountry = req.body.country;
  if (customerName) {
    pool.query("UPDATE customers SET name = $1 WHERE id = $2", [
      customerName,
      customerID,
    ]);
  }
  if (customerAddress) {
    pool.query("UPDATE customers SET address = $1 WHERE id = $2", [
      customerAddress,
      customerID,
    ]);
  }
  if (customerCity) {
    pool.query("UPDATE customers SET city = $1 WHERE id = $2", [
      customerCity,
      customerID,
    ]);
  }
  if (customerCountry) {
    pool.query("UPDATE customers SET country = $1 WHERE id = $2", [
      customerCountry,
      customerID,
    ]);
  }
  res.send("Customer name has been updated ");
});

// Load all orders for one specific customer
app.get("/customers/:customerId/orders", (req, res) => {
  const customerID = Number(req.params.customerId);
  const query =
    "SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity, customers.id FROM orders JOIN order_items ON order_items.order_id = orders.id JOIN products ON order_items.product_id = products.id JOIN product_availability ON order_items.product_id = product_availability.prod_id JOIN suppliers ON order_items.supplier_id = suppliers.id JOIN customers ON orders.customer_id = customers.id WHERE customers.id = $1";
  const params = [customerID];
  pool.query(query, params).then((result) => {
    res.send(result.rows);
  });
});

// Delete an existig order
app.delete("/orders/:orderId", (req, res) => {
  const orderID = Number(req.params.orderId);
  const query = "DELETE FROM orders WHERE id = $1";
  const params = [orderID];
  pool.query("SELECT * FROM orders WHERE id = $1", [orderID]).then((result) => {
    let final = `${result.rowCount}`;
    if (result.rowCount == 0) {
      res.send("There is no order with the given ID");
    }
    pool
      .query(query, params)
      .then(res.send(`Order with this ID : ${orderID} has been deleted`));
  });
});

// Create a new order
app.post("/customers/:customerId/orders", (req, res) => {
  const customerID = Number(req.params.customerId);
  const orderDate = req.body.order_date;
  const orderRefrence = req.body.order_refrence;
  pool
    .query("SELECT * FROM customers WHERE id = $1", [customerID])
    .then((reslt) => {
      let final = `${reslt.rowCount}`;
      if (reslt.rowCount == 0) {
        res.sendStatus(404).send("Customer does not exists");
      }
      pool
        .query(
          "INSERT INTO orders (order_date,order_reference) VALUES ( $1, $2)",
          [orderDate, orderRefrence]
        )
        .then(res.send("Order has been added"));
    });
});

// Delete a customer who doesn't have order
app.delete("/customers/:customerId", async (req, res) => {
  const customerID = Number(req.params.customerId);
  const query =
    "SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity, customers.id FROM orders JOIN order_items ON order_items.order_id = orders.id JOIN products ON order_items.product_id = products.id JOIN product_availability ON order_items.product_id = product_availability.prod_id JOIN suppliers ON order_items.supplier_id = suppliers.id JOIN customers ON orders.customer_id = customers.id WHERE customers.id = $1";
  const params = [customerID];
  await pool.query(query, params).then((result) => {
    let final = `${result.rowCount}`;
    if (result.rowCount == 0) {
      pool
        .query("DELETE FROM customers WHERE id = $1", [customerID])
        .then(
          res.send(
            `Customer with ID :  ${customerID} does not have any order has been deleted`
          )
        );
    } else {
      res.send("Customer has some orders");
    }
  });
});

// Create a new customer
app.post("/customers", (req, res) => {
  const customerName = req.body.name;
  const customerAddress = req.body.address;
  const customerCity = req.body.city;
  const customerCountry = req.body.country;
  const query =
    "INSERT INTO customers (id,name, address, city, country) VALUES ( (SELECT MAX(id) FROM customers) + 1 , $1, $2, $3,$4)";
  const params = [customerName, customerAddress, customerCity, customerCountry];
  pool
    .query(query, params)
    .then(() => {
      pool
        .query("SELECT * FROM customers")
        .then((result) => {
          res.json(result.rows);
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json(error);
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// All suppliers
app.get("/suppliers", (req, res) => {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// All products
app.get("/products", (req, res) => {
  const productName = req.query.name;
  const query =
    "SELECT products.product_name,product_availability.unit_price,suppliers.supplier_name FROM product_availability JOIN products ON product_availability.prod_id = products.id JOIN suppliers ON product_availability.supp_id = suppliers.id ORDER BY product_availability.unit_price DESC";
  pool
    .query(query)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// Create a new product
app.post("/products", (req, res) => {
  const productName = req.body.product_name;
  const unitPrice = req.body.unit_price;
  const supplierName = req.body.supplier_name;
  const query =
    "INSERT INTO products (id,name, address, city, country) VALUES ( (SELECT MAX(id) FROM products) + 1 , $1, $2, $3)";
  const params = [productName, unitPrice, supplierName];
  pool
    .query(query, params)
    .then(() => {
      pool
        .query("SELECT * FROM products")
        .then((result) => {
          res.json(result.rows);
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json(error);
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// Create a new availability PROBLEM
app.post("/availability", (req, res) => {
  const productID = req.body.prod_id;
  const supplierID = req.body.supp_id;
  const unitPrice = req.body.unit_price;
  //   const query =
  //     "INSERT INTO product_availability (prod_id,supp_id, unit_price) VALUES ($1, $2, $3)";
  //   const params = [productID, supplierID, unitPrice];
  //   pool
  //     .query(
  //       "SELECT * FROM product_availability WHERE prod_id = $1 AND supp_id = $2",
  //       [productID, supplierID]
  //     )
  //     .then((result) => {
  //       result.rowCount > 0 ? res.send("found") : pool.query(query, params);
  //     });
  pool
    .query("INSERT INTO product_availability (unit_price) VALUES ($1) ", [
      unitPrice,
    ])
    .then(res.send("Availability has been added"));
});

app.listen(port, () => console.log(`Listening on port ${port}`));
