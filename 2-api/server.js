/// express
const express = require("express");
const app = express();

/// pg package  baraye etesal be database  /// START
const { Pool } = require("pg");
const db = new Pool({
  host: "localhost",
  port: 5432,
  user: "rosha",
  password: "1111",
  database: "cyf_ecommerce",
});

app.listen(3000);

//node-postgres.com/apis/client

// app.get("/customers", (request, response) => {
//   db.query("SELECT * FROM customers")
//     .then((res) => response.json(res.rows))
//     .catch((e) => console.error(e.stack));
// });

// or
app.get("/customers", function (req, res) {
  db.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/suppliers", function (req, res) {
  db.query("SELECT * FROM suppliers", (error, result) => {
    res.json(result.rows);
  });
});




app.get("/products", function (req, res) {
  db.query(
    "select p.product_name,p_a.unit_price,s.supplier_name from products p inner join product_availability p_a on (p.id= p_a.prod_id) inner join suppliers s on( s.id= p_a.supp_id)",
    (error, result) => {
      res.json(result.rows);
    }
  );
});
