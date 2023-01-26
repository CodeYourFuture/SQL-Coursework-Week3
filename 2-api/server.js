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

app.listen(PORT, function () {
  console.log(`listening on ${PORT}`);
});
