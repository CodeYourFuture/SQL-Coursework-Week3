const express = require("express");
const app = express();

const { Pool } = require("pg");

const pool = new Pool({
  user: "codeyourfuture",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "CYFStudent123",
  port: 5432,
});

app.use(express.json());

app.get("/customers", (req, res) => {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/suppliers", (req, res) => {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
//week3
app.get("/products", (req, res) => {
  let productQuery = req.query.name;
  //pool
    let query = "SELECT products.product_name, product_availability.unit_price,suppliers.supplier_name from product_availability inner join products on products.id=product_availability.prod_id inner join suppliers on suppliers.id=product_availability.supp_id";
    let params = [];
    if(productQuery) {
      query = "SELECT products.product_name, product_availability.unit_price,suppliers.supplier_name from product_availability inner join products on products.id=product_availability.prod_id inner join suppliers on suppliers.id=product_availability.supp_id where products.product_name = $1";

    params.push(productQuery);
    } 
    
    pool.query(query,params)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;

  pool.query("SELECT * FROM customers WHERE customers.id=$1", [customerId]).then((result) => res.json(result.rows)).catch((error)=> {
    console.error(error);
    res.status(500).json(error);
  });
});

app.post("/customers", (req, res) => {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  const query = "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";

  pool.query(query, [newCustomerName, newCustomerAddress, newCustomerCity, newCustomerCountry]).then(() => res.send("New customer created")).catch((error) => {
    console.error(error);
    res.status(500).json(error);
  });
});

//post new product
app.post("/products", (req, res) => {
  const productName = req.body.product_name;
  const unitPrice = req.body.unit_price;
  const supplierName = req.body.supplier_name;
  const query =
    "INSERT INTO products (id,name, address, city, country) VALUES ( (SELECT MAX(id) FROM products) + 1 , $1, $2, $3)";
  const params = [productName, unitPrice, supplierName];
  pool
    .query(query, params)
    .then(() => {
      pool
        .query("SELECT * FROM products")
        .then((result) => {
          res.json(result.rows);
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json(error);
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.post("/availability", (req, res) => {
  const productId = req.body.prod_id;
  const supplierId = req.body.supp_id;
  const unitPrice = req.body.unit_price;
  pool.query("INSERT INTO product_availability (unit_price) VALUES ($1) ", [unitPrice]).then(res.send("Availability added"));

});

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
