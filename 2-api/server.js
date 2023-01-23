//Required Libraries
const express = require("express");
const app = express();
const { Pool } = require('pg');
app.use(express.json());

// Variables
const pool = new Pool({
    user: 'sql_week_3_cyf_ecommerce_api_user',
    host: 'dpg-cf7culhmbjsmch8qsmr0-a.oregon-postgres.render.com',
    database: 'sql_week_3_cyf_ecommerce_api',
    password: 'bZNG67otvKiRPsWsGkHVPhK1SYFLxSgJ',
    port: 5432
    , ssl: {
        rejectUnauthorized: false
    }
});

app.get("/customers", function(req, res) {
    pool.query('SELECT * FROM customers')
        .then((result) => res.json(result.rows))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
  });

  app.get("/suppliers", function(req, res) {
    pool.query('SELECT * FROM suppliers')
        .then((result) => res.json(result.rows))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
  });

  app.get("/products", function (req, res) {
    pool
      .query(
        `select product_name, unit_price as price, supplier_name from products 
          inner join product_availability on products.id = product_availability.prod_id 
          inner join suppliers on suppliers.id = product_availability.supp_id;`
      )
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  });

  // SELECT BY ID

  app.get("/customers/:customerId", function (req, res) {
    const customerId = req.params.customerId;
  
    pool
      .query("SELECT * FROM customers WHERE id=$1", [customerId])
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  });

  // ADD A NEW CUSTOMER
//name, address, city and country
app.post("/customers", function (req, res) {
    const newCustomerName = req.body.name;
    const newAddress = req.body.address;
    const newCity = req.body.city;
    const newCountry = req.body.country;
  
    pool
    .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("An Customer with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
        pool
          .query(query, [newCustomerName, newAddress, newCity, newCountry])
          .then(() => res.send("Customer created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
  });

   // ADD A NEW PRODUCT
//name, address, city and country
app.post("/products", function (req, res) {
    const newProductName = req.body.name;
  
    pool
    .query("SELECT * FROM customers WHERE name=$1", [newProductName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A product with the same name already exists!");
      } else {
        const query =
          "INSERT INTO products (product_name) VALUES ($1)";
        pool
          .query(query, [newProductName])
          .then(() => res.send("Product created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
  });

  //create a new product availability (with a price and a supplier id)
  app.post("/availability", function(req, res) {
    const prod_id = req.body.prod_id;
    const supp_id = req.body.supp_id;
    const newPrice = req.body.unit_price;

    const query = 'INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)';
    pool.query(query, [prod_id, supp_id, newPrice])
        .then(() => res.send("Product created!"))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});



app.put("/customers/:customerId", function (req, res) {
const customerId = req.params.customerId;
const customerName = req.body.name;
const customerAddress = req.body.address;
const customerCity = req.body.city;
const customerCountry = req.body.country;

pool
  .query("UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5", [customerName, customerAddress, customerCity, customerCountry, customerId])
  .then(() => res.send(`Customer ${customerId} updated!`))
  .catch((error) => {
    console.error(error);
    res.status(500).json(error);
  });
});

app.listen(process.env.PORT || 3000, function() {
    console.log("Server is listening on port 3000. Ready to accept requests!");
});