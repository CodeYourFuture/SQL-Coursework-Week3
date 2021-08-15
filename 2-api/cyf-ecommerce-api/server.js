const express = require("express");
const app = express();
const cors = require("cors");
const { Pool } = require("pg");
const pool = require("./db_ecommerce");

// Middleware
app.use(cors());
app.use(express.json());

// ROUTES
// Add a new GET endpoint `/customers` to return all the customers from the database
app.get("/customers", (req, res) => {

    pool.query("SELECT * FROM customers", (db_err, db_res) => {
        if(db_err){
            res.send(JSON.stringify(db_err));
        } else{
            console.log(db_res);
            res.json(db_res.rows);
        }


    });

});

// Add a new GET endpoint `/suppliers` to return all the suppliers from the database
app.get("/suppliers", (req, res) => {
    const { name } = req.query;
    pool.query("SELECT * FROM suppliers", (db_err, db_res) => {
        if (db_err) {
            res.send(JSON.stringify(db_err));
        } else {
            // console.log(db_res);
            res.json(db_res.rows);
        }
    });
});


// Add a GET endpoint `/products` to return all the product names along with their prices and supplier names with search functionality.
app.get("/products", (req, res) => {
    const { name } = req.query;
    let query = "SELECT p.product_name, sup.supplier_name, p_a.unit_price FROM products as p INNER JOIN product_availability as p_a ON p.id = p_a.prod_id INNER JOIN suppliers as sup ON sup.id = p_a.supp_id";

    query = name ? query.concat(` WHERE p.product_name='${name}'`) : query;

    pool.query(query, (db_err, db_res) => {
        if (db_err) {
            res.send(JSON.stringify(db_err));
        } else {
            res.json(db_res.rows);
        }
    });
});

// Add a new GET endpoint /customers/:customerId to load a single customer by ID.
app.get("/customers/:customerId", (req, res) => {
    const { customerId } = req.params;
    pool.query(`SELECT * FROM customers WHERE id=${customerId}`, (db_err, db_res) => {
        if (db_err) {
            res.send(JSON.stringify(db_err));
        } else {
            res.json(db_res.rows);
        }
    });
});

// Add a new POST endpoint /customers to create a new customer with name, address, city and country.
app.post("/customers", (req, res) => {
    const newCustomerName = req.body.name;
    const newCustomerAddress = req.body.address;
    const newCustomerCity = req.body.city;
    const newCustomerCountry = req.body.country;

    pool
        .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
        .then((result) => {
            if (result.rows.length > 0) {
                return res.status(400).send("A customer name with the same name already exists!");
            } else {
                const query = "INSERT INTO customers (name, address, city, country) VALUES($1, $2, $3, $4)";
                pool
                    .query(query, [newCustomerName, newCustomerAddress, newCustomerCity, newCustomerCountry])
                    .then(() => res.send("Customer created"))
                    .catch((error) => console.log(error));
            }
        });
});






















app.listen(3000, () => {
    console.log("Server has started on port 3000");
});