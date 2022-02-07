const express = require("express");
const { Pool } = require("pg");
require('dotenv').config();

const app = express();

const pool = new Pool({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: 'cyf_ecommerce',
    password: process.env.DB_PASSWORD,
    port: 5432
})

// load all the product names along with their prices and supplier names.
// if there is a name as query params then filter the result.
app.get("/products", (req, res) => {
    const name = req.query.name
    const selectParams = []
    let query = `SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM product_availability 
        INNER JOIN products ON product_availability.prod_id = products.id
        INNER JOIN suppliers ON product_availability.supp_id = suppliers.id`

    if (name) {
        query += ` WHERE product_name ILIKE $1`
        selectParams.push(`%${name}%`)
    }
    console.log(query)
    pool.query(query, selectParams)
        .then(result => {
            console.log(result.rows);
            res.json(result.rows)
        })
        .catch(error => {
            console.log("error occured", error
            )
            res.status(500).json(error)
        })
})

// add a customer ID
app.get("/customers/:customerId", (req, res) => {
    const id = req.params.customerId
    const query = `SELECT * FROM customers WHERE id = $1`


    pool.query(query, [id])
        .then(result => {
            res.json(result.rows)
        })
        .catch(error => {
            console.log("error occured", error
            )
            res.status(500).json(error)
        })
})



app.listen(process.env.PORT, () => {
    console.log("server is running on 5000")
})