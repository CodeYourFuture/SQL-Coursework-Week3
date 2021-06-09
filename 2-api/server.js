require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const { resourceLimits } = require("worker_threads");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "patryk22",
  port: 5432,
});

/* Queries to DB */
let customersQ = "SELECT * from customers";
let supQ = "SELECT * from suppliers";
// const prodQ =
//   "SELECT product_name, unit_price, supplier_name from products INNER JOIN product_availability on products.id = product_availability.prod_id INNER JOIN suppliers on product_availability.supp_id = suppliers.id;";

app.get("/customers", async (req, res) => {
  try {
    const customers = await pool.query(customersQ);
    res.status(200).json({
      status: "success",
      data: customers.rows,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/customers", async (req, res) => {
  const { name, address, city, country } = req.body;
  const queryConstructor =
    "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
  try {
    const customers = await pool.query(queryConstructor, [
      name,
      address,
      city,
      country,
    ]);
    res.status(200).json({
      status: "success",
      data: customers.rows,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.delete("/customers/:customerId", async (req, res) => {
  try {
    let { customerId } = req.params;
    console.log(customerId);
    customerId = customerId.trim();
    if (customerId.length === 0 || !customerId)
      throw new Error("I need Correct ID to proceed that deletion action");

    const products = await pool.query(
      "SELECT * FROM orders WHERE customer_id = $1;",
      [customerId]
    );
    if (!products.rowCount === 0)
      throw new Error("Delete first the orders, then client");

    const queryConstructor = "DELETE FROM customers WHERE id = $1";
    console.log("I got here");
    const customers = await pool.query(queryConstructor, [customerId]);
    res.status(200).json({
      data: [],
      status: "success",
      check: customers,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/customers/:customerId/orders", async (req, res) => {
  try {
    const { customerId } = req.params;
    const customer = await pool.query(
      "SELECT * FROM orders WHERE customer_id = $1;",
      [customerId]
    );
    if (customer.rowCount === 0) throw new Error("No customer with that ID");

    const customers = await pool.query(
      `SELECT orders.order_reference, orders.order_date , products.product_name , product_availability.unit_price , suppliers.supplier_name, order_items.quantity 
      FROM order_items      
      INNER JOIN orders  ON orders.id = order_items.order_id 
      INNER JOIN customers  ON customers.id = orders.customer_id 
      INNER JOIN products  ON products.id = order_items.product_id            
      INNER JOIN product_availability  ON product_availability.prod_id = order_items.product_id              
      INNER JOIN suppliers  ON suppliers.id = order_items.supplier_id  
      WHERE customers.id = 1;`
    );
    res.status(200).json({
      status: "success",
      data: customers.rows,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/customers/:customerId/orders", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { orderReference } = req.body;

    console.log(customerId);
    let customer = await pool.query(
      "SELECT * FROM orders WHERE customer_id = $1;",
      [customerId]
    );
    if (customer.rowCount === 0) throw new Error("No customer with that ID");

    const dataOfTransaction = new Date().toISOString();
    const customers = await pool.query(
      "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)",
      [dataOfTransaction, orderReference, customerId]
    );

    res.status(200).json({
      status: "success",
      msg: "Success - here should be new, just created order - placeholder",
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put("/customers/:customerId", async (req, res) => {
  // const { name, address, city, country } = req.body;
  // const queryConstructor =
  //   "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
  try {
    const customerId = req.params.customerId;
    const { name, address, city, country } = req.body;
    if (!name || !address || !city || !country)
      throw new Error("Needed data to proceed update");
    // if exist
    const customer = await pool.query("SELECT * FROM customers WHERE id=$1", [
      customerId,
    ]);
    if (customer.rowCount === 0) throw new Error("No customer with that ID");

    //  `UPDATE customers SET ${columnUpdate} WHERE id = $${  keys.length + 1  }`;4
    // const arrayOfValues = [];
    const objectOfupdates = {};
    if (name) objectOfupdates.name = name;

    if (address) objectOfupdates.address = address;

    if (city) objectOfupdates.city = city;

    if (country) objectOfupdates.country = country;

    const arrayToQuery = [];
    const arrayOfValues = [];
    for (const [key, value] of Object.entries(objectOfupdates)) {
      arrayOfValues.push(value);
      arrayToQuery.push(`${key}=$${arrayOfValues.length}`);
    }

    const query = `UPDATE customers SET ${arrayToQuery.join(", ")} `;
    const queryEndPart = `WHERE id = $${arrayToQuery.length + 1}`;
    const fullQuery = query + queryEndPart;

    const customers = await pool.query(fullQuery, [
      ...arrayOfValues,
      customerId,
    ]);
    res.status(200).json({
      status: "success",
      data: customers.rows,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/customers/:customerId", async (req, res) => {
  const reqCustomerId = req.params.customerId;
  const reqCusByID = customersQ + " WHERE id=$1";
  console.log(customersQ);

  try {
    const customers = await pool.query(reqCusByID, [reqCustomerId]);
    res.status(200).json({
      status: "success",
      data: customers.rows,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/suppliers", async (req, res) => {
  try {
    const suppliers = await pool.query(supQ);
    res.status(200).json({
      status: "success",
      data: suppliers.rows,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// - Update the previous GET endpoint `/products` to filter the list of products by name using a query parameter,
// for example `/products?name=Cup`. This endpoint should still work even if you don't use the `name` query parameter!
let prodQ =
  "SELECT product_name, unit_price, supplier_name from products INNER JOIN product_availability on products.id = product_availability.prod_id INNER JOIN suppliers on product_availability.supp_id = suppliers.id";

app.get("/products", async (req, res) => {
  const queryParam = req.query.name;

  let queryArray;
  if (req.query.name) {
    prodQ += queryArray = [
      prodQ + " WHERE product_name ILIKE $1;",
      [`%${queryParam}%`],
    ];
  }
  if (!req.query.name) {
    queryArray = [prodQ + ";"];
  }

  try {
    const products = await pool.query(...queryArray);
    res.status(200).json({
      status: "success",
      data: products.rows,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/products", async (req, res) => {
  const { product_name } = req.body;
  const queryConstructor = "INSERT INTO products (product_name) VALUES ($1)";
  try {
    const customers = await pool.query(queryConstructor, [product_name]);
    res.status(200).json({
      status: "success",
      data: customers.rows,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/availability", async (req, res) => {
  try {
    const { supplierId, unitPrice, productId } = req.body;

    // basic validation without checking if input is a number
    if (!supplierId || !productId || !unitPrice || unitPrice < 0) {
      return res.status(400).json({
        status: "error",
        msg: "check provided supplier id and price - must be more than 0",
      });
    }
    // guard requests
    const product = await pool.query(`SELECT * FROM products WHERE id = $1;`, [
      productId,
    ]);
    if (product.rowCount === 0)
      throw new Error("There is no product with that id");
    const supplier = await pool.query(
      `SELECT * FROM suppliers WHERE id = $1;`,
      [supplierId]
    );
    if (product.supplier === 0)
      throw new Error("There is no supplier with that id");

    const customers = await pool.query(
      `INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3);`,
      [productId, supplierId, unitPrice]
    );
    res.status(200).json({
      status: "success",
      data: customers.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: error.message });
  }
});

app.delete("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    //deleting items
    await pool.query("DELETE FROM order_items WHERE order_id = $1;", [orderId]);
    await pool.query("DELETE FROM orders WHERE id = $1", [orderId]);

    res.status(200).json({
      status: "success",
      data: [],
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(3000, function () {
  console.log("Server is listening on port 3000.");
});
