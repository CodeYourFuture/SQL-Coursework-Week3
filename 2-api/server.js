const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const { Pool } = require("pg");
app.use(bodyParser.json());

const db = new Pool({
  user: "mamad", // replace with you username
  host: "localhost",
  database: "cyf_ecommerce",
  password: "mamad1364",
  port: 5432,
});

app.get("/", function (req, res) {
  // Send response to client and print an message
  res.send("<h1>cyf-ecommerce Database project Home Page</h1>");
});
app.get("/products", function (req, res) {
  let r = `SELECT  p.product_name ,pa.unit_price ,s.supplier_name FROM products AS p
        INNER JOIN product_availability AS pa
        ON p.id = pa.prod_id
        join  suppliers AS s
        ON (pa.supp_id = s.id)
        `;

  db.query(r, (error, result) => {
    if (error) {
      console.error("Error executing query", error);
      res.status(500).send("Error executing query");
    } else {
      res.json(result.rows);
    }
  });
});

//
// app.get("/products", function (req, res) {
//   let r = `SELECT  p.name , pa.unit_price , s.supplier_name FROM products p
//     innerjoin product_availability pa
//     on p.id =pa.prod_id
//     join  suppliers s
//     on pa.supp_id = s.id
//     `;
//   db.query(r, (error, result) => {
//     res.json(result.rows);
//   });
// }); // Send response to client and print an message
app.post("/customers", function (req, res) {
  const newName = req.body.name;
  const nweAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  if (!newName || !nweAddress || !newCity || !newCountry) {
    return res.status(400).send("No customers added.");
  }

  const query =
    "INSERT INTO customers (name, address, city, country) " +
    "VALUES ($1, $2, $3, $4) returning id";

  db.query(query, [newName, nweAddress, newCity, newCountry], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("New Customer not added!.");
    }
    const newID = result.rows[0].id;
    res.send(`New customer added. New Id = ${newID}`);
  });
});
////////////////////
app.post("/availability", (req, res) => {
  const prod_Id = req.body.productId;
  const supp_Id = req.body.supplierId;
  const price = req.body.price;
  console.log(prod_Id);
  console.log(supp_Id);
  console.log(price);
  if (!prod_Id || !supp_Id || !price) {
    return res.status(400).send("error at availibility post.");
  }

  if (!Number.isInteger(price) || price <= 0) {
    res.status(400).send("Please enter a  your number");
  }

  db.query(
    "SELECT * FROM product_availability WHERE supp_id=$1 AND prod_id=$2;",
    [supp_Id, prod_Id]
  ).then((result) => {
    if (result.rows.length > 0) {
      res.status(400).send("Product ID and supplier ID already exists!");
    } else if (result.rows.length === 0) {
      res.status(400).send("No product/supplier exists for this ID!");
    } else {
      const query =
        "INSERT INTO product_availability (unit_price, supp_id, prod_id) VALUES($1,$2,$3)";
      db.query(query, [price, supp_Id, prod_Id]).then(() =>
        res.send("New Availability added!")
      );
    }
  });
});
/////////////////////////////////////////////////////////////////////////
// Listen connections on port defined as PORT
const port = process.env.PORT || 3000;
app.listen(port, function () {
  // Callback called when server is listening
  console.log(`Server starter and listening on port ${port}.`);
});
