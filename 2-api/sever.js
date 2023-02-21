const express = require("express")
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const { Pool } = require('pg');

const db = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cyf_ecommerce',
    password: 'free2way',
    port: 5432
})



app.get("/", (req, res) => {
    res.send(" Welcome to my ecommerce Database ");
})

// 
app.get("/customers", (req, res) => {
    db.query("select * from customers", (err, result) => {
        res.json(result.rows);
    });
});

app.get("/suppliers", (req, res) => {
    db.query('SELECT * FROM suppliers', (error, result) => {
        res.json(result.rows);
    })
})
app.get("/products", (req, res) => {
    db.query('SELECT product_name, unit_price, supplier_name FROM products JOIN product_availability ON (products.id = product_availability.prod_id) JOIN suppliers ON (product_availability.supp_id = suppliers.id)', (error, result) => {
        res.json(result.rows)
    })
})
app.get("/products?name=Cup", (req, res) => {
    //Need some cross check and commit later
})

app.get("/customers/:id", (req, res) => {
    const custId = req.params.id
    db.query('SELECT * FROM customers WHERE id = $1', [custId], (err, result) => {
        res.json(result.rows)
    })
})

app.post("/customers", (req, res) => {
    const newName = req.body.name
    const newAddress = req.body.address
    const newCity = req.body.city
    const newCountry = req.body.country

    const query = "INSERT INTO customers (name,address, city, country)" +
        "VALUES($1, $2, $3, $4)";
    db
        .query(query, [newName, newAddress, newCity, newCountry], (err, result) => {
            res.json(result.rows)
        })
});
app.post("/availability", (req, res) => {
    //Have to be checked 
})
app.post("`/customers/:customerId/orders`", (req, res) => {
    //Have to be checked 
})

app.put("/customers/:id", (req, res) => {
    const custId = req.params.id;
    const newName = req.body.name;
    const newAddress = req.body.address;
    const newCity = req.body.city;
    const newCountry = req.body.country;

    db.query('UPDATE customers SET  name = $2, address = $3,  city = $4, country = $5 WHERE id=$1',
        [custId, newName, newAddress, newCity, newCountry])
        .then(() => res.send(`Customer ${custId} updated!`))
        .catch((err) => {
            res.status(500).json({ error: err })
        });
});

// Add a new DELETE endpoint `/orders/:orderId` to delete an existing order 
// along with all the associated order items. 


app.delete("/orders/:id", (req, res) => {
    const orderId = req.params.id;

    db
        .query("DELETE FROM order_items WHERE order_id = $1", [orderId])
        .then(() => {
            db.query("DELETE FROM orders WHERE id = $1", [orderId])
                .then(() => res.send(`order ${orderId} deleted!`))
        })
        .catch((err) => console.error(err));
});

//  Add a new DELETE endpoint `/customers/:customerId` to delete an existing customer only 
// if this customer doesn't have orders.

app.delete("/customers/:id", (req, res) => {
    custId = req.params.id
    db.query("DELETE FROM customers WHERE id = $1", [custId])
        .then(() => res.send((`customer ${custId} deleted`)))
        .catch((err) => console.error(err));
})
// Add a new GET endpoint `/customers/:customerId/orders` to load all the orders along with
// the items in the orders of a specific customer. Especially, the following information
// should be returned: order references, order dates, product names, unit prices, suppliers
// and quantities.
app.get("/customers/:id/orders", (req, res) => {
    const custId = req.params.id
    db.query("SELECT o.order_reference, o.order_date, p.product_name, pa.unit_price, s.supplier_name, oi.quantity FROM orders o JOIN order_items oi ON (o.id = oi.order_id) JOIN products p ON (oi.product_id = p.id) JOIN product_availability pa ON (p.id = pa.prod_id) JOIN suppliers s ON (pa.supp_id = s.id) WHERE o.customer_id = $1", [custId], (err, result) => {
        res.json(result.rows)
    })
})


app.listen(3000, function () {
    console.log("Server is listening on port 3000. ready to accept requrests!")

})