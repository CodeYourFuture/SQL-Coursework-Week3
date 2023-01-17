require("dotenv").config();
const { Pool } = require("pg");
const express = require("express");
const { query } = require("express");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(require("cors")());

const pool = new Pool({
    host: process.env.HOST,
    user: process.env.USER_DB,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT_DB,
    // ssl: {
    //     rejectUnauthorized: false
    // }
});

app.get("/", (req, res) => {
    res.json({
        "List of endpoints": ["/customers", "/customers/:customerId", "/suppliers", "/products"]
    })
})

app.get("/customers", (req, res) => {
    pool.query("SELECT * FROM customers")
        .then(result => res.json(result.rows))
        .catch(err => {
            console.error(err);
            res.status(500).json(err);
        })
})

app.get("/customers/:customerId", (req, res) => {
    const customerId = req.params.customerId;

    pool.query("SELECT * FROM customers WHERE id = $1", [customerId])
        .then(result => res.json(result.rows))
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        })
})

app.get("/suppliers", (req, res) => {
    pool.query("SELECT * FROM suppliers")
        .then(result => res.json(result.rows))
        .catch(err => {
            console.error(err);
            res.status(500).json(err);
        })
})

app.get("/products", (req, res) => {
    const searchName = req.query.product_name;
    let query = `
    SELECT p.product_name, pa.unit_price, s.supplier_name FROM product_availability pa
    INNER JOIN products p ON p.id = pa.prod_id
    INNER JOIN suppliers s ON s.id = pa.supp_id`;

    let params = [];
    if(searchName) {
        query += "WHERE p.product_name LIKE $1";
        params.push(`%${searchName}%`);
    }

    pool.query(query, params)
        .then(result => res.json(result.rows))
        .catch(err => {
            console.error(err);
            res.status(500).json(err);
        })
})

app.listen(port, (req, res) => console.log(`http://localhost:${port}`));