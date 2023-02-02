const express = require("express");
const app = express();
const { Pool } = require("pg");
const cors = require("cors");
app.use(cors());
const bp = require("body-parser");
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));

const pool = new Pool({
  // Because I can only deply one database in the cloud (Render),
  //That is why I merged with another project and added all the table of cyf_ecommerce.sql
  // connectionString: `postgres://kawa:${process.env.DB_PASSWORD}@dpg-cfbi33pgp3jsh6aqrnag-a.oregon-postgres.render.com/videosproject_kawa_cyf`,
  // ssl: { rejectUnauthorized: false },

  connectionString: `postgres://kawa:xea5cgoHN7vSXkLYgi1pV60RwVRdJIQK@dpg-cfbi33pgp3jsh6aqrnag-a.oregon-postgres.render.com/videosproject_kawa_cyf`,
  ssl: { rejectUnauthorized: false },
});

pool.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: " + err.stack);
    return;
  }
  console.log("Connected to the database");
});

app.get("/products", (req, res) => {
  let query = "";
  console.log(!req.query.name);
  if (!req.query.name) {
    query =
      "SELECT product_name, unit_price, supplier_name    FROM products  JOIN product_availability ON products.id = product_availability.prod_id  JOIN suppliers ON product_availability.supp_id = suppliers.id";
  } else {
    query =
      "SELECT product_name, unit_price, supplier_name    FROM products  JOIN product_availability ON products.id = product_availability.prod_id  JOIN suppliers ON product_availability.supp_id = suppliers.id WHERE LOWER(product_name) LIKE " +
      "'%" +
      req.query.name +
      "%'";
    // console.log(query)
  }

  pool
    .query(query)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      res.status(400).json(error);
    });
  return;
});

app.get("/customers/:customerId", (req, res) => {
  const customersId = req.params.customerId;
  // console.log(customersId)

  if (parseInt(customersId) !== NaN) {
    pool
      .query("SELECT * FROM customers where customers.id=$1", [
        parseInt(customersId),
      ])
      .then((result) => res.json(result.rows))
      .catch((error) => {
        res.status(400).json(error);
      });
    return;
  }
});

app.post("/customers", async (req, res) => {
  const { name, address, city, country } = req.body;
  //  const  result = await pool.query("SELECT Max(id) FROM customers");
  //  const maxId= result.rows[0].max;
  if (!name || !address || !city || !country) {
    res.sendStatus(400);
    return;
  } else {
    const query =
      "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
    await pool
      .query(query, [name, address, city, country])
      .then((result) => res.json("New customer added"))
      .catch((error) => {
        res.status(400).json(error);
      });
      return;
  }
  return;
});


app.post("/products", async (req, res) => {
  if (!req.body.product_name ) {
    res.sendStatus(400);
    return;
  } else {
    const query =
      "INSERT INTO products (product_name) VALUES ($1)";
    await pool
      .query(query, [req.body.product_name])
      .then((result) => res.json("New product added"))
      .catch((error) => {
        res.status(400).json(error);
      });
      return;
  }
  return;
});

// app.get("/suppliers", (req, res) => {
//   pool
//     .query("SELECT * FROM suppliers")
//     .then((result) => res.json(result.rows))
//     .catch((error) => {
//       res.status(400).json(error);
//     });
// });
