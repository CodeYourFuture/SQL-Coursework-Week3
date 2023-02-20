const express = require("express");
const { Pool } = require("pg");
const app = express();

app.use(express.json());

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "rebwar",
  password: "",
  database: "ecommerce",
});

app.get("/products", async (req, res) => {
  const { name } = req.query;
  try {
    if (name) {
      const products = await pool.query(
        `SELECT products.product_name,
        product_availability.unit_price,
        suppliers.supplier_name
        FROM products
        JOIN product_availability
        ON products.id = product_availability.prod_id
        JOIN suppliers
        ON product_availability.supp_id = suppliers.id
        WHERE products.product_name LIKE $1`,
        [name + "%"]
      );
      res.json(products.rows);
    } else {
      const products = await pool.query(
        `
        SELECT products.product_name,
        product_availability.unit_price,
        suppliers.supplier_name
        FROM products
        JOIN product_availability
        ON products.id = product_availability.prod_id
        JOIN suppliers
        ON product_availability.supp_id = suppliers.id
        `
      );
      res.json(products.rows);
    }
  } catch (err) {
    console.error(err.message);
  }
});

//🌧
app.get("/customers", async (req, res) => {
  try {
    const allCustomers = await pool.query("SELECT * FROM customers");
    res.json(allCustomers.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/customers/:customerId", async (req, res) => {
  const { customerId } = req.params;
  try {
    const customer = await pool.query("SELECT * FROM customers WHERE id = $1", [
      customerId,
    ]);
    res.json(customer.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});
//🌧

app.post("/customers", async (req, res) => {
  try {
    const { name, address, city, country } = req.body;
    const newCustomer = await pool.query(
      "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, address, city, country]
    );
    res.json(newCustomer.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/products", async (req, res) => {
  try {
    const { product_name } = req.body;
    const newProduct = await pool.query(
      "INSERT INTO products (product_name) VALUES ($1) RETURNING *",
      [product_name]
    );
    res.json(newProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/availability", async (req, res) => {
  const { prod_id, supp_id, unit_price } = req.body;

  try {
    const product = await pool.query("SELECT * FROM products WHERE id = $1", [
      prod_id,
    ]);
    if (product.rows.length === 0) {
      res.status(400).send("Product not found");
    } else {
      const supplier = await pool.query(
        "SELECT * FROM suppliers WHERE id = $1",
        [supp_id]
      );
      if (supplier.rows.length === 0) {
        res.status(400).send("Supplier not found");
      } else {
        if (unit_price > 0) {
          const newAvailability = await pool.query(
            "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3) RETURNING *",
            [prod_id, supp_id, unit_price]
          );
          res.json(newAvailability.rows[0]);
        } else {
          res.status(400).send("Price must be a positive integer");
        }
      }
    }
  } catch (err) {
    console.error(err.message);
  }
});

//🍉🍉🍉🍉🍉🍉🍉🍉
app.post("/customers/:customerId/orders", async (req, res) => {
  const customerId = req.params.customerId;
  const { order_date, order_reference } = req.body;
  try {
    const customer = await pool.query("SELECT * FROM customers WHERE id = $1", [
      customerId,
    ]);
    if (customer.rows.length === 0) {
      res.status(400).send("Customer not found");
    } else {
      const newOrder = await pool.query(
        "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3) RETURNING *",
        [order_date, order_reference, customerId]
      );
      res.json(newOrder.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
  }
});

app.put("/customers/:customerId", async (req, res) => {
  const customerId = req.params.customerId;
  const { name, address, city, country } = req.body;
  try {
    const customer = await pool.query("SELECT * FROM customers WHERE id = $1", [
      customerId,
    ]);
    if (customer.rows.length === 0) {
      res.status(400).send("Customer not found");
    } else {
      const updatedCustomer = await pool.query(
        "UPDATE customers SET name = $1, address = $2, city = $3, country = $4 WHERE id = $5 RETURNING *",
        [name, address, city, country, customerId]
      );
      res.json(updatedCustomer.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
  }
});

app.delete("/orders/:orderId", async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const order = await pool.query("SELECT * FROM orders WHERE id = $1", [
      orderId,
    ]);
    if (order.rows.length === 0) {
      res.status(400).send("Order not found");
    } else {
      const deletedOrder = await pool.query(
        "DELETE FROM orders WHERE id = $1",
        [orderId]
      );
      res.send("Order deleted");
    }
  } catch (err) {
    console.error(err.message);
  }
});

app.delete("/customers/:customerId", async (req, res) => {
  const customerId = req.params.customerId;
  try {
    const customer = await pool.query("SELECT * FROM customers WHERE id = $1", [
      customerId,
    ]);
    if (customer.rows.length === 0) {
      res.status(400).send("Customer not found");
    } else {
      const order = await pool.query(
        "SELECT * FROM orders WHERE customer_id = $1",
        [customerId]
      );
      if (order.rows.length === 0) {
        const deletedCustomer = await pool.query(
          "DELETE FROM customers WHERE id = $1",
          [customerId]
        );
        res.send("Customer deleted");
      } else {
        res.status(400).send("Customer has orders");
      }
    }
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/customers/:customerId/orders", async (req, res) => {
  const customerId = req.params.customerId;
  try {
    const result = await pool.query(
      `SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity
      FROM orders
      JOIN order_items ON orders.id = order_items.order_id
      JOIN products ON order_items.product_id = products.id
      JOIN product_availability ON order_items.product_id = product_availability.prod_id
      JOIN suppliers ON product_availability.supp_id = suppliers.id
      WHERE orders.customer_id = $1`,
      [customerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.log(error);
  }
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
