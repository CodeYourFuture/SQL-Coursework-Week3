const express = require("express");
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded( { extended: false }));

const pool = new Pool( {
    user: 'lcd',
    host: 'localhost',
    database: 'cyf_ecommerce',
    password: 'lcd'
});

app.get('/customers', (req, res) => {
    console.log("app.get(/customers)")
    pool.query(`select * from customers`)
        .then( result => res.json(result.rows))
        .catch( e => console.log(e));
});

app.get('/suppliers', (req, res) => {
    console.log("app.get(/suppliers)")
    pool.query(`select * from suppliers`)
        .then( result => res.json(result.rows))
        .catch( e => console.log(e));
});

app.get('/products', (req, res) => {
    console.log("getRouter.get(/hotels)")
    pool.query(`SELECT product_name, supplier_name FROM products INNER JOIN suppliers ON products.supplier_id = suppliers.id`)
        .then( result => res.json(result.rows))
        .catch( e => console.log(e));
});


app.listen(PORT, _ => console.log(`server is listening on ${PORT}`));