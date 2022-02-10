const express = require("express");
const { Pool } = require("pg");
require('dotenv').config();

const app = express();
app.use(express.json());

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

app.get("/customers/:customerId/orders", (req, res) => {
    const { customerId } = req.params;
    const query = `SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity FROM order_items
                INNER JOIN orders ON order_items.order_id = orders.id
                INNER JOIN product_availability ON product_availability.supp_id = order_items.supplier_id
                INNER JOIN products ON order_items.product_id = products.id
                INNER JOIN suppliers ON order_items.supplier_id = suppliers.id
                WHERE orders.customer_id = $1`
    pool.query(query, [customerId])
        .then((result) => res.send(result.rows))
        .catch(error => {
            console.log(error);
            res.status(500).send(error);
        })
})


// create a new customer with name, address, city and country.
app.post("/customers", (req, res) => {
    const { name, address, city, country } = req.body;

    pool.query("SELECT * FROM customers WHERE name=$1", [name])
        .then(result => {
            if (result.rows.length > 0) {
                return res.status(400).send("customer already exist!")
            } else {
                const query = `INSERT INTO customers(name,address,city,country) VALUES ($1,$2,$3,$4)`

                pool.query(query, [name, address, city, country])
                    .then(() => {
                        res.send("added")
                    })
                    .catch(error => {
                        console.log("error occured", error)
                        res.status(500).json(error)
                    })
            }
        })

})

// create a new product.
app.post("/products", (req, res) => {
    const { product_name } = req.body;

    const query = `INSERT INTO products(product_name) VALUES ($1)`

    pool.query(query, [product_name])
        .then(() => {
            res.send(" product has been added")
        })
        .catch(error => {
            console.log("error occured", error)
            res.status(500).json(error)
        })

})



app.post("/availability", (req, res) => {
    const { price, supplier_id, prod_id } = req.body;
    if (Number(price) < 0) {

        return res.status(400).send("please provide a positive number for price!")
    }
    const query = `SELECT * FROM suppliers WHERE id = $1`
    const pQuery = `SELECT * FROM products WHERE id = $1`
    pool.query(query, [Number(supplier_id)])
        .then(result => {
            if (result.rows.length) {
                pool.query(pQuery, [prod_id])
                    .then(result => {
                        if (result.rows.length) {
                            pool.query("INSERT INTO product_availability(unit_price,supp_id, prod_id) VALUES($1,$2,$3)", [price, supplier_id, prod_id])
                                .then(() => res.send("added"))
                                .catch(error => {
                                    return res.status(500).send({ msg: "failed", err: error.detail })
                                })
                        }
                        return res.status(401).send({ err: "this product does not exist" })
                    })
            } else {
                res.status(401).send({ err: "this supplier does not exist" })

            }
        })

})

// create new order
app.post("/customers/:customerId/orders", (req, res) => {

    const { customerId } = req.params;
    const { order_date, order_reference } = req.body;
    let query = `SELECT * FROM customers WHERE id = $1`

    pool.query(query, [customerId])
        .then(result => {
            if (result.rows.length) {
                pool.query(`INSERT INTO orders(order_date,order_reference,customer_Id) VALUES ($1, $2, $3)`,
                    [order_date, order_reference, customerId])
                    .then(() => res.send("order added"))
                    .catch(error => {
                        return res.status(500).send({ msg: "failed", err: error.detail })
                    })
            } else {
                return res.status(400).send({ error: "id doesnt exists" })
            }
        })

})

// update an existing customer (name, address, city and country)
app.put("/customers/:customerId", (req, res) => {
    const { customerId } = req.params;
    const { name, address, city, country } = req.body;

    pool.query(`SELECT * FROM customers WHERE id = $1`, [customerId])
        .then(result => {
            if (result.rows.length) {
                console.log(result.rows)
                pool.query(`UPDATE customers SET name= $1, address=$2, city=$3, country=$4 WHERE id= $5`, [name, address, city, country, customerId])
                    .then(() => res.send(`Customer ${customerId} updated!`))
                // .catch(error => {
                //     // console.log(error);
                //     return res.status(500).json(error);
                // })
            }
            else {
                return res.status(400).send({ error: "id doesnt exists" })
            }
        })
})

// delete an existing order along with all the associated order items
app.delete("/orders/:orderId", (req, res) => {
    const { orderId } = req.params;

    pool.query(`SELECT * FROM orders WHERE id=$1`, [orderId])
        .then(result => {
            if (result.rows.length) {
                pool.query(`DELETE FROM orders WHERE id=$1`, [orderId])
                    .then(() => res.send(`Customer ${orderId} deleted!`))
                    .catch((error) => {
                        console.log("error occurred");
                        res.status(500).send(error);
                    })
            }
            else {
                res.send({ error: "id doesnt exist! provide a proper one." })
            }
        })

})
// chejoori check konam aslan id tooye range hast ya na
// delete an existing customer only if this customer doesn't have orders
app.delete("/customers/:customerId", (req, res) => {

    const { customerId } = req.params;
    const query = `SELECT * FROM orders WHERE customer_id = $1 `

    pool.query(query, [customerId])
        .then(result => {
            if (!result.rows.length) {
                pool.query(`DELETE FROM customers WHERE id = $1`, [customerId])
                    .then(() => {
                        res.send(`Customer ${customerId} has successfully deleted`)
                    })
                    .catch(error => {
                        console.log(error);
                        res.statusMessage(500).send(error)
                    })
            } else {
                res.send({ error: "this customer has some orders." })
            }
        })
})



app.listen(process.env.PORT, () => {
    console.log("server is running on 5000")
})