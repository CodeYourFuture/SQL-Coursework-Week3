const express = require("express");
const cors = require('cors')
const app = express();
const port = process.env.PORT || 3000;
const mysql = require('mysql');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.listen(port, () => console.log(`Listening on port ${port}`));

const connection = mysql.createConnection(
    {
        host: 'localhost',
        database: 'cyf_ecommerce',
        user: 'root',
        password: '',
        port: 3306
    });

app.get("/customers", (req, res) =>
{
    connection.query('SELECT * FROM customers', (err, rows) =>
    {
        res.send(Object.values(rows));
    })
});

app.post("/customers", (req, res) =>
{
    connection.connect(function (err)
    {
        const sql = `INSERT INTO customers (name, address, city, country)
                    VALUES
                    (
                        ?, ?, ?, ?
                    )`;
        connection.query(sql, [req.body.name, req.body.address, req.body.city, req.body.country], (err, rows) =>
        {
            res.send(Object.values(rows));
        });
    });
});


app.get("/customers/:customerId", (req, res) =>
{
    const sql = `SELECT * FROM customers WHERE id = ?`;
    connection.query(sql, [req.params.customerId], (err, rows) =>
    {
        res.send(Object.values(rows));
    })
});

app.put("/customers/:customerId", (req, res) =>
{
    const name = req.body.name;
    const address = req.body.address;
    const city = req.body.city;
    const country = req.body.country;


    const sql = `
    UPDATE customers
    SET name = ?, address = ?, city = ?, country = ?
    WHERE CustomerID = ?
    `;
    connection.query(sql, [name, address, city, country, req.params.customerId], (err, rows) =>
    {
        res.send(Object.values(rows));
    })
});


app.delete("/customers/:customerId", (req, res) =>
{
    const id = req.query.customerId;

    connection.query('DELETE FROM customers WHERE id = ?', [id], (err, rows) =>
    {
        res.send(Object.values(rows));
    })
});


app.get("/customers/:customerId/orders", (req, res) =>
{
    const sql = `SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity
    FROM customers
    INNER JOIN orders ON orders.customer_id = customers.id
    INNER JOIN order_items ON order_items.order_id = orders.id
    INNER JOIN product_availability ON product_availability.prod_id = order_items.product_id
    INNER JOIN products ON products.id = order_items.product_id
    INNER JOIN suppliers ON suppliers.id = order_items.supplier_id
    WHERE customers.id = ?`;
    connection.query(sql, [req.params.customerId], (err, rows) =>
    {
        res.send(Object.values(rows));
    })
});



app.post("/customers/:customerId/orders", (req, res) =>
{
    const customerId = req.params.customerId;
    const id = Math.floor(Math.random() * 100000) + 1;

    const sql = `SELECT * FROM customers WHERE id = ?`;
    connection.query(sql, [customerId], (err, rows) =>
    {
        const result = Object.values(rows);

        if (!result)
        {
            connection.connect(function (err)
            {
                const sql = `INSERT INTO orders (id, order_date, order_reference, customerId)
                    VALUES
                    (
                        ?, ?, ?, ?
                    )`;
                connection.query(sql, [id, req.body.order_date, req.body.order_reference, customerId], (err, rows) =>
                {
                    res.send(Object.values(rows));
                });
            });
        }

        else 
        {
            res.status(400).send("Error - Something went wrong!")
        }
    })
});



app.get("/suppliers", (req, res) =>
{
    connection.query('SELECT * FROM suppliers', (err, rows) =>
    {
        res.send(Object.values(rows));
    })
});

app.get("/products", (req, res) =>
{
    if (req.query.name)
    {
        const sql = `SELECT * FROM products WHERE product_name = ?`;
        connection.query(sql, [req.query.name], (err, rows) =>
        {
            res.send(Object.values(rows));
        })
    }

    else
    {
        connection.query('SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM product_availability INNER JOIN products ON products.id = product_availability.prod_id INNER JOIN suppliers ON suppliers.id = product_availability.supp_id;', (err, rows) =>
        {
            res.send(Object.values(rows));
        })
    }
});


app.post("/products", (req, res) =>
{
    connection.connect(function (err)
    {
        const sql = `INSERT INTO  products (product_name)
                    VALUES
                    (
                        ?
                    )`;
        connection.query(sql, [req.body.product_names], (err, rows) =>
        {
            res.send(Object.values(rows));
        });
    });
});


app.post("/availability", (req, res) =>
{
    const prod_id = req.body.prod_id;
    const supp_id = req.body.supp_id;
    const unit_price = req.body.unit_price;


    if (!Number.isNaN(unit_price) && unit_price >= 0)
    {

        if (!supp_id || !prod_id)
        {
            return res.status(400).send({ err: "Something is wrong with the an ID!" });
        }

        connection.connect(function (err)
        {
            const sql = `
            INSERT INTO product_availability (prod_id, supp_id, unit_price)
            VALUES(?, ?, ?)
            `;
            connection.query(sql, [prod_id, supp_id, unit_price], (err, rows) =>
            {
                res.send(Object.values(rows));
            });

        });
    }

    else
    {
        res.status(400).send("Error - Something went wrong!");
    }
});



app.delete("/orders/:orderId", (req, res) =>
{
    const id = req.query.orderId;

    connection.query('DELETE FROM orders WHERE id = ?', [id], (err, rows) =>
    {
        res.send(Object.values(rows));
    })
});