const express = require("express");
const bodyParser = require("body-parser");
const app = express();

const { Pool } = require("pg");
const { query } = require("express");

app.use(bodyParser.json());

const db = new Pool({
  user: "codeyourfuture", // replace with you username
  host: "localhost",
  database: "cyf_ecommerce",
  password: "cyf123",
  port: 5432,
});
// GET

app.get("/customers", function (req, res) {
  db.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/customers/:customerId", function (req, res) {
  db.query(
    "SELECT * FROM customers where id = $1",
    [parseInt(req.params.customerId)],
    (error, result) => {
      res.json(result.rows);
    }
  );
});

app.get("/suppliers", function (req, res) {
  db.query(
    "select distinct s.supplier_name from customers c join orders o on (c.id = o.customer_id) join order_items oi on (o.id = oi.order_id) join product_availability pa on (oi.product_id = pa.prod_id) join products p on (pa.prod_id = p.id)join suppliers s on (s.id = pa.supp_id)",
    (error, result) => {
      res.json(result.rows);
    }
  );
});

app.get("/products", function (req, res) {
  let queryParams = [];
  let sql =
    "select p.product_name, pa.unit_price, s.supplier_name from product_availability pa join products p on (pa.prod_id = p.id) join suppliers s on (s.id = pa.supp_id)";
  if (req.query.name) {
    sql +=
      " where p.product_name ilike $1 || '%' or p.product_name ilike '%' || $1 or p.product_name ilike '%' || $1 || '%'";
    queryParams.push(req.query.name);
  }

  db.query(sql, queryParams, (error, result) => {
    res.json(result.rows);
  });
});

//POST
app.post("/availability", function (req, res) {
  const prodId = req.body.prodId;
  const suppId = req.body.suppId;
  const price = req.body.price;

  if (price < 0 || typeof price !== "number") {
    return res.status(400).send("Error: the price is not a positive number.");
  }

  const subQuery1 = "select 1 from product_availability where prod_id = $1";
  const subQuery2 = "select 1 from product_availability where supp_id= $1";
  const query =
    "INSERT INTO product_availability (prod_id, supp_id, unit_price) " +
    "VALUES ($1, $2, $3) ";

  db.query(subQuery1, [prodId], (err, result) => {
    if (result.rowCount <= 0) {
      return res
        .status(400)
        .send("Error: the product Id is not exist in the database.");
    } else {
      db.query(subQuery2, [suppId], (err, result) => {
        if (result.rowCount <= 0) {
          return res
            .status(400)
            .send("Error: the supplier Id is not exist in the database.");
        } else {
          db.query(query, [prodId, suppId, price], (err, result) => {
            res.send(`Product ${prodId} created.`);
          });
        }
      });
    }
  });
});

app.post("/customers", function (req, res) {
  const newName = req.body.name;
  const newAdd = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  const query =
    "INSERT INTO customers (name, address, city, country) " +
    "VALUES ($1, $2, $3, $4)" +
    "RETURNING id";

  db.query(query, [newName, newAdd, newCity, newCountry], (err, result) => {
    res.send(`Customer ${result.rows[0].id} created.`);
  });
});

app.post("/products", function (req, res) {
  const newProduct = req.body.name;

  const query =
    "INSERT INTO products (product_name) " + "VALUES ($1)" + "RETURNING id";

  db.query(query, [newProduct], (err, result) => {
    res.send(`Product ${result.rows[0].id} created.`);
  });
});

//PUT
app.put("/customers/:customerId", function (req, res) {
  const custId = req.params.customerId;
  const newName = req.body.name;
  const newAdd = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  db.query(
    "UPDATE customers SET name=$2, address = $3, city = $4, country = $5 WHERE id=$1",
    [custId, newName, newAdd, newCity, newCountry]
  )
    .then(() => res.send(`Customer ${custId} updated!`))
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});

//DELETE
app.delete("/orders/:orderId", function (req, res) {
  const Id = req.params.orderId;

  db.query("DELETE FROM order_items WHERE order_id=$1", [Id])
    .then(() => {
      db.query("DELETE FROM orders WHERE id=$1", [Id])
        .then(() => res.send(`Order ${Id} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

app.listen(3100, function () {
  console.log("Server is listening on port 3100. Ready to accept requests!");
});
