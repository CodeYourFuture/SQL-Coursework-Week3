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

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
