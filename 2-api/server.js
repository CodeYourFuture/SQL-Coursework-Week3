const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;
app.use(bodyParser.json());
const pool = new Pool({
  user: "ali",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "111111",
  port: 5432,
});

app.get("/", (req, res) => res.send("EXPRESS Server is running now!"));
app.get("/customers", (req, res) => {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((er) => {
      console.log(er);
      res.status(500).json(er);
    });
});
app.get("/suppliers", (req, res) => {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((er) => {
      console.log(er);
      res.status(500).send(er);
    });
});
app.get("/products", async (req, res) => {
  let nameQuery = req.query.name || Object.keys(req.query)[0];

  if (nameQuery) {
    const query =
      "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM product_availability INNER JOIN suppliers on suppliers.id = product_availability.supp_id INNER JOIN products on products.id = product_availability.prod_id WHERE product_name = $1";
    const result = await pool.query(query, [nameQuery]);
    res.send(result.rows);
  } else {
    const query =
      "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM product_availability INNER JOIN suppliers on suppliers.id = product_availability.supp_id INNER JOIN products on products.id = product_availability.prod_id";
    const result = await pool.query(query);
    res.send(result.rows);
  }
});
app.get("/customers/:cusId", async (req, res) => {
  const id = req.params.cusId;
  const query = "SELECT * FROM customers WHERE id = $1";
  const result = await pool.query(query, [id]);
  res.json(result.rows);
});
app.post("/customers", async (req, res) => {
  const { name, address, city, country } = req.body;
  const query =
    "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
  try {
    await pool.query(query, [name, address, city, country]);
    res.status(200).send("User created! :))");
  } catch (error) {
    console.log(error);
    res.status(500).send("Couldn't create the user :(((");
  }
});
app.post("/products", (req, res) => {
  const { productName } = req.body;
  const query = "INSERT INTO products (product_name) VALUES ($1)";
  if (productName) {
    pool.query(query, [productName]);
    res.status(200).send("New product created! :)");
  } else {
    res.status(404).send("Couldn't create the new product");
  }
});
app.post("/availability", async (req, res) => {
  const { price, supId, prodId } = req.body;
  const checkProId = "SELECT EXISTS (SELECT * FROM products WHERE id = $1)";
  const checkSupId = "SELECT EXISTS (SELECT * FROM suppliers WHERE id = $1)";
  const query =
    "INSERT INTO product_availability (unit_price, supp_id, prod_id) VALUES ($1, $2, $3)";
  const proCheck = await pool.query(checkProId, [prodId]);
  const supCheck = await pool.query(checkSupId, [supId]);
  if (proCheck.rows[0].exists && supCheck.rows[0].exists && price > 0) {
    const result = await pool.query(query, [price, supId, prodId]);
    res.status(200).send("new availability inserted!");
  } else {
    res.status(400).send("supp_id or prod_id doesn't exist! :((");
  }
});
app.post("/customers/:customerId/orders", async (req, res) => {
  const id = req.params.customerId;
  const { date, ref } = req.body;
  const checkUserQuery =
    "SELECT EXISTS (SELECT * FROM customers INNER JOIN orders ON customers.id = orders.customer_id WHERE customers.id = $1)";
  const orderQuery =
    "INSERT INTO orders (order_reference, order_date,customer_id) VALUES ($1, $2, $3)";
  const userExist = await pool.query(checkUserQuery, [id]);
  if (userExist.rows[0].exists && date && ref) {
    const result = await pool.query(orderQuery, [ref, date, id]);
    res.status(200).send("Order created! :))");
  } else {
    res.status(400).send("Couldn't create the order! :(((");
  }
});

app.put("/customers/:customerId", async (req, res) => {
  const { name, address, city, country } = req.body;
  const id = req.params.customerId;
  const checkUserQuery =
    "SELECT EXISTS (SELECT * FROM customers WHERE id = $1)";
  const editQuery =
    "UPDATE customers SET name = $1, address = $2, city = $3, country = $4 WHERE id = $5";
  const userExist = await pool.query(checkUserQuery, [id]);
  if (userExist.rows[0].exists) {
    if (name && address && city && country) {
      await pool.query(editQuery, [name, address, city, country, id]);
      res.status(200).send("User editted! :))");
    }
  } else {
    res.status(400).send("User not exist! :(");
  }
});
app.delete("/orders/:orderId", async (req, res) => {
  const id = req.params.orderId;
  const checkOrderQuery = "SELECT EXISTS (SELECT * FROM orders WHERE id = $1)";
  const checkItemsQuery =
    "SELECT EXISTS (SELECT * FROM order_items WHERE order_id = $1)";
  const deleteItemQuery = "DELETE FROM order_items WHERE order_id = $1";
  const deleteOrderQuery = "DELETE FROM orders WHERE id = $1";

  const checkOrder = await pool.query(checkOrderQuery, [id]);
  const checkItem = await pool.query(checkItemsQuery, [id]);
  if (checkItem.rows[0].exists) {
    await pool.query(deleteItemQuery, [id]);
    await pool.query(deleteOrderQuery, [id]);
    res.status(200).send("Order + Items deleted :))");
  } else if (!checkItem.rows[0].exists && checkOrder.rows[0].exists) {
    await pool.query(deleteOrderQuery, [id]);
    res.status(200).send("Only order deleted. :) There wasn't any items! :(");
  } else {
    res.status(404).send("Nothing found! :((");
  }
});
app.delete("/customers/:customerId", async (req, res) => {
  const id = req.params.customerId;
  const checkCustomerQuery =
    "SELECT EXISTS (SELECT * FROM customers WHERE id = $1)";
  const checkOrderQuery =
    "SELECT EXISTS (SELECT * FROM orders WHERE orders.customer_id = $1)";
  const deleteCustomerQuery = "DELETE FROM customers where id = $1";
  const checkCustomer = await pool.query(checkCustomerQuery, [id]);
  const checkOrder = await pool.query(checkOrderQuery, [id]);
  if (checkCustomer.rows[0].exists && !checkOrder.rows[0].exists) {
    await pool.query(deleteCustomerQuery, [id]);

    res.status(200).send("Customer deleted! :)");
  } else {
    res.status(404).send("Customer has some orders. Delete orders first.");
  }
});
app.get("/customers/:customerId/orders", async (req, res) => {
  const id = req.params.customerId;
  const checkCustomerQuery =
    "SELECT EXISTS (SELECT * FROM customers WHERE id = $1)";
  const checkCustomer = await pool.query(checkCustomerQuery, [id]);
  const query =
    "SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity FROM product_availability INNER JOIN products ON product_availability.prod_id = products.id INNER JOIN suppliers ON suppliers.id = product_availability.supp_id INNER JOIN order_items ON order_items.product_id = products.id INNER JOIN orders ON orders.id = order_items.order_id INNER JOIN customers ON customers.id = orders.customer_id WHERE customers.id = $1";
  if (checkCustomer.rows[0].exists) {
    const result = await pool.query(query, [id]);
    res.status(200).json(result.rows);
  } else {
    res.status(404).send("Customer didn't found :((");
  }
});
app.listen(PORT, () => console.log(`App is running on ${PORT}`));
