const express = require("express");
const app = express();
app.use(express.json());
const { Pool } = require("pg");

const pool = new Pool({
  user: "Maha",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "coder2021",
  port: 5432,
});

app.get("/customers", function (req, res) {
  pool.query("SELECT name FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT name FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});


app.get("/suppliers", function (req, res) {
  pool.query("SELECT supplier_name FROM suppliers", (error, result) => {
    res.json(result.rows);
  });
});


app.get("/products", function (req, res) {
  let nameQuery = req.query.name;
  dBQuery =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON product_availability.prod_id = products.id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id";

  //if name query used, returns only results matching the name value
  if (nameQuery) {
    dBQuery += ` WHERE product_name LIKE '%${nameQuery}%' ORDER BY product_name`;
  }

  pool
    .query(dBQuery)
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});



app.get("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query(
      "SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity FROM orders LEFT JOIN order_items ON orders.id = order_items.order_id INNER JOIN product_availability ON order_items.supplier_id = product_availability.supp_id INNER JOIN products ON product_availability.prod_id = products.id INNER JOIN suppliers ON suppliers.id = order_items.supplier_id WHERE customer_id=$1",
      [customerId]
    )
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

// POST REQUESTS---------------------

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

// -----------------
// ONLY CHECKS IF PRICE POSITIVE & PRODUCT EXISTS IN DB

app.post("/availability", function (req, res) {
  const newProductId = req.body.prodId;
  const newSuppId = req.body.suppId;
  const newPrice = req.body.price;

  if (!Number.isInteger(newPrice) || newPrice <= 0) {
    return res.status(400).send("Please enter a positive price");
  }

  pool
    .query(
      "SELECT * FROM products WHERE id=$1", [newProductId]
    )
    .then((result) => {
      if (result.rows.length < 1) {
        return res.status(400).send("Product doesn't exist!");
      } else {
        const query =
          "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
        pool
          .query(query, [newProductId, newSuppId, newPrice])
          .then(() => res.send("availability added"))
          .catch((e) => console.error(e));
      }
    });
});

// ---------------

app.post("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;
  const newDate = req.body.newDate;
  const newRef = req.body.newRef;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rows.length < 1) {
        return res.status(400).send("customer doesn't exist!");
      } else {
        const query =
          "INSERT INTO orders (customer_id, order_date, order_reference) VALUES ($1, $2, $3)";
        pool
          .query(query, [customerId, newDate, newRef])
          .then(() => res.send("order added"))
          .catch((e) => console.error(e));
      }
    });
});

// PUT REQ-------
app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  pool
    .query("UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5", [newName, newAddress, newCity, newCountry, customerId])
    .then(() => res.send(`Customer ${customerId} updated!`))
    .catch((e) => console.error(e));
});


// -----Del requests

app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
    .then(() => {
      pool
        .query("DELETE FROM orders WHERE id=$1", [orderId])
        .then(() => res.send(`Customer ${orderId} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

//Delete existing customer record
//Only del if customer has no orders
app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM orders WHERE customer_id=$1", [customerId])
    .then((result) => {
      if (result.rows.length >= 1) {
        return res
          .status(400)
          .send(`Can't delete customer ${customerId}, they have an order!`);
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
