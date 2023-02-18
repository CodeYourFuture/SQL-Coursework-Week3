const express = require("express");
const app = express();
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});

const db = new Pool({
  user: "postgres", // replace with you username
  host: "localhost",
  database: "cyf_ecommerce",
  password: "zision",
  port: 5432,
});

app.get("/customers", function (req, res) {
  //    console.log(res.send("hello"))
  db.query("SELECT * FROM customers", (error, result) => {
    // console.log(result)
    res.json(result.rows);
  });
});

app.get("/customers/:customerId", function (req, res) {
  var custId = parseInt(req.params.customerId);
  db.query("SELECT * FROM customers WHERE id = $1", [custId], (err, result) => {
    res.json(result.rows);
  });
});

app.get("/products", function (req, res) {
  //    console.log(res.send("hello"))
  db.query(
    "select products.product_name, product_availability.unit_price, suppliers.supplier_name from products inner join product_availability on products.id = product_availability.prod_id inner join suppliers on suppliers.id = product_availability.supp_id",
    (error, result) => {
      // console.log(result)
      res.json(result.rows);
    }
  );
});

app.get("/products/name", function (req, res) {
  //    console.log(res.send("hello"))
  const productName = req.params.name;
  if (productName) {
    db.query(
      "select products.product_name, product_availability.unit_price, suppliers.supplier_name from products inner join product_availability on products.id = product_availability.prod_id inner join suppliers on suppliers.id = product_availability.supp_id WHERE lower (products.product_name) = [`%{productName}%`]",
      (error, result) => {
        // console.log(result)
        res.json(result.rows);
      }
    );
  } else {
    db.query(
      "select products.product_name, product_availability.unit_price, suppliers.supplier_name from products inner join product_availability on products.id = product_availability.prod_id inner join suppliers on suppliers.id = product_availability.supp_id",
      (error, result) => {
        res.json(result.rows);
      }
    );
  }
});
