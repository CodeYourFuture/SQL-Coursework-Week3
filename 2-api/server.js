const { response } = require("express");
const express = require("express");
const app = express();
const PORT = 3001;

app.use(express.json());

const { Pool } = require("pg");

const pool = new Pool({
  user: "shafiekd",
  host: "dpg-cejjhsda4991ihn66lh0-a.oregon-postgres.render.com",
  database: "cyf_ecommerce_adtl",
  password: "Mq4Sdd8pmyho22HmecVpEuozupgY64U3",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

// 1. GET endpoint /products
app.get("/products", function (req, res) {
  pool
    .query(
      "select * from product_availability pa inner join products p on pa.prod_id = p.id inner join suppliers s on pa.prod_id = s.id "
    )
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

// 3. GET endpoint /customers/:customerId
app.get("/customers/:customerId", function (req, res) {
  let customerId = req.params.customerId;
  pool
    .query("select * from customers where id=$1", [customerId])
    .then((result) => res.json(result))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

// app.get("/customers", function (req, res) {
//   pool
//     .query("Select * from customers")
//     .then((result) => res.json(result.rows))
//     .catch((error) => {
//       console.error(error);
//       res.status(500).json(error);
//     });
// });

// 4.  POST endpoint /customers

app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  const query =
    "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";

  pool
    .query(query, [
      newCustomerName,
      newCustomerAddress,
      newCustomerCity,
      newCustomerCountry,
    ])
    .then(() => res.send("New Customer Added!"))
    .catch((error) => {
      console.error(error);
      res.status(500).send(error);
    });
});

// 5.  POST endpoint /products

app.post("/products", function (req, res) {
  const newProductName = req.body.product_name;
  const query = "INSERT INTO products (product_name) VALUES ($1)";

  pool
    .query(query, [newProductName])
    .then(() => res.send("New Product Added"))
    .catch((error) => {
      console.error(error);
      res.status(500).send(error);
    });
});

// 6. POST endpoint /availability

// app.post("/availability", function (req, res) {
//   const newProdId = req.body.prod_id;
//   const newSuppId = req.body.supp_id;
//   const newUnitPrice = req.body.unit_price;
//   const query =
//     "Insert into product_availability (prod_id, supp_id, unit_price) values ($1, $2, $3)";

//   if (!Number.isInteger(newUnitPrice) || newUnitPrice <= 0) {
//     return res
//       .status(400)
//       .send("The new unit price should be a positive integer");
//   }

//   pool.pool
//     .query(query, [newProdId, newSuppId, newUnitPrice])
//     .then(() => res.send("New Product Added"))
//     .catch((error) => {
//       console.error(error);
//       res.status(500).json(error);
//     });
// });

// - Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).

//8. POST endpoint /customers/:customerId/orders

app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  pool
    .query(
      "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5",
      [newName, newAddress, newCity, newCountry, customerId]
    )
    .then(() => res.send(`Customer ${customerId} updates!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//9. DELETE endpoint /customers/:customerId

app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query("DELETE FROM order_items WHERE order_id = $1", [orderId])
    .then(() => pool.query("DELETE FROM orders WHERE id=$1", [orderId]))
    .then(() => res.send(`Order ${orderId} has been deleted`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// 10. GET endpoint /customers/:customerId/order

app.get("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;
  // const orderId = req.params.orderId;

  const query =
    "SELECT customers.name, orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_item.quantity FROM customers INNER JOIN orders on customers.id = orders.customer_id INNER JOIN order_items ON order_items.order_id = orders.id INNER JOIN product_availability ON order_items.product_id = products.id INNER JOIN suppliers ON order_items.supplier_id = suppliers.id INNER JOIN products ON products.id = order_items.product_id WHERE customer.id=$1";

  pool
    .query(query, [customerId])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

app.listen(PORT, function () {
  console.log(`listening on ${PORT}`);
});
