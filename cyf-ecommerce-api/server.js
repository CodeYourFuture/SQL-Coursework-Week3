const express = require("express");
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded( { extended: false }));

const pool = new Pool( {
    user: 'lcd',
    host: 'localhost',
    database: 'cyf_ecommerce',
    password: 'lcd'
});

/*
    Add a new GET endpoint /customers/:customerId to load a single customer by ID.
*/
app.get('/customers/:customerId', (req, res) => {
    const customerId = req.params.customerId;

    if( customerId ){
        pool.query(`select * from customers WHERE id  = ${customerId}`)
        .then( result => res.json(result.rows))
            .catch( e => console.log(e));
    } 
});

/*
    Add a new GET endpoint /customers/:customerId/orders to load all the orders along the items in the orders of a 
    specific customer. Especially, the following information should be returned: order references, order dates, 
    product names, unit prices, suppliers and quantities.
*/

app.get('/customers/:customerId/orders', (req, res) => {
    const customerId = req.params.customerId;
    if(customerId){
        let query = `SELECT order_reference, order_date, product_name, unit_price, supplier_name
                                      FROM customers
                                      INNER JOIN orders ON customers.id = orders.customer_id
                                      INNER JOIN order_items ON orders.id = order_id
                                      INNER JOIN products ON products.id = product_id
                                      INNER JOIN suppliers ON suppliers.id = products.supplier_id
                                      WHERE customers.id = ${customerId}`;
        pool.query(query)
            .then( result => {
                if(result.rowCount){
                    res.json(result.rows);
                }
                else {
                    res.status(404).send(`No orders found for customer id ${customerId}`);
                }
            }).catch(e => console.log(e));
    }
});
/*
SELECT order_reference, order_date, product_name, unit_price, supplier_name FROM customers
INNER JOIN orders ON customers.id = orders.customer_id
INNER JOIN order_items ON orders.id = order_id
INNER JOIN products ON products.id = product_id
INNER JOIN suppliers ON suppliers.id = products.supplier_id
WHERE customers.id = 1;
*/

/*
    Add a new POST endpoint /customers/:customerId/orders to create a new order 
    (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an 
    existing customer or return an error.
*/
app.post('/customers/:customerId/orders', (req, res) => {
    const { orderDate, orderRef } = req.body;
    const customerId = req.params.customerId;
    selectQuery = `SELECT * FROM customers WHERE id = ${customerId}`;
    insertQuery = "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";

    if( customerId && orderDate && orderRef){
        pool.query(selectQuery)
            .then( result => {
                if(result.rowCount){
                    pool.query(insertQuery, [ orderDate, orderRef, customerId ])
                        .then( _ => res.send(`Order ${orderRef} has been added`))
                        .catch( e => console.log(e));
                } else {
                    res.status(404).send(`Customer id ${customerId} does not exist`);
                }
            })
    } else {
        res.sendStatus(400);
    }
});


/*
    Add a new PUT endpoint /customers/:customerId to update an existing customer (name, address, city and country).
*/
app.put('/customers/:customerId', (req, res) => {
    const { name, address, city, country } = req.body;
    const customerId = req.params.customerId;
    let columns = "";    //  e.g. "name = $2", or "name = $2, address = $3"
    let values = [];        // e.g. [ name], or [ name, address ]
    const selectQuery = `SELECT * FROM customers WHERE id = ${customerId}`;
    //  updateQuery = "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id = $5";
    let updateQuery = "UPDATE customers SET ";

    if(customerId){
        pool.query(selectQuery)
            .then(result => {
                if(result.rowCount){
                    if(name){
                        columns = `name = $${values.length + 1}`;
                        values.push(name);
                    }

                    if(address){
                        if(values.length > 0){
                            columns += ", ";
                        }
                        columns += `address = $${values.length + 1}`;
                        values.push(address);
                    }

                    if(city){
                        if(values.length > 0){
                            columns += ", ";
                        }
                        columns += `city = $${values.length + 1}`;
                        values.push(city);
                    }

                    if(country){
                        if(values.length > 0){
                            columns += ", ";
                        }
                        columns += `country = $${values.length + 1}`;
                        values.push(country);
                    }

                    updateQuery += columns;
                    updateQuery += `WHERE id = $${values.length + 1}`;
                    values.push(customerId);
                    console.log(updateQuery)
                    pool.query(updateQuery, values)
                                    .then( _ => res.send(`Customer id ${customerId} has been updated`))
                                    .catch(e => console.log(e));
                } else {
                    res.status(400).send(`Customer id ${customerId} could not be found`);
                }
            })
    } else {
        res.sendStatus(400);
    }

    

     

    
});


app.post('/customers', (req, res) => {
    const { name, address, city, country } = req.body;

    if( name && address && city && country ){
        insertQuery = "INSERT INTO customers (name, address, city, country) VALUES ($1, $2,  $3,  $4)";
        pool.query(insertQuery, [name, address, city, country ])
        .then( _ => res.send(`${name}  has been added`) )
        .catch( e => console.log(e));
    } else {
        res.sendStatus(400);
    }
});

/*
    Add a new DELETE endpoint /customers/:customerId to delete an existing customer only if this customer 
    doesn't have orders.
*/
app.delete('/customers/:customerId', (req, res) => {
    const customerId = req.params.customerId;

     if( customerId ){
         pool.query(`SELECT * FROM orders WHERE customer_id = ${customerId}`)
            .then( result => {
                if(result.rowCount === 0){   // Only DELETE if there are no orders associated with this customerId
                    pool.query(`DELETE FROM customers WHERE id = ${customerId}`)
                        .then( result => {
                            if(result.rowCount){
                                res.send(`Customer ${customerId} has been deleted`);
                            } else {
                                res.status(404).send(`Customer id ${customerId} not found`);
                            }
                        })
                } else {
                    res.sendStatus(403); // No, we are forbidden from DELETing a customer that has outstanding orders
                }
            })
     } else {
         res.sendStatus(400);
     }
});




app.get('/products', (req, res) => { 
    pool.query(`select * from customers`)
        .then( result => res.json(result.rows))
        .catch( e => console.log(e));
});

/*
    Add a new POST endpoint /products to create a new product (with a product name, a price and a supplier id). 
    Check that the price is a positive integer and that the supplier ID exists in the database, otherwise return an error.
*/
app.post('/products', (req, res) => {
    let { name, unitPrice, supplierId } = req.body;
    unitPrice = parseFloat(unitPrice);

    if( name && unitPrice && supplierId && (unitPrice > 0)){
        const selectQuery = `SELECT * FROM products WHERE supplier_id = ${supplierId}`;
        const insertQuery = "INSERT INTO products (product_name, unit_price, supplier_id) VALUES ($1, $2, $3)";

        pool.query(selectQuery)
            .then( result => {
                if( result.rowCount ){
                    pool.query(insertQuery, [ name,  unitPrice, supplierId])
                        .then( _ => res.send(`${name}  has been added`) )
                        .catch( e => console.log(e));
                } else {
                    res.status(404).send(`Supplier id ${supplierId} does not exist in the database`);
                }
            })
        
    } else {
        res.sendStatus(400);
    }
});

app.get('/suppliers', (req, res) => {
    console.log("app.get(/suppliers)")
    pool.query(`select * from suppliers`)
        .then( result => res.json(result.rows))
        .catch( e => console.log(e));
});

/*
    Update the previous GET endpoint /products to filter the list of products by name using a query parameter, 
    for example /products?name=Cup. This endpoint should still work even if you don't use the name query parameter!
*/

app.get('/products', (req, res) => { 
    let query = "SELECT product_name, supplier_name FROM products INNER JOIN suppliers ON products.supplier_id = suppliers.id";
    const productName = req.query.name;

    if( productName ){                  // only filter on the product name if a valid product has been specified
        query += ` WHERE product_name like  '%${productName}%'`;
    }

    console.log("QUERY STRING = ", query);
    pool.query(query)
        .then( result => res.json(result.rows))
        .catch( e => console.log("LCD", e));
});

/*
    Add a new DELETE endpoint /orders/:orderId to delete an existing order along all the associated order items.
*/

app.delete('/orders/:orderId', (req, res) => {
    const orderId = req.params.orderId;

    if(orderId){
        pool.query(`SELECT * FROM orders WHERE orders.id = ${orderId}`)
            .then( result => {
                if(result.rowCount){
                    pool.query(`DELETE FROM order_items WHERE order_id = ${orderId}`)
                        .then( _ => {
                            pool.query(`DELETE FROM orders WHERE id = ${orderId}`)
                                .then( result => {
                                    if(result.rowCount){
                                        res.send(`Order id ${orderId} has been deleted`)
                                    }
                                 })
                        })
                }
            })
        } else {
            res.sendStatus(404);
        }
});


app.listen(PORT, _ => console.log(`server is listening on ${PORT}`));