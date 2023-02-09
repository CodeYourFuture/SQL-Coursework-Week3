const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
// const cors = require("cors");
// app.use(cors());

app.use(express.json());
app.use(cors());
const { Pool } = require("pg");


const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "sharifa",
  port: 5432,
});

app.get("/", function(req, res){
  res.json("Welcome to the CYF e-Commerce API");
})

app.get("/products", function(req, res){
  const productQuery = req.query.name;
  let query =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id;";
    
    
    pool.query(query)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


app.listen(port, function () {
  console.log("Server is listening on port "+port+". Ready to accept requests!");
});