const express = require("express");
const app = express();
const { Pool } = require("pg");

app.use(express.json());

const db = new Pool({
    user: "ekremteke",
    host: "localhost",
    database: "cyf_ecommerce",
    password: "185606",
    port: 5432,
});

app.get("/products", (req, res) => {
    const searchKey = req.query.name;
    let query = "select * from products";

    let params = [];
    if (searchKey) {
        query =
            "select p.product_name, p_a.unit_price,s.supplier_name from products p JOIN product_availability p_a ON (p.id = p_a.prod_id) join suppliers s ON (s.id = p_a.supp_id) WHERE p.product_name LIKE $1";
        params.push(`%${searchKey}%`);
    }

    db.query(query, params)
        .then((result) => res.json(result.rows))
        .catch((err) => {
            res.status(500).json(err);
        });
});

app.get("/customers", (req, res) => {
    db.query("SELECT * FROM customers", (err, result) => {
        res.json(result.rows);
    });
});

app.get("/customers/:id", (req, res) => {
    const searchKey = +req.params.id;
    db.query(
        "SELECT * FROM customers WHERE id = $1",
        [searchKey],
        (err, result) => {
            res.json(result.rows);
        }
    );
});

app.get("/availability", (req, res) => {
    db.query("SELECT * FROM product_availability", (err, result) => {
        res.json(result.rows);
    });
});

app.get("/customers/:customerId/orders", async function (req, res) {
    const custId = +req.params.customerId;

    const query1 =
        "SELECT * FROM customers c where exists (select 1 from orders o where o.customer_id = $1)";
    const query2 =
        "select o.order_reference, o.order_date,  p.product_name, pa.unit_price, s.supplier_name, oi.quantity from  orders o join order_items oi on (o.id = oi.order_id) join product_availability pa on (oi.product_id = pa.prod_id) join products p on (pa.prod_id = p.id) join suppliers s on (s.id = pa.supp_id) where o.customer_id = $1";

    let result = await db.query(query1, [custId]);

    if (result.rowCount > 0) {
        db.query(query2, [custId], function (err, result) {
            return res.status(200).send(result.rows);
        });
    } else {
        return res.status(400).send("Error: this customer does not have orders.");
    }
});

app.post("/customers", function (req, res) {
    let { name, address, city, country } = req.body;
    if (name && address && city && country) {
        db.query(
            "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, address, city, country],
            (error, results) => {
                if (error) {
                    throw error;
                }
                res.status(201).send(`Customer added with ID: ${results.rows[0].id}`);
            }
        );
    }
});

app.post("/products", (req, res) => {
    let { product_name } = req.body;
    if (product_name) {
        db.query(
            "INSERT INTO products (product_name) VALUES ($1) RETURNING *",
            [product_name],
            (err, results) => {
                if (err) {
                    throw err;
                } else {
                    res.status(201).send(`Product added with ID: ${results.rows[0].id}`);
                }
            }
        );
    }
});

app.post("/availability", (req, res) => {
    let { prod_id, supp_id, unit_price } = req.body;
    let isValidInput =
        prod_id &&
        supp_id &&
        unit_price &&
        unit_price > 0 &&
        Number.isInteger(unit_price);
    let query =
        "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3) RETURNING *";
    if (!isValidInput) {
        return res
            .status(400)
            .send(
                "Please enter product id, supplier id an unit price. Unit price must be a positive integer."
            );
    }

    let subQuery1 = "SELECT 1 FROM product_availability WHERE prod_id = $1";
    let subQuery2 = "SELECT 1 FROM product_availability WHERE supp_id= $1";

    db.query(subQuery1, [prod_id], (err, result) => {
        if (result.rowCount === 0) {
            return res
                .status(400)
                .send("Error: the product Id does not exist in the database.");
        } else {
            db.query(subQuery2, [supp_id], (err, result) => {
                if (result.rowCount <= 0) {
                    return res
                        .status(400)
                        .send("Error: the supplier Id does not exist in the database.");
                }
            });
        }
    });
    db.query(query, [prod_id, supp_id, unit_price], (err, result) => {
        res.status(201).send("Product succesfully created.");
    });
});

app.post("/customers/:customerId/orders", async function (req, res) {
    const orderDate = req.body.orderDate;
    const orderRef = req.body.orderRef;
    const custId = +req.params.customerId;

    let result = await db.query("SELECT 1 from customers WHERE id = " + custId);

    if (result.rowCount === 0) {
        return res.send(
            "Error: customerId not corresponds to an existing customer."
        );
    } else {
        const query =
            "INSERT INTO orders (order_date, order_reference, customer_id) " +
            "VALUES ($1, $2, $3)" +
            "RETURNING id";

        db.query(query, [orderDate, orderRef, custId], (err, result) => {
            if (err === undefined) {
                res.status(201).send(`Order ${orderRef} created.`);
            } else {
                res.send(`${err}`);
            }
        });
    }
});


app.put("/customers/:customerId", function (req, res) {
    const customerId = req.params.customerId;
    let { name, address, city, country } = req.body;

    db.query(
        "UPDATE customers SET name = $2, address = $3, city = $4, country = $5 WHERE id = $1",
        [customerId, name, address, city, country]
    )
        .then(() => res.send(`Customer with Customer Id ${customerId} updated! New data : ${JSON.stringify(req.body)}`))
        .catch((err) => {
            res.status(400).json({ error: err });
        });
});


app.delete("/orders/:orderId", function (req, res) {
    const orderId = req.params.orderId;

    db.query("DELETE FROM order_items WHERE order_id=$1", [orderId])
        .then(() => {
            db.query("DELETE FROM orders WHERE id=$1", [orderId])
                .then(() => res.send(`Order ${orderId} deleted!`))
        })
        .catch((err) => res.send(`${err}`));
});

app.delete("/customers/:customerId", async (req, res) => {
    const customerId = +req.params.customerId;

    const query =
        "SELECT * FROM customers c WHERE exists (SELECT 1 FROM orders o WHERE o.customer_id = $1)";
    let result = await db.query(query, [customerId]);

    if (result.rowCount > 0) {
        return res.status(400).send("Error: this customer has orders.");
    } else {
        db.query("DELETE FROM customers WHERE id = $1", [customerId])
            .then(() => res.send(`Customer with customer id ${customerId} deleted!`))
            .catch((err) => res.send(`${err}`));
    }
});

app.listen(3000, function () {
    console.log("Server is listening on port 3000. Ready to accept requests!");
});

