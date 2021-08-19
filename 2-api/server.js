const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5002;

const pool = new Pool({
  user: process.env.WORKUSER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.DBPORT,
});

// Week 2
// 1. GET "/customers"
app.get("/customers", async (req, res) => {
  const result = await pool.query("SELECT * FROM customers");
  res.json(result.rows);
});

// 2. GET "/suppliers"
app.get("/suppliers", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM suppliers");
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Week 3
// 1. GET "/products"
app.get("/products", async (req, res) => {
    try {
      const prodNameQuery = req.query.name;
      let query =
        "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers ON suppliers.id = product_availability.supp_id";
  
      if (prodNameQuery) {
        query = `SELECT * FROM products WHERE product_name LIKE '%${prodNameQuery}%'`;
      }
  
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });
  
// 2. GET single customer by id "/customers/:customerId"
app.get("/customers/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await pool.query("SELECT * FROM customers WHERE id = $1", [
      customerId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
  }
});

// 3. CREATE new customer
app.post("/customers", async (req, res) => {
  try {
    const { name, address, city, country } = req.body;
    const query =
      "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
    await pool.query(query, [name, address, city, country]);
    res.json("Customer is Created!");
  } catch (error) {
    console.error(error.message);
  }
});

// 4. CREATE new product "/products"
app.post("/products", async (req, res) => {
    try {
      const { product_name } = req.body;
      await pool.query("INSERT INTO products (product_name) VALUES ($1)", [
        product_name,
      ]);
      res.send("New Product Created!");
    } catch (error) {
      console.error(error.message);
    }
  });

  // 5. CREATE prod availability with price and supp id "/availability"
app.post("/availability", async (req, res) => {
    try {
      const { prod_id, supp_id, unit_price } = req.body;
  
      if (!Number.isInteger(unit_price) || unit_price <= 0) {
        return res.status(400).send("The price should be a positive number");
      }
      const prodResult = await pool.query(
        "SELECT * FROM products WHERE id = $1",
        [prod_id]
      );
      const supResult = await pool.query(
        "SELECT * FROM suppliers WHERE id = $1",
        [supp_id]
      );
      if (prodResult.rows.length <= 0 || supResult.rows.length <= 0) {
        return res.status(400).send("Product does not exist");
      } else {
        await pool.query(
          "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)",
          [prod_id, supp_id, unit_price]
        );
      }
    } catch (error) {
      console.error(error.message);
    }
  });
  

// 6. CREATE new order "/customers/:customerId/orders"
app.post("/customers/:customerId/orders", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { order_date, order_reference, customer_id } = req.body;

    const result = await pool.query("SELECT * FROM customers WHERE id = $1", [
      customerId,
    ]);
    if (result.rows.length <= 0) {
      return res
        .status(400)
        .send(`Customer with id: ${customerId} does not exist!`);
    } else {
      await pool.query(
        "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)",
        [order_date, order_reference, customer_id]
      );
      res.send("New Order Created!");
    }
  } catch (error) {
    console.error(error.message);
  }
});

// 7. UPDATE customer by id "/customers/:customerId"
app.put("/customers/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { name, address, city, country } = req.body;
    const result = await pool.query("SELECT * FROM customers WHERE id = $1", [
      customerId,
    ]);
    if (result.rows.length <= 0) {
      return res
        .status(400)
        .send(`Customer with id: ${customerId} does not exist!`);
    } else {
      await pool.query(
        "UPDATE customers SET name = $1, address = $2, city = $3, country = $4 WHERE id = $5",
        [name, address, city, country, customerId]
      );
    }
    res.send("Customer Updated!");
  } catch (error) {
    console.error(error.message);
  }
});

// 8. DELETE orders "/orders/:orderId"
app.delete("/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const result = await pool.query("SELECT * FROM orders WHERE id = $1", [
        orderId,
      ]);
      if (result.rows.length <= 0) {
        return res.status(400).send(`Order with id: ${orderId} does not exist!`);
      } else {
        await pool.query("DELETE FROM orders WHERE id = $1", [orderId]);
      }
      res.send("Order Deleted");
    } catch (error) {
      console.error(error.message);
    }
  });

// 9. DELETE customer with no orders "/customers/:customerId"
app.delete("/customers/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const hasOrder = await pool.query(
      "SELECT * FROM orders WHERE customer_id = $1",
      [customerId]
    );
    if (hasOrder.rows.length <= 0) {
      await pool.query("DELETE FROM customers WHERE id = $1", [customerId]);
      res.send("Customer Deleted!");
    } else {
      res.send(`Customer with id: ${customerId} has an order`);
    }
  } catch (error) {
    console.error(error.message);
  }
});

// 10. GET customers with order info "/customers/:customerId/orders"
app.get("/customers/:customerId/orders", async (req, res) => {
  try {
    const { customerId } = req.params;

    const query = `SELECT customers.name, orders.order_reference, orders.order_date, products.product_name,product_availability.unit_price, suppliers.supplier_name, order_items.quantity FROM customers INNER JOIN orders ON customers.id = orders.customer_id INNER JOIN order_items ON orders.id = order_items.order_id INNER JOIN products ON order_items.product_id = products.id INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id WHERE customers.id = ${customerId}`;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
  }
});

app.listen(PORT, () => console.log(`Server started at port: ${PORT}`));
