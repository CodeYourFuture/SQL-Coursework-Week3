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
    const custId = req.params.customerId;
    const name = req.body.name;
    const address = req.body.address;
    const city = req.body.city;
    const country = req.body.country;

    pool
        .query("UPDATE customers SET name = $1, address = $2, city=$3, country=$4 WHERE id=$5", [name, address, city, country, custId])
        .then(() => res.send(`updated ${custId}`))
        .catch(err => console.log(err));
});

app.get(`/suppliers`, (req, res) => {
    pool.query("SELECT * FROM suppliers", (error, result) => {
        res.json(result.rows);
    });
});

app.get(`/products`, (req, res) => {
    const searchQuery = req.query.name

    let query = `SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON product_availability.prod_id = products.id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id`

    if(searchQuery){
        query += `WHERE product_name LIKE '%${searchQuery.toLowerCase()}%' ORDER BY product_name`;
    }
    pool.query(query, (err, result) => {
           if(err) return res.send(err)
            return res.json(result.rows);
    });
});

app.post('/products', (req, res) => {
    const productName = req.body.product_name;
    
    pool 
        .query("SELECT * FROM products WHERE product_name=$1",[productName])
        .then((result) => {
            if(result.rows.length > 0) {
                return res.status(400).send("Product already exists");
            } else {
                const query =
                "INSERT INTO products(product_name) VALUES($1)";
        pool
            .query(query, [productName])
            .then(() => res.send("product added"))
            .catch((err) => console.error(err));
        }
    }) 

});

app.post("/availability",(req, res) => {
    const productId = req.body.prod_id;
    const supplierId = req.body.supp_id;
    const unitPrice = req.body.unit_price;

    if (!productId || !supplierId || !unitPrice) return res.status(400).send("ERROR, invalid data"); 

    if(!Number.isInteger(unitPrice) || unitPrice < 0) return res.status(400).send("Please enter a positive value");

    const query = "INSERT INTO product_availability (prod_id, supp_id,unit_price) VALUES ($1,$2,$3)";
    
    pool
        .query(query, [productId, supplierId, unitPrice])
        .then(() => res.send("New product availability is added"))
        .catch((e) => console.error(e));

});


app.delete("/orders/:orderId", (req, res) => {
    const orderId = req.params.orderId;

    pool
        .query("DELETE FROM order_items WHERE order_id = $1", [orderId])
        .then(() => {
            pool
                .query("DELETE FROM orders WHERE id = $1",[orderId])
                .then(()=>{
                    return res.send(`Order ${orderId} is deleted`)
                })
                .catch((err) => console.log(err));
        })
});


app.delete("/products/:productId", (req, res) => {
    const prodId = req.params.productId;

    pool
        .query("DELETE FROM product_availability WHERE prod_id = $1", [prodId])
        .then(() => {
            pool
                .query("DELETE FROM products WHERE id = $1", [prodId])
                .then(() => {
                    return res.send(`Product ${prodId} is deleted`)
                })
                .catch((err) => console.log(err));
        })
});

app.delete("/customers/:customerId",(req, res) => {
    const custId = req.params.customerId;

    pool
        .query("SELECT * FROM orders WHERE customer_id = $1",[custId])
        .then((result) => {
            if(result.rowCount.length > 0) {
                return res.status(400).send("Unable to delete as their order is already in progress")
            } else {
                pool 
                    .query("DELETE FROM customers WHERE id = $1", [custId])
                    .then(() => res.send(`Customer ${custId} is deleted`))
                    .catch((err) => console.log(err));
            }
        })
});

app.get(`/customers/:customerId/orders`, (req, res) => {
    const custId = req.params.customerId;

    const query = `SELECT c.name, o.order_reference, o.order_date, p.product_name, pa.unit_price,s.supplier_name, oi.quantity 
    FROM customers c
    INNER JOIN orders o ON c.id = o.customer_id
    INNER JOIN order_items oi ON oi.order_id = o.id
    INNER JOIN products p ON p.id = oi.product_id
    INNER JOIN suppliers s ON s.id = oi.supplier_id
    INNER JOIN product_availability pa ON pa.supp_id = oi.product_id 
    WHERE c.id = $1
    ORDER BY o.order_date`;

    pool
        .query(query, [custId])
        .then((result)=> res.send(result.rows))
        .catch((err) => console.log(err));
})

app.listen(3000,(req,res) => {
    console.log("app is listening on port 3000");
    
})