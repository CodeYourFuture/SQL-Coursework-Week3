const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const { Pool } = require("pg");
app.use(express.json());

const pool = new Pool({
  user: "Azan",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "azan",
  port: 5432,
});

// GET all the customers from the endpoint '/customers'.
// Task 3. GET a single customer by ID from the endpoint '/customers/:customerId'.

app.get(["/customers", "/customers/:customerId"], (req, res) => {
  const customerId = req.params.customerId;
  if (customerId) {
    pool
      .query("SELECT * FROM customers WHERE id = $1;", [customerId])
      .then((result) => res.json(result.rows))
      .catch((error) => console.error(error));
  } else {
    pool
      .query("SELECT * FROM customers;")
      .then((result) => res.json(result.rows))
      .catch((error) => console.error(error));
  }
});

// Task 11. GET all the orders along with the items in the orders of a specific customer from the endpoint `/customers/:customerId/orders`.

app.get("/customers/:customerId/orders", async (req, res) => {
  const customerId = req.params.customerId;
  const customerIdCheck = await pool.query(
    "SELECT * FROM customers WHERE id = $1;",
    [customerId]
  );

  if (customerIdCheck.rows.length <= 0) {
    res.status(400).send(`Customer with the Id ${customerId} does not exist`);
  }

  const query = `SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity 
  FROM orders 
  INNER JOIN order_items 
  ON order_items.order_id = orders.id 
  INNER JOIN product_availability 
  ON product_availability.prod_id = order_items.product_id
  AND product_availability.supp_id = order_items.supplier_id 
  INNER JOIN suppliers 
  ON suppliers.id = product_availability.supp_id 
  INNER JOIN products 
  ON products.id = product_availability.prod_id 
  WHERE orders.customer_id = $1;`;

  pool
    .query(query, [customerId])
    .then((result) => res.json(result.rows))
    .catch((error) => console.error(error));
});

// Task 4. POST to create a new customer with name, address, city and country from the endpoint `/customers`.

app.post("/customers", (req, res) => {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.city;

  if (!newCustomerName) {
    res.status(400).send("Please enter a valid name.");
  } else if (!newCustomerAddress) {
    res.status(400).send("Please enter a valid address.");
  } else if (!newCustomerCity) {
    res.status(400).send("Please enter a valid City.");
  } else if (!newCustomerCountry) {
    res.status(400).send("Please enter a valid Country.");
  }

  pool
    .query("SELECT * FROM customers WHERE name=$1;", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A customer with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4);";
        pool
          .query(query, [
            newCustomerName,
            newCustomerAddress,
            newCustomerCity,
            newCustomerCountry,
          ])
          .then(() => res.send("Customer Added!"))
          .catch((error) => console.error(error));
      }
    });
});

// Task 7. POST to create a new order (including an order date, and an order reference) for a customer from the endpoint `/customers/:customerId/orders`.

app.post("/customers/:customerId/orders", async (req, res) => {
  const customerId = req.params.customerId;
  const orderDate = req.body.order_date;
  const orderReference = req.body.order_reference;
  const customerIdInput = customerId;
  const customerIdCheck = await pool.query(
    "SELECT * FROM customers WHERE id = $1;",
    [customerId]
  );

  if (customerIdCheck.rows.length <= 0) {
    res.status(400).send(`Customer with the Id ${customerId} does not exist`);
  } else if (!orderDate || !orderReference || !customerIdInput) {
    res.status(400).send("Please provide a valid input in all the fields.");
  }

  const query =
    "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3);";
  pool
    .query(query, [orderDate, orderReference, customerIdInput])
    .then(() => res.send("New order created!"))
    .catch((error) => console.error(error));
});

// Task 8. PUT to update an existing customer (name, address, city and country) from the endpoint `/customers/:customerId`.

app.put("/customers/:customerId", async (req, res) => {
  const customerId = req.params.customerId;
  const { name, address, city, country } = req.body;
  const customerIdCheck = await pool.query(
    "SELECT * FROM customers WHERE id = $1;",
    [customerId]
  );

  if (customerIdCheck.rows.length <= 0) {
    res.status(400).send(`Customer with the Id ${customerId} does not exist`);
  } else if (!name || !address || !city || !country) {
    res.status(400).send("Please provide a valid input in all the fields!");
  }

  const query =
    "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id = $5;";
  pool
    .query(query, [name, address, city, country, customerId])
    .then(res.send("Customer Updated!"))
    .catch((error) => console.error(error));
});

// Task 10. DELETE an existing customer only if this customer doesn't have orders from the endpoint `/customers/:customerId`.

app.delete("/customers/:customerId", async (req, res) => {
  const customerId = req.params.customerId;
  const customerIdCheck = await pool.query(
    "SELECT * FROM customers WHERE id = $1;",
    [customerId]
  );
  const customerOrderCheck = await pool.query(
    "SELECT * FROM orders WHERE customer_id = $1;",
    [customerId]
  );

  if (customerIdCheck.rows.length <= 0) {
    res.status(400).send(`Customer with the Id ${customerId} does not exist!`);
  }
  if (customerOrderCheck.rows.length <= 0) {
    const query = "DELETE FROM customers WHERE id = $1;";
    pool
      .query(query, [customerId])
      .then(res.send("Customer deleted"))
      .catch((error) => console.error(error));
  } else {
    res.status(400).send("Customers that have an order cannot be deleted!");
  }
});

app.get("/suppliers", (req, res) => {
  pool.query("SELECT * FROM suppliers;", (error, result) => {
    if (error) {
      console.log(error);
    }
    res.json(result.rows);
  });
});

// Task 1. GET all the product names along with their prices and supplier names from the endpoint '/products'.
// Task 2. Update this endpoint to filter the list of products by name using a query parameter '/products?name=cup'.

app.get("/products", (req, res) => {
  const productName = req.query.name;
  let query = `SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name 
              FROM products 
              INNER JOIN product_availability 
              ON products.id = product_availability.prod_id 
              INNER JOIN suppliers 
              ON suppliers.id = product_availability.supp_id;`;

  if (productName) {
    pool
      .query(
        `SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name 
              FROM products 
              INNER JOIN product_availability 
              ON products.id = product_availability.prod_id 
              INNER JOIN suppliers 
              ON suppliers.id = product_availability.supp_id
              WHERE LOWER(product_name) LIKE '%${productName.toLowerCase()}%;';`
      )
      .then((result) => res.json(result.rows))
      .catch((error) => console.error(error));
  } else {
    pool
      .query(query)
      .then((result) => res.json(result.rows))
      .catch((error) => console.error(error));
  }
});

// Task 5. POST to create a new product from the endpoint `/products`.

app.post("/products", (req, res) => {
  const newProductName = req.body.name;

  if (!newProductName) {
    res.status(400).send("Please enter a valid product name.");
  }

  pool
    .query("SELECT * FROM products WHERE product_name=$1;", [newProductName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("Product with the same name already exists!");
      } else {
        const query = "INSERT INTO products (product_name) VALUES ($1);";
        pool
          .query(query, [newProductName])
          .then(() => res.send("Product Added!"))
          .catch((error) => console.error(error));
      }
    });
});

// Task 6. POST to create a new product availability (with a price and a supplier id) from the endpoint `/availability`.

app.post("/availability", async (req, res) => {
  const productId = req.body.prod_id;
  const supplierId = req.body.supp_id;
  const unitPrice = req.body.unit_price;

  const productIdCheck = await pool.query(
    "SELECT * FROM products WHERE id = $1;",
    [productId]
  );
  const supplierIdCheck = await pool.query(
    "SELECT * FROM suppliers WHERE id = $1;",
    [supplierId]
  );

  if (!Number.isInteger(unitPrice) || unitPrice <= 0) {
    res.status(400).send("The unit price should be a positive number");
  } else if (productIdCheck.rows.length <= 0) {
    res.status(400).send("Product does not exist");
  } else if (supplierIdCheck.rows.length <= 0) {
    res.status(400).send("Supplier does not exist");
  }

  const query =
    "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3);";
  pool
    .query(query, [productId, supplierId, unitPrice])
    .then(() => res.send("New product availability created!"))
    .catch((error) => console.error(error));
});

// Task 9. DELETE an existing order along with all the associated order items from the endpoint `/orders/:orderId`.

app.delete("/orders/:orderId", async (req, res) => {
  const orderId = req.params.orderId;
  const orderIdCheck = await pool.query("SELECT * FROM orders WHERE id = $1;", [
    orderId,
  ]);
  if (orderIdCheck.rows.length <= 0) {
    res.status(400).send("Order does not exist!");
  }

  const query = "DELETE FROM orders WHERE id = $1;";
  pool
    .query(query, [orderId])
    .then(() => res.send("Order has been deleted!"))
    .catch((error) => console.error(error));
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}. Ready to accept requests!`);
});
