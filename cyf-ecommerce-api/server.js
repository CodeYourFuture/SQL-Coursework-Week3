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
  password: 'hiba',
  host: 'localhost',
  database: 'cyf_ecommerce',
  port: 5432,
});

app.use (express.json ());
app.use (express.urlencoded ({extended: false}));

/******************************************************************************************* */

app.get ('/customers', (req, res) => {
  pool.query ('select *from customers', (error, result) => {
    res.json (result.rows);
  });
});

/******************************************************************************************* */

app.get ('/suppliers', (req, res) => {
  pool.query ('select *from suppliers', (error, result) => {
    res.json (result.rows);
  });
});

/******************************************************************************************* */

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

/******************************************************************************************* */

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

/******************************************************************************************* */

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

/******************************************************************************************* */

app.post ('/products', (req, res) => {
  const product_name = req.body.product_name;
  const unit_price = req.body.unit_price;
  const supplier_id = req.body.supplier_id;
  const check_if_exist_query = 'select *from suppliers where id = $1';
  pool
    .query (check_if_exist_query, [supplier_id])
    .then (result => {
      if (result.rowCount === 0 || unit_price <= 0) {
        res.send (
          'Sorry price has to be positive integer and the supplier should exist ...please try again'
        );
      } else {
        pool.query (
          'insert into products(product_name,unit_price,supplier_id) values ($1,$2,$3)',
          [product_name, unit_price, supplier_id]
        );
        res.send ('Product added successfully');
      }
    })
    .catch (err => {
      console.error (err);
    });
});

/******************************************************************************************* */

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
        pool
          .query (insertion_query, [order_date, order_reference, id])
          .then (result => {
            if (result.rowCount === 0) {
              res.send ('Sorry some thing went wrong');
            } else {
              res.send ('one order added successfully');
            }
          });
      } else {
        res.send ('sorry this customer is not exists in our database');
      }
    })
    .catch (err => {
      console.error (err);
    });
});
/******************************************************************************************* */
app.put ('/customers/:customerId', function (req, res) {
  const custId = req.params.customerId;
  let querySet = '';
  let params = [custId];
  if (req.body.name) {
    querySet += 'name=$2';
    params.push (req.body.name);
  }
  if (req.body.address) {
    if (params.length > 1) {
      querySet += ', ';
    }
    querySet = querySet + 'address=$' + (params.length + 1);
    params.push (req.body.address);
  }
  if (req.body.city) {
    if (params.length > 1) {
      querySet += ', ';
    }
    querySet = querySet + 'city=$' + (params.length + 1);
    params.push (req.body.city);
  }
  if (req.body.postcode && req.body.postcode.length > 4) {
    if (params.length > 1) {
      querySet += ', ';
    }
    querySet = querySet + 'postcode=$' + (params.length + 1);
    params.push (req.body.postcode);
  }

  let q = 'UPDATE customers SET ' + querySet + ' WHERE id=$1';
  console.log (q);
  console.log (params);
  if (params.length > 1) {
    pool.query (q, params, (err, result) => {
      if (result) console.log ('rows: ' + result.rowCount);
      if (err) {
        return console.error ('Error executing query', err.stack);
      } else {
        res.send ('Updated ' + result.rowCount + ' rows');
      }
    });
  }
});
/********************************************************************************************* */
app.delete ('orders/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  const delOrder = 'delete from orders where id = $1';
  let query =
    ' DELETE FROM order_items USING orders WHERE order_items.order_id =$1';

  pool.query (delOrder, [orderId]).then (result => {
    if (result.rows.count > 0) {
      pool.query (query, [orderId]);
      res.send ('deleted');
    }
  });
});

/******************************************************************************************** */
app.delete (`/customers/:customerId`, (req, res) => {
  const customerId = req.params.customerId;
  const check_if_noOrders_query = 'select *from orders where customer_id = $1';

  pool.query (check_if_noOrders_query, [customerId]).then (result => {
    if (result.rowCount > 0) {
      res.send ('Sorry this customer has orders we can delete them');
    } else {
      const query = 'delete from customers where id = $1';
      pool
        .query (query, [customerId])
        .then (result => {
          if (result.rowCount > 0) {
            res.send ('One record been deleted successfully');
          }
        })
        .catch (err => {
          console.error (err);
        });
    }
  });
});
/************************************************************************************************8 */

app.get ('/customers/:customerId/orders', (req, res) => {
  const id = req.params.customerId;
  const queryString =
    'select customers.name, orders.order_reference, orders.order_date, products.product_name, products.unit_price, suppliers.supplier_name, order_items.quantity from customers inner join orders on customers.id = orders.customer_id inner join order_items on orders.id = order_items.order_id inner join products on products.id  =order_items.product_id inner join suppliers on suppliers.id = products.supplier_id WHERE customers.id =$1';
  pool
    .query (queryString, [id])
    .then (results => {
      res.json (results.rows);
    })
    .catch (err => {
      console.error (err);
    });
});

//order references, order dates, product names, unit prices, suppliers and quantities.
