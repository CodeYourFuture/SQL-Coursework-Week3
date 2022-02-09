const express = require("express");
const app = express();
const { Pool } = require("pg");
const secrets = require("./_secrets");

app.use(express.json());

// over the top? Yes.
const pool = new Pool({
  host: secrets.host,
  port: secrets.port,
  user: secrets.user,
  password: secrets.password,
  database: secrets.database,
});

// GET "/" : signposting
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the database API! Please do something" });
});

// GET "/customers" : serve all customers in the database
app.get("/customers", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT name, address, city, country FROM customers;"
  );

  res.json(rows);
});

// GET "/customers/${customerId}/orders" : serves all order info from a specific customer
app.get("/customers/:customerId/orders", async (req, res) => {
  const { customerId } = req.params;
  const query = `SELECT orders.customer_id, orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity
  FROM orders 
  INNER JOIN order_items ON order_items.order_id = orders.id
  INNER JOIN product_availability ON product_availability.prod_id = order_items.product_id
  INNER JOIN suppliers ON suppliers.id = product_availability.supp_id
  INNER JOIN products ON products.id = product_availability.prod_id
  WHERE orders.customer_id = $1;`;

  const { rows } = await pool.query(query, [customerId]);

  rows.length === 0
    ? res.status(400).json({
        success: false,
        message: `No customers with ID of ${customerId} was found`,
      })
    : res.json(rows);
});

// GET "/customers/${customerId}" : serve customer info based on id
app.get("/customers/:customerId", async (req, res) => {
  const { customerId } = req.params;
  const query =
    "SELECT name, address, city, country FROM customers WHERE id = $1";

  const { rows } = await pool.query(query, [customerId]);

  rows.length
    ? res.json(rows)
    : res.status(400).json({
        success: false,
        message: `No customer with id of ${customerId} was found!`,
      });
});

// POST "/customers" : add a new customer to the database. Name is the only thing that can't be null
app.post("/customers", async (req, res) => {
  const { name, address, city, country } = req.body;
  const query =
    "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4) RETURNING *;";

  if (!name)
    return res
      .status(400)
      .json({ success: false, message: "Name cannot be null" });

  const { rows } = await pool.query(query, [name, address, city, country]);

  res.json(rows);
});

// POST "/customers/${customerId}/orders" : adds a new order to the database
app.post("/customers/:customerId/orders", async (req, res) => {
  const { customerId } = req.params;
  const { order_date } = req.body;

  // query for getting the last 3 numbers of the most recently added order from the orders table
  const lastOrderReference =
    "SELECT substring(order_reference, 4) as number FROM orders ORDER BY order_reference DESC LIMIT(1);";

  const result = await pool.query(lastOrderReference);
  const number = result.rows[0].number;
  const splitNumber = number.split("").map((string) => parseInt(string));

  // incrementing the number by 1
  splitNumber[2]++;
  // if last digit of the number = 10 that means the middle number has to have plus one
  if (splitNumber[2] >= 10) {
    splitNumber[2] = 0;
    splitNumber[1]++;
    // if the middle number = 10 then the first number has to have plus one
    if (splitNumber[1] >= 10) {
      splitNumber[1] = 0;
      splitNumber[0]++;
    }
  }

  // reconstructing the order reference string
  const order_reference = `ORD${splitNumber.join("")}`;

  const query =
    "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3) RETURNING *;";

  if (!order_date)
    return res
      .status(400)
      .json({ success: false, message: "Some data is not valid" });

  const { rows } = await pool.query(query, [
    order_date,
    order_reference,
    customerId,
  ]);

  res.json(rows);
});

// DELETE "/customers/${customerId}" : delete a customer from the database based on id
app.delete("/customers/:customerId", async (req, res) => {
  const { customerId } = req.params;
  const ordersQuery = "DELETE FROM orders WHERE customer_id = $1;";
  const customersQuery = "DELETE FROM customers WHERE id = $1 RETURNING *;";

  const { rows } = await pool
    .query(ordersQuery, [customerId])
    .then(() => pool.query(customersQuery, [customerId]));

  rows.length === 0
    ? res.status(400).json({
        success: false,
        message: `Customer with ID of ${customerId} was not found`,
      })
    : res.json({ deleted_row: rows });
});

// GET "/suppliers" : serve all supplier info
app.get("/suppliers", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT supplier_name, country FROM suppliers;"
  );

  res.json(rows);
});

// GET "/products" : serve all product with price and suppliers
app.get("/products", async (req, res) => {
  let query = `SELECT products.product_name, suppliers.supplier_name, product_availability.unit_price
FROM products 
INNER JOIN product_availability ON product_availability.prod_id = products.id
INNER JOIN suppliers ON suppliers.id = product_availability.supp_id`;

  const { name } = req.query;
  const params = [];

  if (name) {
    query = query.concat(" ", "WHERE LOWER(products.product_name) LIKE $1;");
    params.push(`%${name.toLowerCase()}%`);
  }

  const { rows } = await pool.query(query, params);

  res.json(rows);
});

// POST "/products" : add a new product to the database
app.post("/products", async (req, res) => {
  const { product_name } = req.body;
  const query = "INSERT INTO products (product_name) VALUES ($1) RETURNING *;";

  if (!product_name)
    return res
      .status(400)
      .json({ success: false, message: "product_name is empty!" });

  const { rows } = await pool.query(query, [product_name]);

  res.json(rows);
});

// POST "/availability" : add a new product_availability row to the database
app.post("/availability", async (req, res) => {
  const { prod_id, supp_id, unit_price } = req.body;
  const query =
    "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3) RETURNING *;";

  if (!prod_id || !supp_id || !unit_price)
    return res.status(400).json({
      success: false,
      message: `Some data is not valid, please check again`,
    });

  const { rows } = await pool.query(query, [prod_id, supp_id, unit_price]);

  res.json(rows);
});

// DELETE "/orders/${orderId}" : delete an order based on id
app.delete("/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const query = "DELETE FROM orders WHERE id = $1 RETURNING *";

  const { rows } = await pool.query(query, [orderId]);

  rows.length === 0
    ? res.status(400).json({
        success: false,
        message: `No order with id of ${orderId} was found`,
      })
    : res.json({ deleted_order: rows });
});

app.listen(3000, () =>
  console.log("Server is running and listening on port 3000!")
);
