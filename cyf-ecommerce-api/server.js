const express  = require('express');
const dotenv = require("dotenv");
dotenv.config();


const app = express();

app.use(express.json());
const { Pool } = require("pg");
const PORT  = process.env.PORT || 3000;
app.listen(PORT, () =>{
    console.log(`Server runing on ${PORT}`);
});






const pool = new Pool ({
    connectionString: process.env.PG_CONNECT,
});

///Add a new GET endpoint `/customers`

app.get("/customers", function(req, res){
    pool
.query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
        console.error("Error retrieving customers:", error);
        res.status(500).json({error:"Error retrieving customers:"});
    });
});


///Add a new GET endpoint `/suppliers


app.get("/suppliers", function(req, res){
    pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
        console.error("Error retrieving suppliers:", error);
        res.status(500).json({error:"Error retrieving suppliers:"});
    });
});

//Add a new GET endpoint `/products 


app.get("/products", function(req, res){
    pool 
    .query(
        `SELECT products.product_name AS product, product_availability.unit_price AS price, suppliers_name AS supplier
        FROM product_acvailability
        JOIN products
        ON products.id = product_availability.prod_id
        JOIN suppliers
        ON suppliers.id  = product_availability.supp_id`
        

    )
    .then((result) => res.json(result.rows))
    .catch((error) => {
        console.error("Error retrieving products:", error);
        res.status(500).json({error:"Error retrieving products:"});
    });

});







