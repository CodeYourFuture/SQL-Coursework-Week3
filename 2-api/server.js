const express = require("express");
const app = express();
const { Pool } = require("pg");
const cors = require("cors");
app.use(cors());
const bp = require("body-parser");
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));


let myavr=0;
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));

const pool = new Pool({
  // Because I can only deply one database in the cloud (Render),
  //That is why I merged with another project and added all the table of cyf_ecommerce.sql
  // connectionString: `postgres://kawa:${process.env.DB_PASSWORD}@dpg-cfbi33pgp3jsh6aqrnag-a.oregon-postgres.render.com/videosproject_kawa_cyf`,
  // ssl: { rejectUnauthorized: false },

  connectionString: `postgres://kawa:xea5cgoHN7vSXkLYgi1pV60RwVRdJIQK@dpg-cfbi33pgp3jsh6aqrnag-a.oregon-postgres.render.com/videosproject_kawa_cyf`,
  ssl: { rejectUnauthorized: false },
});

pool.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: " + err.stack);
    return;
  }
  console.log("Connected to the database");
});

app.get("/products", (req, res) => {
  let query = "";
  console.log(!req.query.name);
  if (!req.query.name) {
    query =
      "SELECT product_name, unit_price, supplier_name    FROM products  JOIN product_availability ON products.id = product_availability.prod_id  JOIN suppliers ON product_availability.supp_id = suppliers.id";
  } else {
    query =
      "SELECT product_name, unit_price, supplier_name    FROM products  JOIN product_availability ON products.id = product_availability.prod_id  JOIN suppliers ON product_availability.supp_id = suppliers.id WHERE LOWER(product_name) LIKE " +
      "'%" +
      req.query.name +
      "%'";
    // console.log(query)
  }

  pool
    .query(query)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      res.status(400).json(error);
    });
  return;
});

app.get("/customers/:customerId", (req, res) => {
  const customersId = req.params.customerId;
  // console.log(customersId)

  if (parseInt(customersId) !== NaN) {
    pool
      .query("SELECT * FROM customers where customers.id=$1", [
        parseInt(customersId),
      ])
      .then((result) => res.json(result.rows))
      .catch((error) => {
        res.status(400).json(error);
      });
    return;
  }
});

app.post("/customers", async (req, res) => {
  const { name, address, city, country } = req.body;
  //  const  result = await pool.query("SELECT Max(id) FROM customers");
  //  const maxId= result.rows[0].max;
  if (!name || !address || !city || !country) {
    res.sendStatus(400);
    return;
  } else {
    const query =
      "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
    await pool
      .query(query, [name, address, city, country])
      .then((result) => res.json("New customer added"))
      .catch((error) => {
        res.status(400).json(error);
      });
      return;
  }
  return;
});


app.post("/products", async (req, res) => {
  if (!req.body.product_name ) {
    res.sendStatus(400);
    return;
  } else {
    const query =
      "INSERT INTO products (product_name) VALUES ($1)";
    await pool
      .query(query, [req.body.product_name])
      .then((result) => res.json("New product added"))
      .catch((error) => {
        res.status(400).json(error);
      });
      return;
  }
  return;
});




app.post('/availability', (req, res) => {
  const { prod_id, supp_id, unit_price } = req.body;

  if (!prod_id || !supp_id || !unit_price) {
    return res.status(400).send({ error: 'Product ID, Supplier ID, and Price are required fields' });
  }

  if (unit_price <= 0) {
    return res.status(400).send({ error: 'Price must be a positive integer' });
  }

  pool.query(`
    SELECT * 
    FROM products 
    WHERE id = $1`, [prod_id], (err, product) => {
      if (err) {
        return res.status(500).send({ error: 'Error checking for product existence' });
      }

      if (!product.rows.length) {
        return res.status(400).send({ error: 'Product does not exist in the database' });
      }

      pool.query(`
        SELECT * 
        FROM suppliers 
        WHERE id = $1`, [supp_id], (err, supplier) => {
          if (err) {
            return res.status(500).send({ error: 'Error checking for supplier existence' });
          }

          if (!supplier.rows.length) {
            return res.status(400).send({ error: 'Supplier does not exist in the database' });
          }

          pool.query(`
            INSERT INTO product_availability (prod_id, supp_id, unit_price)
            VALUES ($1, $2, $3)`, [prod_id, supp_id, unit_price], (err, result) => {
              if (err) {
                return res.status(500).send({ error: 'Error inserting new product availability' });
              }

              res.status(201).send({ message: 'Product availability added successfully' });
            });
        });
    });
});



app.post('/customers/:customerId/orders', (req, res) => {
  const { order_date, order_reference } = req.body;
  const customerId = req.params.customerId;
  if (!order_date || !order_reference) {
    return res.status(400).send({ error: 'Order date and reference are required fields' });
  }

  pool.query(`
    SELECT * 
    FROM customers 
    WHERE id = $1`, [customerId], (err, customer) => {
      if (err) {
        return res.status(500).send({ error: 'Error checking for customer existence' });
      }

      if (!customer.rows.length) {
        return res.status(400).send({ error: 'Customer does not exist in the database' });
      }

      pool.query(`
        INSERT INTO orders (customer_id, order_date, order_reference)
        VALUES ($1, $2, $3)`, [customerId, order_date, order_reference], (err, result) => {
          if (err) {
            return res.status(500).send({ error: 'Error inserting new order' });
          }

          res.status(201).send({ message: 'Order added successfully' });
        });
    });
});


app.put('/:customerId', (req, res) => {
  const { name, address, city, country } = req.body;
  const customerId = req.params.customerId;
  pool.query('UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5', [name, address, city, country, customerId], (error, result) => {
  if (error) {
    res.status(500).json({
      message: 'An error occurred while updating the customer',
      error: error.message
    });
  } else {
    res.status(200).json({
      message: 'Customer updated successfully'
    });
  }
});
});



app.delete('/orders/:orderId', async (req, res) => {
  const  orderId = req.params.orderId;

  try {
    // Delete order items
    const deleteOrderItemsQuery = 'DELETE FROM order_items WHERE order_id = $1';
    await pool.query(deleteOrderItemsQuery, [orderId]);

    // Delete order
    const deleteOrderQuery = 'DELETE FROM orders WHERE id = $1';
    await pool.query(deleteOrderQuery, [orderId]);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});


app.delete('/customers/:customerId', async (req, res) => {
  const  customerId  = req.params.customerId;

  try {
    // Check if customer has orders
    const checkOrdersQuery = 'SELECT COUNT(*) FROM orders WHERE customer_id = $1';
    const { rows } = await pool.query(checkOrdersQuery, [customerId]);
    const orderCount = rows[0].count;

    if (orderCount > 0) {
      return res.status(400).send({ error: 'Customer has existing orders and cannot be deleted' });
    }

    // Delete customer
    const deleteCustomerQuery = 'DELETE FROM customers WHERE id = $1';
    await pool.query(deleteCustomerQuery, [customerId]);

    return res.sendStatus(204);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});


app.get('/customers/:customerId/orders', async (req, res) => {
  const { customerId } = req.params;

  try {
    const ordersQuery = `
      SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity
      FROM orders
      JOIN order_items ON orders.id = order_items.order_id
      JOIN products ON order_items.product_id = products.id
      JOIN product_availability ON order_items.product_id = product_availability.prod_id AND order_items.supplier_id = product_availability.supp_id
      JOIN suppliers ON order_items.supplier_id = suppliers.id
      WHERE orders.customer_id = $1
    `;
    const { rows } = await pool.query(ordersQuery, [customerId]);

    return res.send(rows);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

