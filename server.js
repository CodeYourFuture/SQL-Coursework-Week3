const express = require("express");
const app = express();

// const { v4: uuidv4 } = require('uuid');
// var validator = require('validator');



// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// middleware for cors policy
const cors = require("cors");
app.use(cors());


const { Pool } = require('pg');

// for password YUNUS
const dotenv = require('dotenv');
// for password YUNUS
dotenv.config();
console.log(process.env.test)
// for password YUNUS
// CONNECTIONSTRING = 'postgresql://username:password@localhost:5432/cyf_hotels'

const pool = new Pool({

    connectionString: process.env.CONNECTIONSTRING,

});



//This array is our "data store".
//We will start with one message in the array.
//Note: messages will be lost when Glitch restarts our server.
const messages = ["welcomeMessage"];

app.get("/", function (request, response) {
    response.json(messages)
});


// ## Task

//   







// - Create a new NodeJS application called`cyf-ecommerce-api`
// - Add Express and node - postgres and make sure you can start the server with `node server.js`
// - Add a new GET endpoint`/customers` to return all the customers from the database
app.get("/customers", function (req, res) {
    pool.query('SELECT * FROM customers', (error, result) => {
        res.json(result.rows);
    });
});

// - Add a new GET endpoint`/suppliers` to return all the suppliers from the database
app.get("/suppliers", function (req, res) {
    pool.query('SELECT * FROM suppliers', (error, result) => {
        res.json(result.rows)
    })
})


//- (STRETCH GOAL) Add a new GET endpoint`/products` to return all the product names along with their prices and supplier names.
app.get("/products", function (req, res) {
    const productsNameQuery = req.query.name;
    let query = `SELECT products.id, product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON product_availability.prod_id = products.id INNER JOIN suppliers ON suppliers.id = product_availability.supp_id`

    if (productsNameQuery) {
        query = `SELECT products.id, product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON product_availability.prod_id = products.id INNER JOIN suppliers ON suppliers.id = product_availability.supp_id WHERE LOWER(product_name) LIKE LOWER('%${productsNameQuery}%')`;
    }

    pool
        .query(query)
        .then((result) => res.json(result.rows))
        .catch((e) => console.error(e));
});

// - Add a new GET endpoint`/customers/:customerId` to load a single customer by ID.
app.get("/customers/:customerId", function (req, res) {
    const customerId = req.params.customerId;

    pool
        .query("SELECT * FROM customers WHERE id=$1", [customerId])
        .then((result) => res.json(result.rows))
        .catch((e) => console.error(e));
});


// - Add a new POST endpoint`/customers` to create a new customer with name, address, city and country.
app.post("/customers", function (req, res) {
    const newCustomerName = req.body.name;
    const newCustomerAddress = req.body.address;
    const newCustomerCity = req.body.city;
    const newCustomerCountry = req.body.country;

    const query =
        "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";

    pool
        .query(query, [newCustomerName, newCustomerAddress, newCustomerCity, newCustomerCountry ])
        .then(() => res.send("customer created!"))
        .catch((e) => console.error(e));
});

// - Add a new POST endpoint`/products` to create a new product.
app.post("/products", function (req, res) {
    const newProductName = req.body.product_name;
    const query =
        "INSERT INTO products (product_name) VALUES ($1)";

    pool
        .query(query, [newProductName])
        .then(() => res.send("product created!"))
        .catch((e) => console.error(e));
});


//get products
app.get("/products", function (req, res) {
    pool.query('SELECT products.id, product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON product_availability.prod_id = products.id INNER JOIN suppliers ON suppliers.id = product_availability.supp_id', (error, result) => {
        res.json(result.rows)
    })
})

    // - Add a new POST endpoint`/availability` to create a new product availability(with a price and a supplier id).Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.
app.post("/availability", function (req, res) {
    const newSupplierId = req.body.supp_id;
    const newUnitPrice = req.body.unit_price;

    newUnitPrice > 0 && 


    const query =
        "INSERT INTO product_availability (supp_id, unit_price) VALUES ($1, $2)";

    pool
        .query(query, [newSupplierId, newUnitPrice])
        .then(() => res.send("availability created!"))
        .catch((e) => console.error(e));
});




app.listen(5000, function () {
    console.log("Server is listening on port 5000. Ready to accept requests!");
});
