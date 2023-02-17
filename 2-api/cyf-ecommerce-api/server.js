const express = require("express");
const app = express();

const { Pool } = require("pg");

const db = new Pool({
  user: "codeyourfuture", // replace with you username
  host: "localhost",
  database: "cyf_ecommerce",
  password: "cyf123",
  port: 5432,
});

app.get("/customers", function (req, res) {
  db.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/suppliers", function (req, res) {
  db.query(
    "select distinct s.supplier_name from customers c join orders o on (c.id = o.customer_id) join order_items oi on (o.id = oi.order_id) join product_availability pa on (oi.product_id = pa.prod_id) join products p on (pa.prod_id = p.id)join suppliers s on (s.id = pa.supp_id)",
    (error, result) => {
      res.json(result.rows);
    }
  );
});

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
