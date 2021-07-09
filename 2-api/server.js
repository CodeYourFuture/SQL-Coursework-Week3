const express = require("express");
const app = express();
app.use(express.json());

const { Pool } = require("pg");

const pool = new Pool({
    user: "coder",
    host: "localhost",
    database: "cyf_ecommerce",
    password: "codeyourfuture",
    port: 5432
});


app.get("/customers", (req, res) => {
    pool.query("SELECT * FROM customers", (error, result) => {
        res.json(result.rows);
    });
});


app.get("/suppliers", (req, res) => {
    pool.query("SELECT * FROM suppliers", (error, result) => {
        res.json(result.rows);
    });
});


app.get("/products", (req, res) => {
    const name = req.query.name;

    if (name) {
        const query = `SELECT p.product_name, pa.unit_price, s.supplier_name FROM products p INNER JOIN product_availability pa ON p.id = pa.prod_id INNER JOIN suppliers s ON s.id = pa.supp_id WHERE product_name ILIKE '%${name}%'`;

        pool.query(query, (error, result) => {
            res.json(result.rows)
        });
    } else {
        const query = `SELECT p.product_name, pa.unit_price, s.supplier_name FROM products p INNER JOIN product_availability pa ON p.id = pa.prod_id INNER JOIN suppliers s ON s.id = pa.supp_id`;

        pool.query(query, (error, result) => {
            res.json(result.rows)
        });
    }
});


app.get("/customers/:customerId", (req, res) => {
    const customerId = req.params.customerId;

    pool
        .query("SELECT * FROM customers WHERE id=$1", [customerId])
        .then((result) => {
            if (result.rowCount) {
                res.json(result.rows);
            } else {
                res.status(400).send(`No customer with id ${customerId}`)
            }
        })
        .catch((e) => console.log(e));
})

app.post("/customers", (req, res) => {
    const customerName = req.body.name;
    const customerAddress = req.body.address;
    const customerCity = req.body.city;
    const customerCountry = req.body.country;

    //Validate all fields are filled in
    if (!customerName || !customerAddress || !customerCity || !customerCountry) {
        return res.status(400).send("Please fill in all fields")
    }

    //Validate customer does not exist
    const query = "SELECT * FROM customers WHERE name=$1 AND address=$2";

    pool
        .query(query, [customerName, customerAddress])
        .then(result => {
            if (result.rowCount) {
                res.status(400).send("Customer already exist");
            } else {
                const query = "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
                pool
                    .query(query, [customerName, customerAddress, customerCity, customerCountry])
                    .then(() => res.send("New customer created!"))
                    .catch((e) => console.error(e));
            }
        });
});


app.post("/products", (req, res) => {
    const productName = req.body.productName;

    //Validate all fields are filled in
    if (!productName) {
        return res.status(400).send("Please fill in all fields")
    }

    //Validate product does not exist
    const query = "SELECT * FROM products WHERE product_name=$1";

    pool
        .query(query, [productName])
        .then(result => {
            if (result.rowCount) {
                res.status(400).send("Product already exist");
            } else {
                const query = "INSERT INTO products (product_name) VALUES ($1)";
                pool
                    .query(query, [productName])
                    .then(() => res.send("New product created!"))
                    .catch((e) => console.error(e));
            }
        })
});


app.post("/availability", (req, res) => {
    const productId = req.body.productId;
    const supplierId = req.body.supplierId;
    const productPrice = req.body.productPrice;

    //Validate all fields are filled in
    if (!productId || !supplierId || !productPrice) {
        return res.status(400).send("Please fill in all fields")
    }

    //Validate price
    if (!Number.isInteger(productPrice) || productPrice <= 0) {
        return res.status(400).send("The price should be a positive integer.");
    }

    //Validate that product does not exist
    const query = "SELECT * FROM products WHERE id=$1";

    pool
        .query(query, [productId])
        .then(result => {
            if (result.rowCount === 0) {
                res.status(400).send("Product does not exist");
            } else {
                const query = "SELECT * FROM suppliers WHERE id=$1";

                pool
                    .query(query, [supplierId])
                    .then(result => {
                        if (result.rowCount === 0) {
                            res.status(400).send("Supplier does not exist");
                        } else {
                            const query = "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";

                            pool
                                .query(query, [productId, supplierId, productPrice])
                                .then(() => res.send("Product is now available"))
                                .catch((e) => console.error(e));
                        }
                    })
                    .catch((e) => console.error(e));

            }
        })
        .catch((e) => console.error(e));
});


app.post("/customers/:customerId/orders", (req, res) => {
    const customerId = req.params.customerId;
    const orderDate = req.body.orderDate;
    const orderReference = req.body.orderReference;

    //Validate all fields are filled in
    if (!orderDate || !orderReference) {
        return res.status(400).send("Please fill in all fields")
    }

    //Validate customer exist
    const query = "SELECT * FROM orders WHERE id=$1";

    pool
        .query(query, [customerId])
        .then(result => {
            if (result.rowCount === 0) {
                res.status(400).send("Customer does not exist");
            } else {
                const query = "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
                pool
                    .query(query, [orderDate, orderReference, customerId])
                    .then(() => res.send("New order created!"))
                    .catch((e) => console.error(e));
            }
        })

});


app.put("/customers/:customerId", (req, res) => {
    const customerId = req.params.customerId;

    const query = "SELECT * FROM customers WHERE id=$1";
    pool
        .query(query, [customerId])
        .then((result) => {
            if (result.rowCount === 0) {
                res.status(400).send("Customer does not exist");
            } else {
                const newName = req.body.name;
                const newAddress = req.body.address;
                const newCity = req.body.city;
                const newCountry = req.body.country;

                let currentName = result.rows[0].name;
                let currentAddress = result.rows[0].address;
                let currentCity = result.rows[0].city;
                let currentCountry = result.rows[0].country;

                const query =
                    "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5";
                pool
                    .query(query, [newName || currentName, newAddress || currentAddress, newCity || currentCity, newCountry || currentCountry, customerId])
                    .then(() => res.send("Customer details updated!"))
                    .catch((e) => console.error(e));
            }
        })
        .catch((e) => console.error(e));
})


app.delete("/orders/:orderId", (req, res) => {
    const orderId = req.params.orderId;

    const query = "SELECT * FROM orders WHERE id=$1";
    pool
        .query(query, [orderId])
        .then((result) => {
            if (result.rowCount === 0) {
                res.status(400).send("Order does not exist");
            } else {
                const query =
                    "DELETE FROM order_items WHERE order_items.order_id=$1";
                pool
                    .query(query, [orderId])
                    .then(() => {
                        const query =
                            "DELETE FROM orders WHERE orders.id=$1";
                        pool
                            .query(query, [orderId])
                            .then(() => res.send("Order is deleted"))
                            .catch((e) => console.error(e))
                    })
                    .catch((e) => console.error(e));
            }
        })
        .catch((e) => console.error(e));
})

app.delete("/customers/:customerId", (req, res) => {
    const customerId = req.params.customerId;

    const query = "SELECT * FROM orders WHERE customer_id=$1";
    pool
        .query(query, [customerId])
        .then((result) => {
            if (result.rowCount) {
                res.status(400).send("Customer have orders");
            } else {
                const query =
                    "DELETE FROM customers WHERE id=$1";
                pool
                    .query(query, [customerId])
                    .then(() => res.send("Customer is deleted"))
                    .catch((e) => console.error(e));
            }
        })
        .catch((e) => console.error(e));
})


app.get("/customers/:customerId/orders", (req, res) => {
    const customerId = req.params.customerId;

    pool
        .query("SELECT * FROM customers WHERE id=$1", [customerId])
        .then((result) => {
            if (result.rowCount === 0) {
                res.status(400).send(`No customer with id ${customerId}`);
            } else {
                const query =
                    `SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity FROM orders INNER JOIN order_items ON order_items.order_id = orders.id INNER JOIN product_availability ON product_availability.prod_id = order_items.product_id AND product_availability.supp_id = order_items.supplier_id INNER JOIN suppliers ON suppliers.id = product_availability.supp_id INNER JOIN products ON products.id = product_availability.prod_id WHERE orders.customer_id = $1;`;
                pool
                    .query(query, [customerId])
                    .then((result) => res.json(result.rows))
                    .catch((e) => console.error(e))
            }
        })
        .catch((e) => console.error(e));
})


const port = process.env.PORT || 5000
app.listen(port, function () {
    console.log(`Your app is listening on port ${port}`)
});