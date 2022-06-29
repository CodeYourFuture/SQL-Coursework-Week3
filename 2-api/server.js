const express = require('express');
const {Pool} = require('pg');
const app = express();


app.use(express.json());

const PORT = process.env.PORT || 8080;



const pool = new Pool({
    user:'postgres',
    host:'localhost',
    database:'postgres',
    password:'Anvita2018',
    port:5432
});

//get customer by id
app.get ('/customers/:customerId', (req, res) => {
    const searchedId = req.params.customerId
    pool.query('SELECT * FROM customers WHERE id=$1', [searchedId])
    .then(result => res.send(result.rows))
    .catch(err => {
        res.status(500).json(err)
    })
});

//get all the customers
app.get('/customers', (req, res) => {
    pool.query('SELECT * FROM customers')
    .then(result => res.send(result.rows))
    .catch(err => {
        res.status(500).json(err)
    })
}),

//get all the suppliers
app.get('/suppliers', (req, res) => {
    pool.query('SELECT * FROM suppliers')
    .then(result => res.send(result.rows))
    .catch(err => {
        console.log(err);
        res.status(500).json(error)
        
    })
})

//get all the products
app.get("/products", (req, res) => {
   const searchProduct = req.query.name
  pool
    .query(
      'SELECT products.product_name as "productName", unit_price as price, suppliers.supplier_name as "supplier" FROM product_availability INNER JOIN products ON products.id = product_availability.prod_id INNER JOIN suppliers ON suppliers.id = product_availability.supp_id WHERE products.product_name=$1',[searchProduct]
    )
    .then((result) => {
        res.json(result.rows);
        
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//enable user to add product
app.post('/products', (req, res) => {
    const{id, product_name} = req.body;
    pool.query('INSERT INTO products(product_name) VALUES($1, $2)', [id, product_name])
    .then(res.send('product added'))
    .catch(err => {
        res.status(500).json(err)
    })

})

//enable adding product availability
app.post('/availability', (req, res) => {
    const {prod_id, supp_id, unit_price} = req.body

    pool.query('INSERT INTO product_availability VALUES($1, $2, $3)', [prod_id, supp_id, unit_price])
    .then(res.send('product availability added'))
    .catch(err => {
        res.status(500).json(err)
    })
})

//enable adding the order for certain customer by customer's id
app.post('/customers/:customerId/orders', (req, res) => {
    const {order_date, order_reference, customer_id} = req.body
    pool.query('INSERT INTO orders(order_date, order_reference, customer_id) VALUES($1, $2, $3)', [order_date, order_reference, customer_id])
    .then(res.send('order added'))
    .catch(err=> {
        res.status(500).json(err)
    })
})

//update a customer's detail by searching with his id
app.put('/customers/:customerId', (req, res) => {
    const { name, address, city, country } = req.body;
    const id = req.params.customerId
    const setQuery = 'name=$1, address=$2, city=$3, country=$4'
    pool.query(`UPDATE customers SET ${setQuery}  WHERE id=$5`, [name, address, city, country, id])
    .then(res.send('customer updated'))
    .catch(err => {
        res.status(500).json(err)
    })
})

//delete an order along with it detain in another table:order_items
app.delete('/orders/:orderId', (req, res) => {
    const id = req.params.orderId
    pool.query(`DELETE FROM order_items WHERE id=$1`, [id])
    .then(() => {
       pool.query(`DELETE FROM orders WHERE id=$1`, [id]) 
    })
    .then(res.send('order deleted'))
    .catch(err => {
        res.status(500).json(err)
    })
})

//delete a customer only if it has no order
app.delete('/customers/:customerId', (req, res) => {
    const id = req.params.customerId
    pool.query('SELECT * FROM orders WHERE customer_id=$1', [id])
    .then(result => {
        if (result.rows.length > 0) {
            res.status(404).send('This customer has order.So, it cant be deleted')
        } else {
            pool.query('DELETE FROM customers WHERE id=$1', [id])
             
            .then(res.send('customer deleted'))
            .catch(err => {
                res.status(500).json(err)
            })
        }
    })
})
//get joined detail of customer with its order
 app.get("/customers/:customerId/orders", (req, res) => {
   const customerId = req.params.customerId;

   let query =
     "SELECT orders.id, order_date, order_reference, unit_price, quantity, product_name, supplier_name FROM orders INNER JOIN order_items ON order_items.order_id=orders.id INNER JOIN product_availability ON order_items.product_id=product_availability.prod_id AND order_items.supplier_id=product_availability.supp_id INNER JOIN products ON product_availability.prod_id=products.id INNER JOIN suppliers ON product_availability.supp_id=suppliers.id WHERE orders.customer_id=$1"
   pool
     .query(query, [customerId])
     .then((result) => {
       res.send(result.rows);
     })
     .catch((error) => {
       res.status(500).json(error);
     });
 });


app.listen(PORT, () => console.log(`Listening to the port ${PORT}`));

