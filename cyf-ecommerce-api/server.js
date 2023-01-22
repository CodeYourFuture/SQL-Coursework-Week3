//Libraries
const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const { Pool } = require('pg');

const pool = new Pool({
    user: 'chris_user',
    host: 'dpg-cf61lhpa6gdjkk3e7jk0-a.oregon-postgres.render.com',
    database: 'cyf_ecommerce_aoqz',
    password: 'dkp2IKa9BckbJdWmBOik0g1oH5PiWw7P',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

//week 2 question 1
app.get("/customers", function(req, res) {
    pool.query('SELECT * FROM customers')
        .then((result) => res.json(result.rows))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});

//week 2 question 2
app.get("/suppliers", function(req, res) {
    pool.query('SELECT * FROM suppliers')
        .then((result) => res.json(result.rows))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});

//week 2 question 3 
app.get("/products", function(req, res) {
    pool.query('SELECT p.product_name, s.supplier_name, unit_price FROM product_availability p_u inner join products p on p.id = p_u.prod_id inner join suppliers s on s.id = p_u.supp_id order by p.product_name')
        .then((result) => res.json(result.rows))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});

//week 3 question 1
app.get("/products", function(req, res) {
    pool.query(`SELECT p.product_name, s.supplier_name, unit_price FROM product_availability p_u inner join products p on p.id = p_u.prod_id inner join suppliers s on s.id = p_u.supp_id where p.product_name like '%$1%'`, [product_name])
        .then((result) => res.json(result.rows))
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        });
});

//week 3 question 2
app.get("/customers/:customerId", function (req, res) {
    const customerId = req.params.customerId;
  
    pool
      .query("SELECT * FROM customers WHERE id=$1", [customerId])
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  });

//week 3 question 3  
  app.post("/customers", function (req, res) {
    const newCustomerName = req.body.name;
    const newAddress = req.body.address;
    const newCity = req.body.city;
    const newCountry = req.body.country;

    const query =
       "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
        pool
          .query(query, [newCustomerName, newAddress, newCity, newCountry])
          .then(() => res.send("Customer created!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    );

//week 3 question 4.1
app.get("/products", function(req, res){
    pool
     .query("SELECT * FROM products")
     .then(()=> res.send("See all products"))
     .catch((error)=> {
        res.status(500).json(error);
     })
})    

//week 3 question 4.2
app.post("/products", function (req, res) {
    const newProdName = req.body.product_name;
    const newSuppName = req.body.supplier_name;
    const newUnitPrice = req.body.unit_price;

    const query = 
    'INSERT INTO products (product_name, supplier_name, unit_price) VALUES ($1,$2,$3)';
    pool
        .query(query, [newProdName, newSuppName, newUnitPrice]);
        .then(()=> res.send{"Product created"})
        .catch((error) => {
            console.error(error);
            res.status(500).json(error);
        })
});

//week 3 question 5
app.post("/availability", (req, res)=>{
    const newProdName = req.body.product_name;
    const newSuppName = req.body.supplier_name;
    const newUnitPrice = req.body.unit_price;

    pool
        .query('Select p.product_name,  p.id, unit_price, suppliers.id from product_availability p_a inner join products p on  p.id = p_a.prod_id inner join suppliers s on s.id = p_u.supp_id ' );
        .then((result)=>{
            if(result.newUnitPrice > 0 && !result.product.id && !result.supplier.id){
                return res.status(400).send('This product does not exist on the system');
            } else{
                const query = 
                'INSERT INTO products (product_name, supplier_name, unit_price) VALUES ($1,$2,$3)';
                pool
                    .query(query, [newProdName, newSuppName, newUnitPrice])
                    .then(()=> res.send{"Product created"})
                    .catch((error) => {
                        console.error(error);
                        res.status(500).json(error);
                    })
            }
        })

});

//week 3 question 6
app.post("/customers/:customerId/orders", (req, res)=>{
    const newOrderDate = req.body.order_date;
    const newOrderRef = req.body.order_reference;
    const newOrderCustId = req.body.customer_id;

    pool
        .query('select * from customers')
        .then((result)=>{
            if (result.id !== customers.id){
             return res
                .status(400)
                .send(" Customer does not exist");
            } else {
                const query =
                'INSERT INTO orders(order_date, order_reference, customer_id)VALUES($1, $2, $3)';
                pool
                    .query(query, [newOrderDate, newOrderRef, newOrderCustId])
                    .then(() => res.send('Customer Created'))
                    .catch((error)=> res.status(500).json(error))
            }
        })
    })   


//week 3 question 7
app.put("/customers/:customersId", (req, res)=>{
    const custName = req.body.name;
    const custAddress = req.body.address;
    const custCity = req.body.city;
    const custCountry = req.body.country;

    pool
        .query('UPDATE customers SET name=$1, address=$2, city=$3, country=$4 where id=$5 ')
        .then(()=> res.send(`${custName} has been updated`))
        .catch((error)=> res.status(500).json(error))
})

//week 3 question 8
app.delete("/orders/:orderId", (req, res)=>{
    const orderId = req.params.order_.id;
  
    pool
      .query("DELETE * FROM orders o WHERE o.id=$1", [orderId])
      .then(() => pool.query("DELETE * FROM order_items o_i WHERE o_i.id=$1", [orderId]))
      .then(() => res.send(`Orders deleted!`))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  });


//week 3 question 9
app.delete("/customers/:customerId", (req, res)=> {
  const customerId = req.params.customerId;

  pool
    .query("DELETE FROM customers WHERE id=$1", [customerId])
    .then(() => res.send(`Customer ${customerId} deleted!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//week 3 question 10
app.get("/customers/:customerId/orders", (req, res)=>{
    pool.query('select orders.*, customers.*,order_items.* from order.items o_i inner join orders o on o.id = o_i.order_id inner join customers c on c.id = o_i.customer_id where c.id=$1')
        .then((result)=> res.json(result.rows))
        .catch((error) => res.status(500).json(error))
})



app.listen(port, function() {
    console.log("Server is listening on port 3001. Ready to accept requests!");
});