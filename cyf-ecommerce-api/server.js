const express = require("express");
const app = express();
app.use(express.json());

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

app.get("/products", function(req, res) {
    const name = req.query.name;
    if(!name){
    pool.query(`SELECT product_name,supplier_name FROM suppliers INNER JOIN products ON suppliers.id=products.supplier_id`, (error, result) => {
        res.json(result.rows);
    });
    }
    else{
     
     pool.query(`SELECT product_name,supplier_name FROM suppliers INNER JOIN products ON suppliers.id=products.supplier_id WHERE LOWER(product_name) LIKE '%${name.toLowerCase()}%'`, (error, result) => {
        res.json(result.rows);
    });
    }

   
});
//a new GET endpoint `/customers/:customerId` to load a single customer by ID.
app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

//a new POST endpoint `/customers` to create a new customer.
app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;
  

  const query =
    "INSERT INTO customers (name, address, city,country) VALUES ($1, $2, $3, $4)";

  pool
    .query(query, [newCustomerName, newCustomerAddress, newCustomerCity, newCustomerCountry])
    .then(() => res.send("Customer created!"))
    .catch((e) => console.error(e));
});

//Add a new POST endpoint `/products` to create a new product 
//(with a product name, a price and a supplier id).

app.post("/products", function (req, res) {
  const product_name = req.body.name;
  const unit_price  = req.body.price;
  const supplier_id  = req.body.s_id;
 
  
  const query =
    "INSERT INTO products (product_name, unit_price, supplier_id) VALUES ($1, $2, $3)";
if(!Number.isInteger(unit_price) || unit_price < 0){
res.send('Price must be an integer');
}
pool.query(`SELECT * FROM suppliers WHERE id='${supplier_id}'`)
.then((result) => !result.rows.length && res.status(400).send(`Not found supplier with id ${supplier_id}`))
.catch((e) => console.error(e));

  pool
    .query(query, [product_name, unit_price, supplier_id])
    .then(() => res.send("product created!"))
    .catch((e) => console.error(e));
});



app.listen(3000, function() {
    console.log("Server is listening on port 3000. Ready to accept requests!");
});

