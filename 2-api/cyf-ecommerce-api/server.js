const express = require("express");
const app = express();
const port = 5000;

app.use(express.json());

const { Pool } = require("pg");

const pool = new Pool({
  user: "migue",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "Cyf2022",
  port: 5432,
});

//Add a new GET endpoint `/products`
app.get("/products", function(req, res){
 pool.query(`SELECT product_name, 
 product_availability.unit_price, 
 supplier_name FROM 
 products JOIN  product_availability ON products.id = product_availability.prod_id
 JOIN suppliers ON supp_id = suppliers.id `)
 .then((result) => res.json(result.rows))
     .catch((error) => {
         console.error(error);
         res.status(500).json(error);
     });


})

// get customers by id
app.get("/customers/:id", function (req, res) {
  const customerId = req.params.id;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});














app.listen(port, () => {
  console.log(`server is running ${port}`);
});