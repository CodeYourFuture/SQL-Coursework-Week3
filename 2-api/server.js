const { response } = require("express");
const express = require("express");
const postgres = require("pg");
app = express();
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT;
const pool = new postgres.Pool({
  connectionString: process.env.PG_CONNECT,
});

app.get("/customers", (req, res) => {
  pool.connect().then((client) => {
    return client
      .query("SELECT * FROM customers")
      .then((result) => {
        client.release();
        res.send(result.rows);
      })
      .catch((error) => {
        console.error(error);
        res.send(error);
      });
  });
});

app.get("/suppliers", (req, res) => {
  pool.connect().then((client) => {
    return client
      .query("SELECT * FROM suppliers")
      .then((result) => {
        client.release();
        res.send(result.rows);
      })
      .catch((error) => {
        console.error(error);
        res.send(error);
      });
  });
});

app.get("/products", (req, res) => {
  pool.connect().then((client) => {
    let thisQuery;
    if (req.query.name) {
      (thisQuery = `
                SELECT p.product_name, pa.unit_price, s.supplier_name
                FROM product_availability AS pa
                JOIN products AS p
                on p.id = pa.prod_id
                JOIN suppliers AS s
                ON pa.supp_id = s.id
                WHERE p.product_name LIKE(%$1%)
            `), [req.query.name];
    }else{
      thisQuery = `
                SELECT p.product_name, pa.unit_price, s.supplier_name
                FROM product_availability AS pa
                JOIN products AS p
                on p.id = pa.prod_id
                JOIN suppliers AS s
                ON pa.supp_id = s.id
            `;
    }
    return client
      .query(thisQuery)
      .then((result) => {
        client.release();
        res.send(result.rows);
      })
      .catch((error) => {
        console.error(error);
        res.send(error);
      });
  });
});

app.get("/", (req, res) => {
  res.send(
    `welcome to the cyf_ecommerce_api

        Routes Included:
        ----------------
        * /customers - returns all customers
        * /suppliers - returns all the suppliers
        * /products - return product names + costs + supplier`
  );
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
