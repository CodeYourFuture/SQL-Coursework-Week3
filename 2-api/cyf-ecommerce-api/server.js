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


// Add a new POST endpoint /products to create a new product.
app.post("/products", (req, res) => {
    const newProductName = req.body.product_name;

    pool
        .query("SELECT * FROM products WHERE product_name=$1", [newProductName])
        .then((result) => {
            if (result.rows.length > 1) {
                return res.status(400).send("A product name with the same name already exists!");
            } else {
                const query = "INSERT INTO products (product_name) VALUES ($1)";
                pool
                    .query(query, [newProductName])
                    .then(() => res.send("New product created"))
                    .catch((error) => console.log(error));
            }
        });
});


// Add a new POST endpoint /availability to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.
app.post("/availability", (req, res) => {
    const newProductId = req.body.prod_id;
    const newProductPrice = req.body.unit_price;
    const newSupplierId = req.body.supp_id;

    if (!Number.isInteger(newProductPrice) || newProductPrice <= 0) {
        return res.status(400).send("Unit price should be positive integer");
    }

    if (!newProductId || !newSupplierId) {
        return res.status(400).send("Product Id or Supplier Id missing");
    }

    pool
        .query("SELECT * FROM product_availability WHERE prod_id = $1", [newProductId])
        .then((result) => {
            if (result.rows.length === 0) {
                return res.status(400).json("The product does not exist!");
            } else if (result.rows.length > 0) {
                pool
                    .query("SELECT * FROM product_availability WHERE supp_id = $1", [newSupplierId])
                    .then((result) => {
                        if (result.rows.length === 0) {
                            return res.status(400).send("The supplier ID does not exist!");
                        } else {
                            const query = "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
                            pool
                                .query(query, [newProductId, newSupplierId, newProductPrice])
                                .then(() => res.send("New availability created"))
                                .catch((e) => console.error(e));
                        }
                    })
                    .catch((error) => console.log(error));
            }
        })
        .catch((error) => console.log(error));
});


// Add a new POST endpoint /customers/:customerId/orders to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.
app.post("/customers/:customerId/orders", (req, res) => {
    const customerId = req.params.customerId;
    const orderDate = req.body.order_date;
    const orderReference = req.body.order_reference;

    pool
        .query("SELECT * FROM customers WHERE id=$1", [customerId])
        .then((result) => {
            if (result.rows.length > 0) {
                const query = "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
                pool
                    .query(query, [orderDate, orderReference, customerId])
                    .then(() => res.send("New order created"))
                    .catch((error) => console.log(error));
            } else {
                return res.status(400).send("Customer Id doesn't exist");
            }
        })
        .catch((error) => console.log(error));
});



//Add a new PUT endpoint /customers/:customerId to update an existing customer (name, address, city and country).
app.put("/customers/:customerId", (req, res) => {
    const customerId = req.params.customerId;
    const newCustomerName = req.body.name;
    const newCustomerAddress = req.body.address;
    const newCustomerCity = req.body.city;
    const newCustomerCountry = req.body.country;


    pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
        if (result.rows.length > 0) {
            const query = "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5";
            pool
                .query(query, [newCustomerName, newCustomerAddress, newCustomerCity, newCustomerCountry, customerId])
                .then(() => {
                    res.send(`Customer ${customerId} updated!`);
                })
                .catch((error) => console.log(error));
        } else {
            return res.status(400).send("Customer Id doesn't exist");
        }
    });
});
        
    













app.listen(3000, () => {
    console.log("Server I running on port 3000");
});