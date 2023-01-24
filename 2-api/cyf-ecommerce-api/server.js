const express = require("express");
const app = express();

const { Pool } = require("pg");

const pool = new Pool({
  user: "test_user",
  host: "dpg-cf60rapa6gdjkk3bbkvg-a.oregon-postgres.render.com",
  //host: "postgres://test_user:mgC8PDhAovGQrULdAtHazqSLuwTXA2F9@dpg-cf60rapa6gdjkk3bbkvg-a.oregon-postgres.render.com/cyf_ecommerce_l80y",
  database: "cyf_ecommerce_l80y",
  password: "mgC8PDhAovGQrULdAtHazqSLuwTXA2F9",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(express.json());

app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/products", function (req, res) {
  pool
    .query(
      "select products.product_name, product_availability.unit_price, suppliers.supplier_name from product_availability inner join products on products.id=product_availability.prod_id inner join suppliers on suppliers.id=product_availability.supp_id "
    )
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//Add a new GET endpoint `/products` to return all the product names along with their prices and supplier names.

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
