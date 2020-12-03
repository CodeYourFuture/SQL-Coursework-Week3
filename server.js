const express = require('express');
const app = express();
const {Pool} = require('pg');
const bodyParser = require('body-parser');


const PORT = 3000;
const productsAndSupplierName = `select p.product_name, s.supplier_name from products AS p inner join suppliers AS s ON s.id=p.supplier_id`;

//MIDDLEWARE
app.use(express());
app.use(bodyParser.json());

//CONNECT TO DB
const pool = new Pool({
    user: 'postgres',
    password: 'postgres',
    database: 'cyf_ecommerce',
    port: 5432,
    host: 'localhost'

});

//ROUTES
app.get('/', (req, res)=> {
    res.send('Welcome to Week 3 SQL API');
});

//GET ALL PRODUCTS & SUPPLIER NAMES
app.get('/products', (req, res) => {
    pool.query(productsAndSupplierName, (error, result) => {
        res.json(result.rows);
    })
});

//FILTER PRODUCT FROM ENDPOINT
app.get('/product', (req, res) => {
    const productNameQuery = req.query.name;
    let query = `SELECT * FROM products ORDER BY product_name`;

    if(productNameQuery){
        query = `SELECT * FROM products WHERE product_name LIKE '%${productNameQuery}%' ORDER BY product_name`;
    }


    pool.query(query)
    .then((result) => res.json(result.rows))
    .catch(e => {
        console.error(e);
    });
});

//INDIVIDUAL CUSTOMER 
app.get('/customers/:customerId', (req, res) => {
    const {customerId} = req.params;
    let query = `select * from customers where id=$1`;

    pool.query(query, [customerId])
    .then((result) => res.json(result.rows))
    .catch(e => {
        console.error(e);
    })
});
//ALL CUSTOMERS
app.get('/customers', (req, res)=> {
   let query = `select * from customers`;

   pool.query(query)
   .then(result => res.json(result.rows))
   .catch(e => {
       console.error(e);
   });
});

//UPDATE CUSTOMERS
app.put('/customers/:customerId', (req, res) => {
    const {customerId} = req.params;
    const newName = req.body.name;
    const newAddress = req.body.address;
    const newCity = req.body.city;
    const newCountry = req.body.country;
    let query = `update customers set name=$1, address=$2, city=$3, country=$4 where id=$5`;

    if(newName === "" || newAddress === "" || newCountry === "" || newCity === ""){
        res.status(400).send('key data missing!!!')
    }else{
        pool.query(query, [newName, newAddress, newCity, newCountry,  customerId])
        .then((result) => res.send(`Customer ${customerId} updated!`))
        .catch(e => {
            console.error(e);
        });
    }
});

//POST ROUTE FOR ADDING NEW CUSTOMERS
app.post('/customers', (req, res) => {
    let postName = req.body.name;
    let postAddress = req.body.address;
    let postCity = req.body.city;
    let postCountry = req.body.country;

    let addQuery = `insert into customers (name, address, city, country) VALUES ($1, $2, $3, $4)`;

    pool.query(addQuery, [postName, postAddress, postCity, postCountry])
    .then(() => res.send('Customer Added!'))
    .catch(e => {
        console.error(e);
    })
});

//POST ROUTE TO CREATE NEW PRODUCT
app.post('/products', (req, res) => {
    //pull from req.body
    let postProductName = req.body.productname;
    let postPrice = req.body.price;
    let postSupplierId = req.body.supplierId;

    //SET CONDITION FOR NUMBER CHECK
    if(!Number.isInteger(postPrice) || postPrice < 1){
        return res.status(400).send('Invalid unit price!');
    }
    
    //POOL QUERY WITH SUPPLIER ID CHECK
    pool.query(`select * from products where supplier_id=$1`, [postSupplierId])
    .then((result) => {
       if(result.rows <= 0){
            res.status(400).send('Supplier does not exist!!');
       }
       else{
        let addQuery = `insert into products (product_name, unit_price, supplier_id) VALUES ($1,$2,$3)`;
        pool.query(addQuery, [postProductName, postPrice, postSupplierId])
        .then(() => {
            res.send('Product Added!!');
        })
        .catch(e => {
            console.error(e);
        });
           
       }
    })
    .catch(e => {
        console.error(e);
    })
});

//CUSTOMER ORDER ROUTE 
app.post('/customers/:customerId/orders', (req, res) => {
    const  {customerId} = req.params;
    let orderDate = req.body.date;
    let orderRef = req.body.ref;

    let query = `select * from orders where customer_id=$1`;

    pool.query(query, [customerId])
    .then((result) => {
        if(result.rows <= 0){
            res.status(400).send('customer does not exist!');
        }
        else{
            let query = `insert into orders (order_date, order_reference, customer_id) VALUES ($1,$2,$3)`;
            pool.query(query, [orderDate, orderRef, customerId])
            .then(() => {
                res.send('Order added!!');
            })
            .catch(e => {
                console.error(e);
            })
        }
    })
    .catch(e => {
        console.error(e);
    })
});

//DELETE ORDERS
app.delete('/orders/:orderId', (req, res)=> {
    const {orderId} = req.params;

    let query = `delete from orders where id=$1`;

    pool.query(query, [orderId])
    .then(()=> res.send(`Order number:${orderId} deleted!`))
    .catch(e => {
        console.error(e);
    })
});

//DELETE CUSTOMER WITHOUT ORDERS
app.delete('/customers/:customerId', (req, res) => {
    const {customerId} = req.params;

    let query =  `delete from orders where customer_id=$1`;

    pool.query(query, [customerId])
    .then(()=> {
        pool.query(`delete from customers where id=$1`, [customerId])
        .then(()=> res.send(`customer number:${customerId} deleted!`))
        .catch(e => {
            console.error(e);
        })
    })
    .catch(e => {
        console.error(e);
    })
});

//CUSTOMER ORDERS WITH JOINED INFO
app.get('/customers/:customerId/orders', (req, res)=> {
    const {customerId} = req.params;
    let query = `select c.name, o.order_date, o.order_reference, oi.quantity, p.product_name, p.unit_price, s.supplier_name FROM customers AS c  inner join orders AS o ON c.id=o.customer_id inner join order_items AS oi ON o.id=oi.order_id inner join products AS p ON p.id=oi.product_id inner join suppliers AS s ON s.id=p.supplier_id where c.id=$1`;


    pool.query(query, [customerId] )
    .then((result) => res.json(result.rows))
    .catch(e => {
        console.error(e);
    })
});

app.listen(process.env.PORT || 3000, (req, res)=> {
 console.log(`Server listening.Ready to accept requests`);
});