const { request } = require("express");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// https://stackoverflow.com/questions/23259168/what-are-express-json-and-express-urlencoded
const { Pool } = require("pg");
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.get("/customers", function (req, res) {
  pool.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});
app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  pool.query(
    "SELECT * FROM customers WHERE id = $1",
    [customerId],
    (error, result) => {
      if (error) {
        return response.send(error);
      }
      res.json(result.rows);
    }
  );
});

//Add new customer
app.post("/customers", function (req, res) {
  const name = req.body.name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;
  const insertQuery =
    "INSERT INTO customers(name,address,city,country) VALUES($1,$2,$3,$4) RETURNING id;";
  pool.query(
    insertQuery,
    [name, address, city, country],
    (error, result) => {
      if (error) {
        return res.send(error);
      }
      res.send({ id: result.rows[0].id });
    }
  );
});
app.get("/suppliers", (request, response) => {
  pool.query("SELECT * FROM suppliers", (error, result) => {
    response.send(result.rows);
  });
});

// /products?name=Cup
app.get("/products", (request, response) => {
  const productName = request.query.name;

  const selectQuery = `SELECT product_name,unit_price, supplier_name
                      FROM products
                      INNER JOIN product_availability ON product_availability.prod_id = products.id
                      INNER JOIN suppliers ON product_availability.supp_id  = suppliers.id
                      WHERE product_name ILIKE '%${
                        productName || ""
                      }%' ; `;
  pool.query(selectQuery, (error, result) => {
    if (error) {
      return response.send(error);
    }
    response.send(result.rows);
  });
});

//Add new product
app.post("/products", function (req, res) {
  const product_name = req.body.product_name;
  const insertQuery =
    "INSERT INTO products(product_name) VALUES($1)";
  pool.query(
    insertQuery,
    [product_name],
    (error, result) => {
      if (error) {
        return res.send(error);
      }
      res.send({ msg: "product added" });
    }
  );
});
app.listen(PORT, () => {
  console.log(`Port running on ${PORT}`);
});
