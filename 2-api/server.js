const express = require("express");
const pool = require("./dbConnection");

const app = express();

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

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
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
