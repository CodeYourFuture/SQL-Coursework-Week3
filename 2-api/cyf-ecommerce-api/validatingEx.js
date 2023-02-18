const express = require("express");
const bodyParser = require("body-parser");
const app = express();

const { Pool } = require("pg");

app.use(bodyParser.json());

const db = new Pool({
  user: "codeyourfuture", // replace with you username
  host: "localhost",
  database: "cyf_hotel",
  password: "cyf123",
  port: 5432,
});

// GET

app.get("/customers", function (req, res) {
  db.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

// Exercise 3 Q.2 and 3
// Exercise 4
app.post("/customers", function (req, res) {
  const newName = req.body.name;
  const newEmail = req.body.email;
  const newPhone = req.body.phone;
  const newAdd = req.body.address;
  const newCity = req.body.city;
  const newCode = req.body.postcode;
  const newCountry = req.body.country;

  const query =
    "INSERT INTO customers (name, email, phone, address, city, postcode, country) " +
    "VALUES ($1, $2, $3, $4, $5, $6, $7) " +
    "RETURNING id";

  // First validate the phone number using a regular expression to check for valid characters
  if (
    newPhone.replace(/[+\-()0-9 ]/g, "0") != // replace all valid chars with 0
    "0".padEnd(newPhone.length, "0")
  ) {
    // compare with all zeros same length as phone
    return res
      .status(400)
      .send("The phone number must only contain 0-9, +, -, (, ) or space.");
  }

  // Validate the new customer's email address by querying the existing customers table
  // to return any rows that contain the same values
  db.query(
    "SELECT 1 FROM customers WHERE email=$1",
    [newEmail],
    (err, result) => {
      if (result.rowCount > 0) {
        // note the use of result.rowCount
        return res
          .status(400)
          .send("A customer with that email address already exists!");
      } else {
        db.query(
          query,
          [newName, newEmail, newPhone, newAdd, newCity, newCode, newCountry],
          (err, result) => {
            res.status(201).send(`Customer ${result.rows[0].id} created.`);
          }
        );
      }
    }
  );
});

app.listen(3110, function () {
  console.log("Server is listening on port 3110. Ready to accept requests!");
});
