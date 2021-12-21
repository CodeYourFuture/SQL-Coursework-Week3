const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
// const bodyParser = require("body-parser");
// const res = require("express/lib/response");
const app = express();
app.use(express.json());
app.use(cors());
// app.use(
//   bodyParser.urlencoded({
//     extended: false,
//   })
// );
// app.use(bodyParser.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "Abdulrahman123",
  port: 5432,
});

// GET All Customers
app.get("/customers", (req, res) => {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.send(result.rows))
    .catch((e) => console.error(e));
});

// GET All Suppliers
app.get("/suppliers", (req, res) => {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.send(result.rows))
    .catch((e) => console.error(e));
});

// GET all the product names along with their prices and supplier names.
app.get("/products", (req, res) => {
  const name = req.query.name;
  console.log(name);
  const query =
    "SELECT p.product_name, pa.unit_price, s.supplier_name FROM products p inner join product_availability pa on pa.prod_id = p.id inner join suppliers s on s.id = pa.supp_id WHERE product_name = $1";
  if (!name) {
    pool
      .query("SELECT * FROM products")
      .then((result) => res.send(result.rows))
      .catch((e) => console.error(e));
  } else {
    pool
      .query(query, [name])
      .then((result) => {
        res.send(result.rows);
      })
      .catch((e) => console.error(e));
  }
});

// GET customers by Id
app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  pool
    .query(`SELECT * FROM customers WHERE id = ${customerId}`)
    .then((result) => res.send(result.rows))
    .catch((e) => console.error(e));
});

// post Create a new customer
app.post("/customers", (req, res) => {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;
  const query =
    "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
  if (
    !Number.isInteger(newCustomerName) &&
    !Number.isInteger(newCustomerAddress) &&
    !Number.isInteger(newCustomerCity) &&
    !Number.isInteger(newCustomerCountry)
  ) {
    pool
      .query(query, [
        newCustomerName,
        newCustomerAddress,
        newCustomerCity,
        newCustomerCountry,
      ])
      .then(() => res.status(201).send(`The ${newCustomerName} has been added`))
      .catch((e) => console.error(e));
  } else {
    res.status(400).send("Please check the data should be string");
  }
});
// post Create a new product
app.post("/products", (req, res) => {
  const newProductName = req.body.product_name;
  const query = "INSERT INTO products (product_name) VALUES ($1)";
  if (newProductName.length > 0 && !Number.isInteger(newProductName)) {
    pool
      .query(query, [newProductName])
      .then(() => res.status(201).send(`The ${newProductName} has been added`))
      .catch((e) => console.error(e));
  } else {
    res
      .status(400)
      .send("Please check the data should be string and non empty");
  }
});

// post endpoint `/availability` to create a new product availability
app.post("/availability", (req, res) => {
  const newProdId = req.body.prod_id;
  const newSuppId = req.body.supp_id;
  const newUnitPrice = req.body.unit_price;

  const query =
    "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
  pool
    .query("SELECT * FROM products p WHERE id = $1", [newProdId])
    .then((result) => {
      if (result.rows.length === 0) {
        res.status(400).send("The product ID is not existed in products table");
      } else {
        pool
          .query("SELECT * FROM suppliers s WHERE id = $1", [newSuppId])
          .then((result) => {
            if (result.rows.length === 0) {
              res
                .status(400)
                .send("The supplier ID is not existed in suppliers table");
            } else {
              pool
                .query(
                  "SELECT * FROM product_availability WHERE prod_id = $1 AND supp_id = $2",
                  [newProdId, newSuppId]
                )
                .then((result) => {
                  // console.log(result.rows)
                  if (result.rows.length > 0) {
                    res
                      .status(400)
                      .send("The product ID is existed with the supplier ID");
                  } else if (newUnitPrice < 0) {
                    res.status(400).send("The price should be positive number");
                  } else {
                    pool
                      .query(query, [newProdId, newSuppId, newUnitPrice])
                      .then(() =>
                        res
                          .status(201)
                          .send("The Product Availability has been updated")
                      )
                      .catch((e) => console.error(e));
                  }
                })
                .catch((e) => console.error(e));
            }
          })
          .catch((e) => console.error(e));
      }
    })
    .catch((e) => console.error(e));
});

// post endpoint `/customers/:customerId/orders` to create a new order
app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  const newOrderDate = req.body.order_date;
  const newOrderReference = req.body.order_reference;
  const query =
    "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
  pool
    .query(`SELECT * FROM customers WHERE id = ${customerId}`)
    .then((result) => {
      if (result.rows.length === 0) {
        res
          .status(400)
          .send("The customer ID is NOT existed in customers table.");
      } else {
        pool
          .query(query, [newOrderDate, newOrderReference, customerId])
          .then(() => res.status(201).send("The order has been CREATED"))
          .catch((e) => console.error(e));
      }
    })
    .catch((e) => console.error(e));
});

// PUT endpoint `/customers/:customerId`
app.put("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  const name = req.body.name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;
  console.log(req.body);
  // const query = `UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5`;

  pool
    .query(`SELECT * FROM customers WHERE id=${customerId}`)
    .then((result) => {
      // update name
      if (name !== undefined) {
        pool
          .query(`UPDATE customers SET name=$1 WHERE id=$2`, [name, customerId])
          // .then(() => res.status(204))
          .catch((e) => console.error(e));
      } else {
        pool
          .query(`UPDATE customers SET name=$1 WHERE id=$2`, [
            result.rows[0].name,
            customerId,
          ])
          // .then(() => res.status(204))
          .catch((e) => console.error(e));
      }
      // address
      if (address !== undefined) {
        pool
          .query(`UPDATE customers SET address=$1 WHERE id=$2`, [
            address,
            customerId,
          ])
          // .then(() => res.status(204))
          .catch((e) => console.error(e));
      } else {
        pool
          .query(`UPDATE customers SET address=$1 WHERE id=$2`, [
            result.rows[0].address,
            customerId,
          ])
          // .then(() => res.status(204))
          .catch((e) => console.error(e));
      }
      // city
      if (city !== undefined) {
        pool
          .query(`UPDATE customers SET city=$1 WHERE id=$2`, [city, customerId])
          // .then(() => res.status(204))
          .catch((e) => console.error(e));
      } else {
        pool
          .query(`UPDATE customers SET city=$1 WHERE id=$2`, [
            result.rows[0].city,
            customerId,
          ])
          // .then(() => res.status(204))
          .catch((e) => console.error(e));
      }
      // country
      if (country !== undefined) {
        pool
          .query(`UPDATE customers SET country=$1 WHERE id=$2`, [
            country,
            customerId,
          ])
          // .then(() => res.status(204))
          .catch((e) => console.error(e));
      } else {
        pool
          .query(`UPDATE customers SET country=$1 WHERE id=$2`, [
            result.rows[0].country,
            customerId,
          ])
          // .then(() => res.status(204))
          .catch((e) => console.error(e));
      }

      res.status(201).send("UPDATED")
    })
    .catch((e) => console.error(e));

  
  
});

// DELETE endpoint `/orders/:orderId` to delete an existing order with customerID in customers table

app.delete(`/orders/:orderId`, (req, res) => {
  const orderId = req.params.orderId;
  pool
    .query(`DELETE FROM order_items WHERE order_id=${orderId}`)
    .then(() => {
      pool
        .query(`DELETE FROM orders WHERE id=${orderId}`)
        .then(() => {
          res
            .status(201)
            .send("The order has been deleted in the orders table");
        })
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

// DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.
app.delete(`/customers/:customerId`, (req, res) => {
  const customerId = req.params.customerId;

  pool
    .query(`SELECT * FROM orders WHERE customer_id=${customerId}`)
    .then((result) => {
      if (result.rows.length === 0) {
        pool
          .query(`DELETE FROM customers WHERE id=${customerId}`)
          .then(() =>
            res
              .status(201)
              .send(
                "The customer does not have an order, so it has been deleted"
              )
          )
          .catch((e) => console.error(e));
      } else {
        res
          .status(400)
          .send("The customer has an order, so it cannot be deleted");
      }
    })
    .catch((e) => console.error(e));
});

// GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer
app.get(`/customers/:customerId/orders`, (req, res) => {
  const customerId = req.params.customerId;

  const query =
    "SELECT o.order_date, o.order_reference, p.product_name, pa.unit_price, s.supplier_name, oi.quantity From orders o inner join order_items oi on oi.order_id = o.id inner join products p on oi.product_id = p.id inner join suppliers s on s.id = oi.supplier_id inner join product_availability pa on pa.prod_id = p.id WHERE customer_id=$1";

  pool
    .query(query, [customerId])
    .then((result) => {
      res.send(result.rows);
    })
    .catch((e) => console.error(e));
});

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
