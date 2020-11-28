const express = require("express");
const app = express();

const { Pool } = require('pg');

const pool = new Pool({
    user: 'alsak',
    host: 'localhost',
    database: 'cyf_ecommerce',
    password: 'alsak',
    port: 5432
});

app.get("/customers", function(req, res) {
    pool.query('SELECT * FROM customers', (error, result) => {
        res.json(result.rows);
    });
});
app.get("/suppliers", function(req, res) {
    pool.query('SELECT * FROM suppliers', (error, result) => {
        res.json(result.rows);
    });
});
//start of week-3 homework
app.get("/products", function(req, res) {
    pool.query('SELECT product_name,supplier_name FROM suppliers INNER JOIN products ON suppliers.id=products.supplier_id', (error, result) => {
        res.json(result.rows);
    });
});

/* app.get("/products", function(req, res) {
    const productName = req.params.productName;
    pool.query('SELECT product_name,supplier_name FROM suppliers INNER JOIN products ON suppliers.id=products.supplier_id Where product_name LIKE $1', (error, result) => {
        res.json(result.rows);
    });
}); */


// filter the list of products by name using a query parameter
app.put("/customers/:productName", function (req, res) {
  const productName = req.params.productName;
  

  pool
    .query(`SELECT product_name,supplier_name FROM suppliers INNER JOIN products ON suppliers.id=products.supplier_id Where product_name LIKE £{productName}`)
    .then(() => res.send(`Search for ${customerId} was found!`))
    .catch((e) => console.error(e));
});








app.listen(3000, function() {
    console.log("Server is listening on port 3000. Ready to accept requests!");
});

