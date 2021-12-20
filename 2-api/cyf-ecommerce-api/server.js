const express = require('express');
const app = express();
app.use(express.json());
const { Pool } = require('pg')

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "cyf_ecommerce",
    password: "",
    port: 5432,
});

app.get("/",(req,res) => {
    res.send("hi");
});

app.get(`/customers`, (req, res) => {
    pool.query("SELECT * FROM customers", (error, result) => {
        res.json(result.rows);
    });
});

app.get(`/customers/:customerId`,(req,res) => {
    let custId = req.params.customerId;
    let custCity = req.params.customerId;
    let query = "SELECT * FROM customers WHERE id=$1";

    pool.query(query, [custId])
    .then((result) => res.json(result.rows))
    .catch((err) => console.log(err))
});

app.post('/customers',(req, res) => {
    const newCustname = req.body.name;
    const newCustaddress = req.body.address;
    const newCustcity = req.body.city;
    const newCustcountry = req.body.country;

    if(!newCustname){
        res.status(400).send("Please enter a name")
    }

    pool
        .query("SELECT name FROM customers where name=$1",[newCustname])
        .then((result) => {
            if(result.rows.length > 0){
                return res.status(400).send("Name already exits");
            } else {
                const query =
                "INSERT INTO customers (name, address, city, country) VALUES ($1,$2,$3,$4)";
                
                pool
                    .query(query, [newCustname, newCustaddress, newCustcity, newCustcountry])
                    .then(() => res.send("customer added"))
                    .catch((err) => console.error(err));
            };
        })
});

app.post("/customers/:customerId/orders", function (req, res) {
    const customerId = req.params.customerId;
    const newDate = req.body.order_date;
    const newRef = req.body.order_reference;

    if(!customerId || !newDate || !newRef){
        return res.status(400).send("You need to enter something")
    }

    pool
        .query("SELECT * FROM customers WHERE id=$1", [customerId])
        .then((result) => {
            if (result.rows.length < 1) {
                return res.status(400).send("customer doesn't exist!");
            } else {
                const query =
                    "INSERT INTO orders (customer_id, order_date, order_reference) VALUES ($1, $2, $3)";
                pool
                    .query(query, [customerId, newDate, newRef])
                    .then(() => res.send("order has been added"))
                    .catch((err) => console.error(err));
            }
        });
});

app.put(`/customers/:customerId`, (req, res) => {
    const name = req.body.name;
    const address = req.body.address;
    const city = req.body.city;
    const country = req.body.country;
});

app.get(`/suppliers`, (req, res) => {
    pool.query("SELECT * FROM suppliers", (error, result) => {
        res.json(result.rows);
    });
});

// the product names along with their prices and supplier names.

app.get(`/products`, (req, res) => {
    pool.query(
        "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON product_availability.prod_id = products.id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id",
        (error, result) => {
            res.json(result.rows);
        }
    );
});

app.post('/products', (req, res) => {
    const productName = req.body.product_name;
    const query =
        "INSERT INTO products(product_name) VALUES($1)";

    pool
        .query(query, [productName])
        .then(() => res.send("product added"))
        .catch((err) => console.error(err));

});

app.post("/availability",(req, res) => {
    const productId = req.body.prod_id;
    const supplierId = req.body.supp_id;
    const unitPrice = req.body.unit_price;

    if (!productId || !supplierId || !unitPrice) return res.status(400).send("ERROR, invalid data"); 

    if(unitPrice < 0) return res.status(400).send("Please enter a positive value");

    const query = "INSERT INTO product_availability (prod_id, supp_id,unit_price) VALUES ($1,$2,$3)";
    
    pool
        .query(query, [productId, supplierId, unitPrice])
        .then(() => res.send("New product availability is added"))
        .catch((e) => console.error(e));

});

app.listen(3000,(req,res) => {
    console.log("app is listening on port 3000");
    
})