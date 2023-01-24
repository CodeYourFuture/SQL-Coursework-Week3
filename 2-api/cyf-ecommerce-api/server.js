const express = require("express");
const app = express();
app.use(express.json());

const { Pool } = require("pg");

const pool = new Pool({
  user: "cyf_ecommercedb_user",
  host: "dpg-cf6122da499d72thdda0-a.oregon-postgres.render.com",
  database: "cyf_ecommercedb",
  password: "CAfiklRk7P7QDBSqxyj0I1LyKeVpudiC",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

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
  let productQuery = req.query.name;
  let query = `select products.product_name, product_availability.unit_price, suppliers.supplier_name from product_availability inner join products on products.id=product_availability.prod_id inner join suppliers on suppliers.id=product_availability.supp_id`;
  let params = [];
  if (productQuery) {
    query = `select products.product_name, product_availability.unit_price, suppliers.supplier_name from product_availability inner join products on products.id=product_availability.prod_id inner join suppliers on suppliers.id=product_availability.supp_id where products.product_name = $1`;
    params.push(productQuery);
  }
  pool
    .query(query, params)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
