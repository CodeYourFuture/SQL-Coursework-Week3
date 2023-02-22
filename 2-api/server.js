const express = require("express");
const app = express();
const cors = require("cors");
const { Pool } = require("pg");

app.use(cors({ origin: "*" }));
app.use(express.json());

const pool = new pool({
    user: "postgres",
    host: "localhost",
    database: "cyf_ecommerce",
    password: 1234,
})

app.get("/customers", (req, res) => {
    pool
        .query("SELECT * FROM customers")
        .then((result) => res.json(result.rows))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});
app.get("/products", (req, res) => {
    let name = req.query.name;

    if (name) {
        let query = `SELECT * FROM products INNER JOIN product_availability on products.id=product_availability.prod_id INNER JOIN suppliers ON suppliers.id=product_availability.supp_id WHERE product_name LIKE '%${name}%'`;
        pool
            .query(query)
            .then((result) => res.json(result.rows))
            .catch((error) => {
                console.error(error);
                res.status(500).json(error);
            });
    } else {
        pool
            .query(
                "SELECT * FROM products INNER JOIN product_availability on products.id=product_availability.prod_id INNER JOIN suppliers ON suppliers.id=product_availability.supp_id"
            )
            .then((result) => res.json(result.rows))
            .catch((error) => {
                console.error(error);
                res.status(500).json(error);
            });
    }
});
app.get("/customers/:customerId", function (req, res) {
    let id = parseInt(req.params.customerId);
    pool
        .query("SELECT * FROM customers WHERE id = $1", [id])
        .then((result) => res.status(200).json(result.rows))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});

// Add a new customer
app.post("/customers", (req, res) => {
    let name = req.body.name;
    let address = req.body.address;
    let city = req.body.city;
    let country = req.body.country;

    // validation
    if (!name && !address) {
        return res.status(400).json("Please include a name and address");
    }
    const query =
        "INSERT INTO customers (name, address, city,country) VALUES ($1, $2, $3, $4)";
    pool
        .query(query, [name, address, city, country])
        .then(() => res.status(200).json("customer created!"))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});
// Add a new product
app.post("/products", (req, res) => {
    let product_name = req.body.name;
    const query = "INSERT INTO products (product_name) VALUES ($1)";
    pool
        .query(query, [product_name])
        .then(() => res.status(200).json("product created!"))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});
app.post("/customers/:customerId/orders", (req, res) => {
    const customerId = req.params.customerId;
    const orderDate = req.body.order_date;
    const orderRef = req.body.order_reference;
    db.query("SELECT * FROM customers WHERE id = $1", [customerId]).then(
        (result) => {
            if (result.rows.length === 0) {
                return res.status(400).send("An customer does not exist!");
            } else {
                const query =
                    "INSERT INTO orders (order_date,order_reference,customer_id) VALUES ($1, $2, $3)";
                db.query(query, [orderDate, orderRef, customerId])
                    .then(() => res.send("orders added successfully!"))
                    .catch((error) => {
                        console.error(error);
                        res.status(500).json(error);
                    });
            }
        }
    );
});
app.post("/availability", (req, res) => {
    const productID = req.body.prod_id;
    const supplierID = req.body.supp_id;
    const newPrice = req.body.unit_price;
    if (!Number.isInteger(newPrice) || newPrice <= 0) {
        return res.status(400).send("The price should be a positive integer.");
    }
    db.query("SELECT * FROM products WHERE id=$1", [productID]).then((result) => {
        if (result.rows.length === 0) {
            return res.status(400).send("An product id does not exist!");
        }
        db.query("SELECT * FROM suppliers WHERE id=$1", [supplierID]).then(
            (result) => {
                if (result.rows.length === 0) {
                    return res.status(400).send("An supplier id does not exist!");
                }
                db.query(
                    "SELECT * FROM product_availability WHERE prod_id=$1 AND supp_id=$2",
                    [productID, supplierID]
                ).then((result) => {
                    if (result.rows.length > 0) {
                        return res.status(400).send("This availability already exists.");
                    }
                    const query =
                        "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
                    db.query(query, [productID, supplierID, newPrice])
                        .then(() => res.send("Availability created!"))
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send(error);
                        });
                });
            }
        );
    });
});

app.get("/customers/:customerId/orders", (req, res) => {
    const customerId = req.params.customerId;

    const query = `SELECT o.order_reference, o.order_date, p.product_name, pa.unit_price, s.supplier_name, i.quantity
               FROM orders o
               INNER JOIN order_items i
               ON o.id = i.order_id
               INNER JOIN products p
               ON i.product_id = p.id
               INNER JOIN suppliers s
               ON i.supplier_id = s.id
               INNER JOIN product_availability pa
               ON i.product_id = pa.prod_id AND i.supplier_id = pa.supp_id
               WHERE o.customer_id = $1`;

    db.query(query, [customerId])
        .then((result) => res.json(result.rows))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});
app.delete("/orders/:orderId", function (req, res) {
    const orderId = req.params.orderId;

    db.query("DELETE FROM orders WHERE id=$1", [orderId])
        .then(() => res.send(`order ${orderId} deleted!`))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});

//Delete customer
app.delete("/customers/:customersId", function (req, res) {
    let id = parseInt(req.params.customersId); // int = integer
    pool
        .query("DELETE FROM customers WHERE id=$1", [id])
        .then(() => res.status(200).json(`customer ${id} deleted!`))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});

app.listen(3000, function () {
    console.log("Server is listening on port 3000. Ready to accept requests!");
});