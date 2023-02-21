const express = require("express");
const app = express();

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