const express = require("express");
const app = express();
const { Pool } = require("pg");

app.use(express.json());

const db = new Pool({
  user: "nabwa",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.get("/customers", function (req, res) {
  db.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/customers/:id", function (req, res) {
  const customerId = req.params.id;
  db.query("select * from customers where id = $1", [customerId], (error, result) => {
    res.json(result.rows);
  });
});

// POST METHOD
app.post("/customers", function (req, res) {
  console.log(req.body);
  const { name, address, city, country } = req.body;

  db.query("INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4) RETURNING *", [name, address, city, country], (error, results) => {
    if (error) {
      throw error;
    }
    res.status(201).send(`User added with ID: ${results.rows[0].id}`);
  });
});

//
app.get("/suppliers", function (req, res) {
  db.query("SELECT * FROM suppliers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/products", (req, res) => {
  const searchKey = req.query.name;
  console.log(searchKey);
  let query = "select p.product_name, p_a.unit_price,s.supplier_name from products p join product_availability p_a on (p.id = p_a.prod_id) join suppliers s on (s.id = p_a.supp_id)";

  let params = [];
  if (searchKey) {
    query += "WHERE p.product_name LIKE $1";
    params.push(`%${searchKey}%`);
  }

  db.query(query, params)
    .then((result) => res.json(result.rows))
    .catch((err) => {
      console.error(err);
      res.status(500).json(err);
    });
});

app.listen(8080, function () {
  console.log("Server is listening on port 8080.");
});
