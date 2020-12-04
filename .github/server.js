const { query } = require("express");
const express = require("express");
const app = express();
require('dotenv').config();
app.use(express.json());

const { Pool } = require('pg');
const pool = new Pool({
    user: 'ige_a',
    host: 'localhost',
    database: 'cyf_ecommerce',
    password: 'Dorcas88',
    port: 5432
});
    //GET PRODUCTS
app.get("/products", function(req, res) {
    const productNameQuery = req.query.name;
  if(productNameQuery){
  pool.query(`SELECT product_name, supplier_name FROM products INNER JOIN suppliers ON products.supplier_id = suppliers.id WHERE product_name Like '%${productNameQuery}%'`, (error, result) => {
      console.log(result);  
      if(!!result){
      return res.json(result.rows);
      }
    return res.status(400).send(`Not found product with name contains ${productNameQuery}`);
      
    });
    
  } else
{   
  pool.query('SELECT product_name, supplier_name FROM products INNER JOIN suppliers ON products.supplier_id = suppliers.id ', (error, result) => {
        res.json(result.rows);
    });
  }
  
});

    //Get Customers By ID 
app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

    //CREATING NEW CUSTOMER
app.post("/customers", function (req, res) {
  if (!req.body) {
    return res.status(400).send("Body not found");
  }
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;
  pool
    .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A customer with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
        pool
          .query(query, [newCustomerName, newCustomerAddress, newCustomerCity,newCustomerCountry])
          .then(() => res.send("customer has been created!"))
          .catch((e) => console.error(e));
      }
    });
});
    //CREATE PRODUCTS
app.post("/products", function (req, res) {
  if (!req.body) {
    return res.status(400).send("Body not found");
  }
  const newProductName = req.body.product_name;
  const newProductPrice = req.body.unit_price;
  const newProductSupplierId = req.body.supplier_id;
  if (!Number.isInteger(newProductPrice) || newProductPrice <= 0) {
    console.log(newProductPrice);
    return res
      .status(400)
      .send("The price of products should be a positive integer.");     
  }
  pool
    .query("SELECT * FROM suppliers WHERE id =$1", [newProductSupplierId])
    .then((result) => {
      if (!result.rows.length) {
        return res
          .status(400)
          .send(`Supplier with the ${newProductSupplierId} does not exists!`);
      }});
  const query =
    "INSERT INTO products (product_name, unit_price, supplier_id) VALUES ($1, $2, $3)";
  pool
    .query(query, [newProductName, newProductPrice, newProductSupplierId])
    .then(() => res.send("product has been created!"))
    .catch((e) => console.error(e));
});

    //Create new orders
app.post("/customers/:customerId/orders", function (req, res) {
  if (!req.body) {
    return res.status(400).send("Body not found");
  }
  const newOrderDate = req.body.order_date;
  const newOrderReference = req.body.order_reference;
  const newCustomerId = req.params.customerId; 

  if(typeof (newOrderDate)=="undefined" || typeof (newOrderReference)=="undefined" || typeof (newCustomerId)=="undefined" )
  {
    res.send("One of the fields is missing");
  }
  pool
    .query("SELECT * FROM customers WHERE id =$1", [newCustomerId])
    .then((result) => {
      if (!result.rows.length) {
        return res
          .status(400)
          .send(`Customer with the ${newCustomerId} does not exists!`);
      }});
  const query =
    "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
  pool
    .query(query, [newOrderDate, newOrderReference, newCustomerId])
    .then(() => res.send("order has been created!"))
    .catch((e) => console.error(e));
});

//UPDATE CUSTOMER DETAILS
app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const newCustomerDetails =  req.body
  pool
    .query(`UPDATE customers SET ${Object.keys(newCustomerDetails).map(key => (`${key} = '${newCustomerDetails[key]}'`)).join(',')} WHERE id=${customerId}`)
    .then(() => res.send(`Customer ${customerId} updated!`))
    .catch((e) => console.error(e));
});

    //DELETE ON CUSTOMERS WHERE customer doesn't have orders
app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool 
    .query("SELECT FROM orders WHERE customer_id = $1", [customerId])
    .then((result) => {
      if(!result.rowCount){
          pool
        .query("DELETE FROM customers WHERE id=$1", [customerId])
        .then(() => res.send(`Customer ${customerId} deleted!`))
        .catch((e) => console.error(e));
      }else {
      res.send(`customer ${customerId} has orders`)
      
      }
    })
    .catch((e) => console.error(e));
});
  //DELETE ORDERS
app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;
  pool
  .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
  .then(() =>   pool
  .query("DELETE FROM orders WHERE id=$1", [orderId])
  .then(() =>
  res.send(`Customer ${orderId} deleted!`))
  .catch((e) => console.error(e)))

});
  //Get All orders of a particular customer
app.get("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;
  pool
  .query
  ("SELECT order_reference, order_date, product_name, unit_price,supplier_name, quantity FROM  orders INNER JOIN order_items ON order_items.order_id=orders.id INNER JOIN products ON order_items.product_id =products.id INNER JOIN suppliers ON products.supplier_id = suppliers.id WHERE customer_id = $1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.listen(8000, function() {
    console.log("Server is listening on port 8000. Ready to accept requests!");
});


    