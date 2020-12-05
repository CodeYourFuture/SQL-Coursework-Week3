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

//Add a new POST endpoint `/customers/:customerId/orders` to create a new order
// (including an order date, and an order reference) for a customer.

app.post("/customers/:customerId/orders", function (req, res) {
 const customerId = req.params.customerId;
  const order_date = req.body.order_date;
  const order_reference = req.body.order_reference;
 
  const queryCustomer = "SELECT id from customers WHERE id = $1";
  
  pool
    .query(queryCustomer, [customerId])
    .then((result) => {
        if(!result.rows.length > 0){
       return res.status(400).send('Customer does not exist');
        }
       
    })

    .catch((e) => console.error(e));

  const query =
    "INSERT INTO orders (order_date, order_reference,customer_id) VALUES ($1, $2, $3)";

  pool
    .query(query, [order_date, order_reference, customerId])
    .then(() => res.send("Order created!"))
    .catch((e) => console.error(e));
});

//a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).

app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const name = req.body.name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;

  pool
    .query("UPDATE customers SET name=$1,address=$2,city=$3,country=$4 WHERE id=$5", [name,address,city,country, customerId])
    .then(() => res.send(`Customer with the id:${customerId} was updated!`))
    .catch((e) => console.error(e));
});


//a new DELETE endpoint `/orders/:orderId` to delete an existing order along all the associated order items.
app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
    .then(() => {
      pool
        .query("DELETE FROM orders WHERE id=$1", [orderId])
        .then(() => res.send(`Order with the id: ${orderId} was deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

//a new DELETE endpoint `/customers/:customerId` to delete an existing customer 
//only if this customer doesn't have orders.

app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

 const queryCustomer = "SELECT customer_id from orders WHERE customer_id = $1";
  
  pool
    .query(queryCustomer, [customerId])
    .then((result) => {
        if(result.rows.length > 0){
       return res.status(400).send('The customer has orders');
        }
       
    })

    .catch((e) => console.error(e));


  pool
    .query("DELETE FROM orders WHERE customer_id=$1", [customerId])
    .then(() => {
      pool
        .query("DELETE FROM customers WHERE id=$1", [customerId])
        .then(() => res.send(`Customer ${customerId} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});

/* Add a new GET endpoint `/customers/:customerId/orders` to load all the orders along the items in 
the orders of a specific customer. Especially, the following information should be returned: order 
references, order dates, product names, unit prices, suppliers and quantities. */

app.get("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT order_reference,order_date,product_name,unit_price,supplier_name,quantity FROM order_items INNER JOIN orders ON order_items.id=orders.customer_id INNER JOIN products ON order_items.id=products.supplier_id INNER JOIN customers ON order_items.id=customers.id INNER JOIN suppliers ON order_items.id=suppliers.id WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});



app.listen(3000, function() {
    console.log("Server is listening on port 3000. Ready to accept requests!");
});

