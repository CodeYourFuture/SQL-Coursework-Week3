//Libraries
const express = require("express");
const app = express();
const { Pool } = require("pg");
const port = process.env.port || 3001;
app.use(express.json());

const pool = new Pool({
  user: "test_user",
  host: "dpg-cf4j8cha6gdtfg33f0ug-a.oregon-postgres.render.com",
  database: "cyf_ecommerce_testdb",
  password: "6Won6otyntKOsILXN2GdIZ0jqVFWYRfz",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/", (req, res) => {
  const name = req.query.name;
  let where = "";
  if (name) where = `where product_name ilike '%${name}%'`;

  const queryString = `select product_name, supplier_name, unit_price 
    from products 
    inner join product_availability on prod_id= products.id
    inner join suppliers on suppliers.id = supp_id ${where}`;
  pool
    .query(queryString)
    .then((result) => res.json(result.rows))
    .catch((err) => res.json(err));
});

app.get("/customer/:customerId", (req, res) => {
  const { customerId } = req.params;
  const queryString = `select * from customer where id = $1`;

  pool
    .query(queryString, [customerId])
    .then((result) => {
      console.table(result.rows);
      res.json(result.rows);
    })
    .catch((err) => res.json(err));
});

app.post("/customer", (req, res) => {
  const { name, address, city, country } = req.body;
  const queryString = `insert into customer ( name, address, city, country) values ($1, $2, $3, $4)`;

  pool
    .query(queryString, [name, address, city, country])
    .then(() => res.status(200).send("New customer!!!"))
    .catch((err) => res.json(err));
});

app.put("/customer/:customerId", (req, res) => {
  const { customerId } = req.params;
  const { name, address, city, country } = req.body;
  const queryString = `update customer set name = $1, address=$2, city=$3, country=$4 where id = $5`;

  pool
    .query(queryString, [name, address, city, country, customerId])
    .then(() => res.status(200).send("Customer updates!!!"))
    .catch((err) => res.json(err));
});

app.delete("/customer/:customerId", (req, res) => {
  const { customerId } = req.params;
  const queryString = `delete from customers where id = $1`;

  pool
    .query(queryString, [customerId])
    .then(() => res.status(200).send("Customer deleted!!!"))
    .catch((err) => res.json(err));
});