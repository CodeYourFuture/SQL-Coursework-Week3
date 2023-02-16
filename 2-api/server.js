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

// POST METHOD customers
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

// POST METHOD products
app.post("/products", function (req, res) {
  const { name } = req.body;

  db.query("INSERT INTO products (product_name) VALUES ($1) RETURNING *", [name], (error, results) => {
    if (error) {
      throw error;
    }
    res.status(201).send(`User added with ID: ${results.rows[0].id}`);
  });
});

// post method product availability
app.post("/availability", async (req, res) => {
  const { price, supId, prodId } = req.body;
  const query = "INSERT INTO product_availability (unit_price, supp_id, prod_id) VALUES ($1, $2, $3) RETURNING *";
  const proIdCheck = await db.query("SELECT * FROM products WHERE id = $1", [prodId]).then((data) => data.rowCount > 0);
  const supIdCheck = await db.query("SELECT * FROM suppliers WHERE id = $1", [supId]).then((data) => data.rowCount > 0);
  const duplicateCheck = await db.query("SELECT * FROM product_availability WHERE prod_id = $1 and supp_id = $2", [prodId, supId]).then((data) => data.rowCount === 0);
  if (proIdCheck && supIdCheck && Number.isInteger(price) && price > 0 && duplicateCheck) {
    const result = await db.query(query, [price, supId, prodId]);
    res.status(201).json(result.rows);
  } else {
    res.status(400).send("missing info or duplicated row");
  }
});

app.put("/customers/:customerId", function (req, res) {
  const customerID = +eq.params.id;
  const { name, address, city, country } = req.body;

  db.query("UPDATE customers SET name = $1, address = $2, city = $3, country = $4 WHERE id = $5", [name, address, city, country, customerID], (error, results) => {
    if (error) {
      throw error;
    }
    res.status(202).send(`Customer modified with ID: ${id}`);
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
  let query = "select * from products";

  let params = [];
  if (searchKey) {
    query =
      "select p.product_name, p_a.unit_price,s.supplier_name from products p join product_availability p_a on (p.id = p_a.prod_id) join suppliers s on (s.id = p_a.supp_id) WHERE p.product_name LIKE $1";
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
