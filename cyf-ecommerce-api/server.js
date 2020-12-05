const {query} = require ('express');
const express = require ('express');
const app = express ();
const {Pool} = require ('pg');
const port = process.env.PORT || 3000;

app.listen (port, () => {
  console.log ('Server is running on port', port);
});

const pool = new Pool ({
  user: 'postgres',
  password: 'Deniz',
  host: 'localhost',
  database: 'cyf_ecommerce',
  port: 5432,
});

app.use (express.json ());
app.use (express.urlencoded ({extended: false}));

app.get ('/customers', (req, res) => {
  pool.query ('select *from customers', (error, result) => {
    res.json (result.rows);
  });
});
app.get ('/suppliers', (req, res) => {
  pool.query ('select *from suppliers', (error, result) => {
    res.json (result.rows);
  });
});

app.get ('/products', (req, res) => {
  const product_name_query = req.query.name;
  let query =
    'select products.product_name,suppliers.supplier_name from products inner join suppliers on suppliers.id = products.supplier_id';
  if (product_name_query) {
    query = `select products.product_name,suppliers.supplier_name from products inner join suppliers on suppliers.id = products.supplier_id where products.product_name like '%${product_name_query}%'`;
  }
  pool.query (query, (error, result) => {
    console.log (query);
    res.json (result.rows);
  });
});

app.get ('/customers/:customerId', (req, res) => {
  const customerId = req.params.customerId;
  const query = 'select *from customers where id = $1';
  pool
    .query (query, [customerId])
    .then (result => {
      res.json (result.rows);
    })
    .catch (err => {
      console.error (err);
    });
});

app.post ('/customers', (req, res) => {
  const {name, address, city, country} = req.body;
  const query =
    'insert into customers (name,address,city,country) values ($1,$2,$3,$4)';

  pool
    .query (query, [name, address, city, country])
    .then (() => {
      res.send ('Added one record successfully');
    })
    .catch (err => {
      console.error (err);
    });
});

app.post ('/products', (req, res) => {
  const product_name = req.body.product_name;
  const unit_price = req.body.unit_price;
  const supplier_id = req.body.supplier_id;
  const check_if_exist_query = 'select *from suppliers where id = $1';
  pool.query (check_if_exist_query, supplier_id).then (result => {
    if (result.rowCount <= 0 || unit_price <= 0) {
    }
  });
});

app.post ('/customers/:customerId/orders', (req, res) => {
  let count;
  const id = req.params.customerId;
  const order_date = req.body.order_date;
  const order_reference = req.body.order_reference;
  check_if_exist_query = 'select *from customers where id = $1';
  insertion_query =
    'insert into orders (order_date,order_reference,customer_id) values ($1,$2,$3)';

  pool
    .query (check_if_exist_query, [id])
    .then (result => {
      if (result.rowCount > 0) {
        pool.query (insertion_query, [order_date, order_reference, id]);
        res.send ('one order added successfully');
      } else {
        res.send ('sorry this customer is not exists in our database');
      }
    })
    .catch (err => {
      console.error (err);
    });
});


app.delete('/orders/:orderId', (req, res)=> {
  const {orderId} = req.params;

  let query = `delete from orders where id=$1`;

  pool.query(query, [orderId])
  .then(()=> res.send(`Order number:${orderId} deleted!`))
  .catch(e => {
      console.error(e);
  })
});


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
