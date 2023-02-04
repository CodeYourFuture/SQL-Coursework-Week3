const express = require("express");
const app = express();
const { Pool } = require("pg");
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.use(express.json());

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});

// GET all customers
app.get("/customers", async function (req, res) {
  try {
    let result = await pool.query("SELECT * FROM customers");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// GET customer by id
app.get("/customers/:customerId", async function (req, res) {
  try {
    const customerId = req.params.customerId;

    let result = await pool.query("SELECT * FROM customers WHERE id=$1", [
      customerId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// GET all suppliers
app.get("/suppliers", async function (req, res) {
  try {
    let result = await pool.query("SELECT * FROM suppliers");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// GET all products
app.get("/products", async function (req, res) {
  try {
    let query =
      "SELECT p.product_name , pa.unit_price , s.supplier_name FROM products p INNER JOIN product_availability pa ON (p.id = pa.prod_id) INNER JOIN suppliers s ON (s.id = pa.supp_id)";
    let productName = req.query.name;
    let params = [];
    if (productName) {
      query = `SELECT p.product_name , pa.unit_price , s.supplier_name FROM products p INNER JOIN product_availability pa ON (p.id = pa.prod_id) INNER JOIN suppliers s ON (s.id = pa.supp_id) WHERE p.product_name LIKE $1`;
      params.push(`%${productName}%`);
    }
    let result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// POST new customer
app.post("/customers", async function (req, res) {
  try {
    const newCustomerName = req.body.name;
    const newCustomerAddress = req.body.address;
    const newCustomerCity = req.body.city;
    const newCustomerCountry = req.body.country;

    let result = await pool.query("SELECT * FROM customers WHERE name=$1", [
      newCustomerName,
    ]);

    if (result.rows.length > 0) {
      return res
        .status(400)
        .send("A customer with the same name already exists!");
    } else {
      const query =
        "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
      await pool.query(query, [
        newCustomerName,
        newCustomerAddress,
        newCustomerCity,
        newCustomerCountry,
      ]);
      res.send(`New customer added!`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// POST new product
app.post("/products", async function (req, res) {
  try {
    const newProductName = req.body.product_name;
    let result = await pool.query(
      "SELECT * FROM products WHERE product_name=$1",
      [newProductName]
    );
    if (result.rows.length > 0) {
      return res
        .status(400)
        .send("A product with the same name already exists!");
    } else {
      const query = "INSERT INTO products (product_name) VALUES ($1)";
      await pool.query(query, [newProductName]);
      res.send(`New product added!`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// POST new product_availability
app.post("/availability", async function (req, res) {
  try {
    const newProductId = req.body.prod_id;
    const newSupplierId = req.body.supp_id;
    const newUnitPrice = req.body.unit_price;

    let result1 = await pool.query("SELECT * FROM products WHERE id=$1", [
      newProductId,
    ]);
    let result2 = await pool.query("SELECT * FROM suppliers WHERE id=$1", [
      newSupplierId,
    ]);
    if (!result1.rows.length) {
      return res.status(400).send("No matching product!");
    }
    if (!result2.rows.length) {
      return res.status(400).send("No matching supplier!");
    }
    if (Math.sign(newUnitPrice) === 1) {
      const query =
        "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";
      await pool.query(query, [newProductId, newSupplierId, newUnitPrice]);
      res.send(`New product_availability added!`);
    } else {
      return res
        .status(400)
        .send("The price MUST be a positive no null number");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// POST new order
app.post("/customers/:customerId/orders", async function (req, res) {
  try {
    const newOrderDate = req.body.order_date;
    const newCustomerId = req.body.customer_id;

    let result1 = await pool.query("SELECT * FROM customers WHERE id=$1", [
      newCustomerId,
    ]);

    let result2 = await pool.query(
      "SELECT * FROM orders ORDER BY order_reference DESC LIMIT 1"
    );
    const newOrderRef =
      "ORD" +
      (
        parseInt(result2.rows[0].order_reference.substring(3)) +
        1 +
        ""
      ).padStart(3, "0");

    if (!result1.rows.length) {
      return res.status(400).send("No matching customer!");
    }
    if (newOrderDate instanceof Date) {
      return res.status(400).send("Invalid date!");
    }

    const query =
      "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
    await pool.query(query, [newOrderDate, newOrderRef, newCustomerId]);
    res.send(`New order added!`);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});
