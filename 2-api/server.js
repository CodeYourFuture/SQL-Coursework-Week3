const { application } = require("express");
const express = require("express");
const app = express();
const { Pool } = require("pg");

app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.get("/", (req, res) => {
  res.send("cyf-ecommerce-api is ready at accept api requests");
});

app.get("/customers/", async (req, res) => {
  try {
    const customers = await pool.query("SELECT * FROM customers");
    return res.json(customers.rows);
  } catch (e) {
    console.log(e);
    return res.status(400).json({ msg: "Couldn't get customers" });
  }
});

app.get("/customers/:id", async (req, res) => {
  const requestedID = Number(req.params.id);
  try {
    const requestedCustomer = await pool.query(
      "SELECT * FROM customers WHERE id = $1",
      [requestedID]
    );
    return res.json(requestedCustomer.rows);
  } catch (e) {
    console.log(e);
    return res.json({
      msg: `Customer with requested Id = ${requestedID} not found`,
    });
  }
});

app.get("/suppliers", async (req, res) => {
  try {
    const suppliers = await pool.query("SELECT * FROM suppliers");
    return res.json(suppliers.rows);
  } catch (e) {
    console.log(e);
    return res.json({ msg: "Couldn't return suppliers" });
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await pool.query(
      "SELECT product_name, unit_price, supplier_name FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers ON suppliers.id = product_availability.supp_id"
    );
    return res.json(products.rows);
  } catch (e) {
    console.log(e);
    return res.json({ msg: "Couldn't return products" });
  }
});

app.post("/customers", async (req, res) => {
  const { name, address, city, country } = req.body;
  const newCustomer = {
    name: name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.substr(1))
      .join(" "),
    address,
    city: city.charAt(0).toUpperCase() + city.substr(1),
    country: country.charAt(0).toUpperCase() + country.substr(1),
  };
  const isEmptyKey = Object.values(newCustomer).some(
    (x) => x === null || x === ""
  );
  const customerAlreadyExist = await pool.query(
    "SELECT * FROM customers WHERE name = $1",
    [newCustomer.name]
  );
  const errorMsg = {};
  if (isEmptyKey) {
    errorMsg.msgMissingValue = "Some information is missing";
  }
  if (customerAlreadyExist.rowCount) {
    errorMsg.customerAlreadyExist = `Customer with name = ${newCustomer.name} already exist`;
  }
  if (Object.keys(errorMsg).length) {
    return res.status(400).json(errorMsg);
  }
  try {
    await pool.query(
      "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)",
      [
        newCustomer.name,
        newCustomer.address,
        newCustomer.city,
        newCustomer.country,
      ]
    );
    return res.json({
      msg: `You have added new customer with name: ${newCustomer.name}.`,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({ msg: "Couldn't post customer" });
  }
});

app.post("/products", async (req, res) => {
  const { productName } = req.body;
  const newProduct = {
    productName: productName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.substr(1))
      .join(" "),
  };
  const isEmptyKey = Object.values(newProduct).some(
    (x) => x === null || x === ""
  );
  const productAlreadyExist = await pool.query(
    "SELECT * FROM products WHERE LOWER(product_name) = LOWER($1)",
    [newProduct.productName]
  );
  const errorMsg = {};
  if (isEmptyKey) {
    errorMsg.msgMissingValue = "Some information is missing";
  }
  if (productAlreadyExist.rowCount) {
    errorMsg.customerAlreadyExist = `Product with name = ${newProduct.productName} already exist`;
  }
  if (Object.keys(errorMsg).length) {
    return res.status(400).json(errorMsg);
  }
  try {
    await pool.query("INSERT INTO products (product_name) VALUES ($1)", [
      newProduct.productName,
    ]);
    return res.json({
      msg: `You have added new product with name: ${newProduct.productName}.`,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({ msg: "Couldn't add product" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
