const express = require("express");
const pool = require("./dbConnection");

const app = express();

app.use(express.json());

// Get All customers End Point
app.get("/customers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM customers");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get customer by ID API end point

app.get("/customers/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const query = "SELECT * FROM customers WHERE id = $1";
    const result = await pool.query(query, [customerId]);
    if (result.rowCount === 0) {
      res
        .status(404)
        .json({ error: `No customer with ID ${customerId} found` });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

//Get All Products or a specific product name End Point

app.get("/products", async (req, res) => {
  try {
    const { name } = req.query;
    let query = `
        SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name
        FROM products
        JOIN product_availability ON products.id = product_availability.prod_id
        JOIN suppliers ON suppliers.id = product_availability.supp_id
        WHERE ($1::text IS NULL OR products.product_name ILIKE $1)
        `;
    const values = [name ? `%${name}%` : null];
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

// POST customer API End point
app.post("/customers", async (req, res) => {
  try {
    const { name, address, city, country } = req.body;
    const query = `
        INSERT INTO customers (name, address, city, country)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
    const result = await pool.query(query, [name, address, city, country]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

// POST product API End point
app.post("/products", async (req, res) => {
  try {
    const { product_name } = req.body;
    const query = `
        INSERT INTO products (product_name)
        VALUES ($1)
        RETURNING *
      `;
    const result = await pool.query(query, [product_name]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

//POST Customer order End point

app.post("/customers/:customerId/orders", async (req, res) => {
  const customerId = req.params.customerId;
  const { order_date, order_reference } = req.body;

  try {
    // Check if customer exists
    const customer = await pool.query("SELECT * FROM customers WHERE id = $1", [
      customerId,
    ]);
    if (customer.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }

    // Insert new order
    const query = `
        INSERT INTO orders (order_date, order_reference, customer_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
    const result = await pool.query(query, [
      order_date,
      order_reference,
      customerId,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

// PUT API end point to update Customer Details

app.put("/customers/:customerId", async (req, res) => {
  const customerId = req.params.customerId;
  const { name, address, city, country } = req.body;

  try {
    // Check if customer exists
    const customer = await pool.query("SELECT * FROM customers WHERE id = $1", [
      customerId,
    ]);
    if (customer.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }

    // Update customer
    const query = `
        UPDATE customers
        SET name = $1, address = $2, city = $3, country = $4
        WHERE id = $5
        RETURNING *
      `;
    const result = await pool.query(query, [
      name,
      address,
      city,
      country,
      customerId,
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

// DELETE API end point to delete the order and its details

app.delete("/orders/:orderId", async (req, res) => {
  const orderId = req.params.orderId;
  try {
    // Get order items associated with the order
    const orderItems = await pool.query(
      "SELECT * FROM order_items WHERE order_id = $1",
      [orderId]
    );
    const orderItemIds = orderItems.rows.map((item) => item.id);

    // Delete the order and associated order items in a transaction
    await pool.query("BEGIN");
    await pool.query("DELETE FROM order_items WHERE id = ANY($1)", [
      orderItemIds,
    ]);
    await pool.query("DELETE FROM orders WHERE id = $1", [orderId]);
    await pool.query("COMMIT");

    res.status(200).json({
      message: "Order and associated order items deleted successfully.",
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

// DELETE API end point to delete customers without orders

app.delete("/customers/:customerId", async (req, res) => {
  const customerId = req.params.customerId;
  try {
    // Check if customer has associated orders
    const orders = await pool.query(
      "SELECT * FROM orders WHERE customer_id = $1",
      [customerId]
    );
    if (orders.rows.length > 0) {
      return res.status(400).json({
        error: "Customer has associated orders and cannot be deleted.",
      });
    }

    // Delete the customer
    await pool.query("DELETE FROM customers WHERE id = $1", [customerId]);

    res.status(200).json({ message: "Customer deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

// GET API point to send customer order information

app.get("/customers/:customerId/orders", async (req, res) => {
  const customerId = req.params.customerId;
  try {
    const orders = await pool.query(
      "SELECT * FROM orders WHERE customer_id = $1",
      [customerId]
    );
    const result = [];
    for (const order of orders.rows) {
      const orderItem = await pool.query(
        `SELECT oi.order_id, oi.quantity, pa.unit_price, p.product_name, s.supplier_name 
        FROM order_items oi
        JOIN product_availability pa ON oi.product_id = pa.prod_id AND oi.supplier_id = pa.supp_id
        JOIN products p ON oi.product_id = p.id
        JOIN suppliers s ON oi.supplier_id = s.id
        WHERE oi.order_id = $1`,
        [order.id]
      );
      result.push({
        order_reference: order.order_reference,
        order_date: order.order_date,
        items: orderItem.rows,
      });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
