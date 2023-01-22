const express = require("express");
const app = express();


app.use(express.json());

const port = process.env.PORT || 3001;

const { Pool } = require('pg');

const pool = new Pool({
  user: 'alexjora',
  host: 'dpg-cet8da9a6gdut0o9m4p0-a.oregon-postgres.render.com',
  database: 'cyf_ecommerce_sist',
  password: '87S9xLjsgG7dotKmhz0vcCh6MmGyUW7V',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});



// 1
app.get("/products", function (req, res) {

  let { product_name } = req.query;

  let params = [];

  if (product_name) {

    query =
      `SELECT 
      products.product_name,
      product_availability.unit_price,
      suppliers.supplier_name 
      
      FROM products 
      INNER JOIN product_availability ON products.id=product_availability.prod_id 
      INNER JOIN suppliers ON product_availability.supp_id=suppliers.id 
      WHERE product_name LIKE ${product_name}`;
    params.push(`%${product_name}%`);

    pool
      .query(query, params)
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      })

  } else {

    pool
      .query(`SELECT 
      products.product_name,
      product_availability.unit_price,
      suppliers.supplier_name 

      FROM products 
      INNER JOIN product_availability ON products.id=product_availability.prod_id 
      INNER JOIN suppliers ON product_availability.supp_id=suppliers.id `)
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  }
});


//2
app.get("/customers/:customerId", (req, res) => {
  const { customerId } = req.params;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


// 3
app.post("/customers", (req, res) => {
  const { name, address, city, country } = req.body;

  const query =
    "INSERT INTO customers(name, address, city, country) VALUES ($1, $2, $3, $4)";

  pool
    .query(query, [name, address, city, country])
    .then(() => res.send("Customer Added"))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });

});


// 4
app.post("/products", (req, res) => {
  const {product_name} = req.body;
  const query =
    "INSERT INTO products(product_name) VALUES ($1)";
  pool
    .query(query, [product_name])
    .then(() => res.send("Product Added"))
    .catch((error) => {
      console.log(error);
      res.status(500).json(error);
    });

});


// 5
app.post("/availability", (req, res) => {
  const { unit_price, prod_id, supp_id } = req.body;

  if (unit_price <= 0) {
    return res.status(400).json({
      result: "failure",
      msg: "The price should be a positive integer",
    });
  }

  pool
    .query(
      `SELECT 
      product_availability.prod_id, 
      product_availability.supp_id 

      FROM product_availability 
      INNER JOIN products ON products.id = product_availability.prod_id 
      INNER JOIN suppliers ON suppliers.id = product_availability.supp_id`

    )
    .then((result) => {
      if (result.rows.length == 0) {
        return res.status(400).json({
          msg: `Id's not found`,
        });
      } else {
        const query =
          "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES($1, $2, $3)";
        pool
          .query(query, [prod_id, supp_id, unit_price])
          .then(() =>
            res.json({
              msg: "A new product availability was added successful",
            })
          )
          .catch((error) => {
            console.log(error);
            res.status(500).json(error);
          });

      }
    });
});



// 6
app.post("/customers/:customerId/orders", (req, res) => {
  const { customerId } = req.params;
  const { order_date, order_reference } = req.body;

  pool
    .query("Select * FROM customers Where id=$1", [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(400).send("Please enter a valid customer id");
      } else {
        const query =
          "INSERT into orders(order_date, order_reference, customer_id) values ($1, $2, $3)";
        pool
          .query(query, [order_date, order_reference, customerId])
          .then(() => res.send("Order created"))
          .catch((error) => {
            console.log(error);
            res.status(500).json(error);
          });
      }
    });
});



// 7
app.put("/customers/:customerId", (req, res) => {
  const { customerId } = req.params;
  const { name, address, city, country } = req.body;

  pool
    .query("UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5", [name, address, city, country, customerId])
    .then(() => res.send(`Customer ${customerId} updated!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


// 8
app.delete("/orders/:orderId", (req, res) => {
  const { orderId } = req.params;

  pool
    .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
    .then(() => pool.query("DELETE FROM orders WHERE id=$1", [orderId]))

    .then(() => res.send(`Orders and order items with id ${orderId} deleted!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


// 9
app.delete("/customers/:customerId", (req, res) => {
  const { customerId } = req.params;

  pool
    .query(
      `SELECT * FROM orders INNER JOIN customers ON orders.customer_id = customers.id WHERE customers.id = $1`,
      [customerId]
    )
    .then((result) => {
      if (result.rows.length == 0) {
        pool
          .query(`DELETE FROM customers WHERE id=$1`, [customerId])
          .then(() =>
            res.send(`The customer with id ${customerId} has been removed`)
          )
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      } else {
        return res.status(400).json({
          result: "failure",
          msg: `The customer with id ${customerId} couldn't be deleted because he has orders`,
        });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


// 10
app.get("/customers/:customerId/orders", (req, res) => {
  const { customerId } = req.params;
  const query =
    `SELECT 
     customers.name,
     orders.order_date,
     orders.order_reference,
     products.product_name, 
     product_availability.unit_price ,
     suppliers.supplier_name, 
     order_items.quantity
  FROM customers 
  INNER JOIN orders ON customers.id = orders.customer_id 
  INNER JOIN order_items ON order_items.order_id = orders.id 
  INNER JOIN suppliers ON suppliers.id = order_items.supplier_id
  INNER JOIN products ON products.id = order_items.product_id 
  INNER JOIN product_availability ON product_availability.prod_id = products.id 
  WHERE customers.id=$1 ORDER BY customers.name;`;
  pool
    .query(query, [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        res
          .status(404)
          .json({ msg: `No customer with id ${customerId} has been found` });
      } else {
        res.json(result.rows);
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}.`)
})