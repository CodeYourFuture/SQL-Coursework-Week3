const express = require("express");
const app = express();
const cors = require("cors");
const { Pool } = require("pg");
const pool = require("./cyf_ecommerce.sql");

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
















app.listen(3000, () => {
    console.log("Server has started on port 3000");
});