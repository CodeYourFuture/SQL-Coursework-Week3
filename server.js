const express = require("express");
const app = express();
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const pool = new Pool({
    connectionString: process.env.CONNECTIONSTRING,
});

// app.get("/customers", function(req, res) {
//     const sql= 'SELECT * FROM customers';
//     pool.query(sql, (error, result) => {
//         if(error) throw error;
//         res.json(result.rows);
//     });
// });


// app.get("/suppliers", function(req, res) {
//     const sql ='SELECT * FROM suppliers';
//     pool.query(sql, (error, result) => {
//         if(error) throw error;
//         res.json(result.rows);
//     });
// });

// If you don't have it already, add a new GET endpoint `/products` to load all the product names 
// along with their prices and supplier names.

// app.get("/products", function(req, res) {
//     const sql = `SELECT product_name, product_availability.unit_price, suppliers.supplier_name
//                  FROM products
//                  INNER JOIN product_availability ON products.id = product_availability.prod_id
//                  INNER JOIN suppliers ON product_availability.supp_id = suppliers.id`
//     pool.query(sql, (error, result) => {
//         if(error) throw error;
//         res.json(result.rows);
//     });
// });


// - Update the previous GET endpoint `/products` to filter the list of products by name using a query parameter, 
// for example `/products?name=Cup`. This endpoint should still work even if you don't use the `name` query parameter!
app.get("/products", function (req, res) {
    const name = req.query.name;
    if (name) {
        const sql = `SELECT product_name, product_availability.unit_price, suppliers.supplier_name
                     FROM products
                     INNER JOIN product_availability ON products.id = product_availability.prod_id
                     INNER JOIN suppliers ON product_availability.supp_id = suppliers.id
                     WHERE product_name LIKE '%${name}%'`
        pool.query(sql, (error, result) => {
            if (error) throw error;
            res.json(result.rows);
        });
    } else {
        const sql = `SELECT product_name, product_availability.unit_price, suppliers.supplier_name
                    FROM products
                    INNER JOIN product_availability ON products.id = product_availability.prod_id
                    INNER JOIN suppliers ON product_availability.supp_id = suppliers.id`
        pool.query(sql, (error, result) => {
            if (error) throw error;
            res.json(result.rows);
        });
    }
});

// - Add a new GET endpoint `/customers/:customerId` to load a single customer by ID.
app.get("/customers/:customerId", (req, res) => {
    const SelectCustomerId = req.params.customerId;
    const SQL = "SELECT * FROM customers WHERE id = $1";
    pool.query(SQL, [SelectCustomerId], (err, result) => {
        if (err) throw error;
        res.json(result.rows);
    })
})

// - Add a new POST endpoint `/customers` to create a new customer with name, address, city and country.

app.post("/customers", (req,res) => {

})
// - Add a new POST endpoint `/products` to create a new product.
app.post("/products", (req,res) => {

})

// - Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id).
//  Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.
app.post("/availability", (req,res) => {

})

// - Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer. 
// Check that the customerId corresponds to an existing customer or return an error.
app.post("/customers/:customerId/orders", (req,res) => {

})

// - Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).
app.put("/customers/:customerId", (req,res) => {

})

// - Add a new DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items.
app.delete("/orders/:orderId", (req,res) => {

})

// - Add a new DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.
app.delete("/customers/:customerId", (req,res) => {

})

// - Add a new GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer.
//  Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.


app.get("/customers/:customerId/orders", (req, res) => {
    const SelectCustomerId = req.params.customerId;
    const SQL = "SELECT * FROM customers WHERE id = $1";
    pool.query(SQL, [SelectCustomerId], (err, result) => {
        if (err) throw error;
        res.json(result.rows);
    })
})



















app.listen(5000, function () {
    console.log("Server is listening on port 5000. Ready to accept requests!");
});