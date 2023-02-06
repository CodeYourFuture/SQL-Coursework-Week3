const { Pool } = require("pg");
const moment = require("moment");
const express = require("express");
const app = express();

app.use(express.json());

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "codeyourfuture",
  password: process.env.db_password,
  database: "cyf_ecommerce"
});

app.get("/customers", async (req, res) => {
  const rs = await pool.query("SELECT * FROM customers");
  const customers = rs.rows;
  res.json(customers);
});

app.get("/customers/:customer_id", async (req, res) => {
  const rs = await pool.query(`SELECT * FROM customers WHERE id = $1`, [req.params.customer_id]);
  const customer = rs.rows[0];
  res.json(customer);
});

app.get("/customers/:customer_id/orders", async (req, res) => {
  const rs = await pool.query(`SELECT orders.order_reference, orders.order_date, products.product_name,
  product_availability.unit_price, suppliers.supplier_name, order_items.quantity
  FROM orders
  INNER JOIN order_items
  ON orders.id = order_items.order_id
  INNER JOIN products
  ON products.id = order_items.product_id
  INNER JOIN product_availability
  ON order_items.product_id = product_availability.prod_id
  INNER JOIN suppliers
  ON suppliers.id = order_items.supplier_id
  WHERE orders.customer_id = $1`, [req.params.customer_id]);

  const orders = rs.rows;
  res.json(orders);
});

app.post("/customers", async (req, res) => {
  const customer = req.body;

  await pool.query(`INSERT INTO customers (name, address, city, country)
  VALUES($1, $2, $3, $4)`, [customer.name, customer.address, customer.city, customer.country]);

  res.send("Customer created.");
});

app.post("/customers/:customer_id/orders", async (req, res) => {
  const customer_id = req.params.customer_id;

  let rs = await pool.query("SELECT id FROM customers WHERE id = $1", [customer_id]);
  if (rs.rows.length === 0) return res.status(404).send("Customer not found.");

  rs = await pool.query("SELECT id from orders ORDER BY id DESC LIMIT 1");
  const last_order_id = rs.rows[0].id;

  await pool.query(`INSERT INTO orders (order_date, order_reference, customer_id)
  VALUES($1, $2, $3)`, [moment().format("YYYY-MM-DD"), `ORD0${last_order_id + 1}`, customer_id]);


  res.send("Order created.");
});

app.put("/customers/:customer_id", async (req, res) => {
  const customer_id = req.params.customer_id;
  const customer = req.body;

  let rs = await pool.query("SELECT id FROM customers WHERE id = $1", [customer_id]);
  if (rs.rows.length === 0) return res.status(404).send("Customer not found.");

  await pool.query(`UPDATE customers SET name = $1, address = $2, city = $3, country = $4
  WHERE id = $5`, [customer.name, customer.address, customer.city, customer.country, customer_id]);

  res.send("Customer updated.");
});

app.delete("/customers/:customer_id", async (req, res) => {
  const customer_id = req.params.customer_id;

  let rs = await pool.query("SELECT id FROM customers WHERE id = $1", [customer_id]);
  if (rs.rows.length === 0) return res.status(404).send("Customer not found.");

  rs = await pool.query("SELECT id FROM orders WHERE customer_id = $1", [customer_id]);
  if (rs.rows.length > 0) return res.status(400).send("This customer has existing orders.");

  await pool.query(`DELETE FROM customers WHERE id = $1`, [customer_id]);

  res.send("Customer deleted.");
});

app.get("/products", async (req, res) => {
  if (req.query.name) {
    const rs = await pool.query(`
    SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name
    FROM products
    INNER JOIN product_availability
    ON products.id = product_availability.prod_id
    INNER JOIN suppliers
    ON product_availability.supp_id = suppliers.id
    WHERE lower(products.product_name) LIKE $1`, [`%${req.query.name}%`]);

    const products = rs.rows;
    return res.json(products);
  }

  const rs = await pool.query(`
  SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name
  FROM products
  INNER JOIN product_availability
  ON products.id = product_availability.prod_id
  INNER JOIN suppliers
  ON product_availability.supp_id = suppliers.id`);

  const products = rs.rows;
  res.json(products);
});

app.post("/products", async (req, res) => {
  const product = req.body;

  await pool.query(`INSERT INTO products (product_name)
  VALUES($1)`, [product.name]);

  res.send("Product created.");
});

app.post("/availability/:product_id/:supplier_id", async (req, res) => {
  const product_id = req.params.product_id;
  const supplier_id = req.params.supplier_id;
  const unit_price = req.body.unit_price;

  if (typeof unit_price !== "number" || unit_price <= 0) return res.status(400).send("Unit price must be a number and greater than 0");

  let rs = await pool.query("SELECT id FROM products WHERE id = $1", [product_id]);
  if (rs.rows.length === 0) return res.status(404).send("Product not found.");

  rs = await pool.query("SELECT id FROM suppliers WHERE id = $1", [supplier_id]);
  if (rs.rows.length === 0) return res.status(404).send("Supplier not found.");

  await pool.query(`INSERT INTO product_availability (prod_id, supp_id, unit_price)
  VALUES($1, $2, $3)`, [product_id, supplier_id, unit_price]);

  res.send("Product availability created.");
});

app.get("/suppliers", async (req, res) => {
  const rs = await pool.query("SELECT * FROM suppliers");
  const suppliers = rs.rows;
  res.json(suppliers);
});

app.delete("/orders/:order_id", async (req, res) => {
  const order_id = req.params.order_id;

  let rs = await pool.query("SELECT id FROM orders WHERE id = $1", [order_id]);
  if (rs.rows.length === 0) return res.status(404).send("Order not found.");

  await pool.query(`DELETE FROM order_items WHERE order_id = $1`, [order_id]);

  await pool.query(`DELETE FROM orders WHERE id = $1`, [order_id]);

  res.send("Order deleted.");
});

const port = process.env.PORT || 3001;
app.listen(port, () => { console.log(`Listening on port ${port}...`); });