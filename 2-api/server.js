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

// app.get("/products", function (req, res) {
//   pool
//     .query(
//       "select * from product_availability pa inner join products p on pa.prod_id = p.id inner join suppliers s on pa.prod_id = s.id "
//     )
//     .then((result) => res.json(result.rows))
//     .catch((error) => {
//       console.log(error);
//       res.status(500).json(error);
//     });
// });

app.get("/products", function (req, res) {
  pool
    .query("select * from products")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });
});

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

app.get("/customers", function (req, res) {
  pool
    .query("Select * from customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

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

//- Add a new DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items

app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query("DELETE FROM order_items WHERE order_id = $1", [orderId])
    .then(() => pool.query("DELETE FROM orders WHERE id=$1", [orderId]))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.listen(PORT, function () {
  console.log(`listening on ${PORT}`);
});
