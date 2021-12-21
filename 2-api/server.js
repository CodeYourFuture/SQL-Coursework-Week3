const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const { Pool } = require("pg");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  user: "humailkhan",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

//GET ecommerce database:

app.get("/", (req, res) => {
  res.send(`getting ecommerce database`);
});

// GET all the customers from the endpoint '/customers'.

app.get("/customers", function (req, res) {
  pool.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

//GET all suppliers:

app.get("/suppliers", function (req, res) {
  pool.query("SELECT * FROM suppliers", (error, result) => {
    res.json(result.rows);
  });
});

// Task 1. GET all the product names along with their prices and supplier names from the endpoint '/products'.
// Task 2. Update this endpoint to filter the list of products by name using a query parameter '/products?name=cup'.

app.get("/products", (request, response) => {
  const name = request.query.name;
  let query = `SELECT product_name,unit_price, supplier_name
                      FROM products
                      INNER JOIN product_availability ON product_availability.prod_id = products.id
                      INNER JOIN suppliers ON product_availability.supp_id  = suppliers.id
                      WHERE product_name ILIKE '%${name || ""}%' ; `;

  pool.query(query, (error, result) => {
    if (error) {
      return response.send(error);
    }
    response.send(result.rows);
  });
});

// Task 3. GET a single customer by ID from the endpoint '/customers/:customerId'.

app.get(["/customers", "/customers/:customerId"], (request, response) => {
  const customerId = request.params.customerId;
  if (customerId) {
    pool
      .query("SELECT * FROM customers WHERE id = $1;", [customerId])
      .then((result) => response.json(result.rows))
      .catch((error) => console.error(error));
  } else {
    pool
      .query("SELECT * FROM customers;")
      .then((result) => response.json(result.rows))
      .catch((error) => console.error(error));
  }
});

// Task 11. GET all the orders along with the items in the orders of a specific customer from the endpoint `/customers/:customerId/orders`.

app.get("/customers/:customerId/orders", async (request, response) => {
  const customerId = request.params.customerId;
  const checkId = await pool.query("SELECT * FROM customers WHERE id = $1;", [
    customerId,
  ]);

  if (checkId.rows.length <= 0) {
    response.status(400).send(`Customer Id ${customerId} does not exist`);
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
    .then((result) => response.json(result.rows))
    .catch((error) => console.error(error));
});

// Task 4. POST to create a new customer with name, address, city and country from the endpoint `/customers`.

app.post("/customers", (request, response) => {
  const name = request.body.name;
  const address = request.body.address;
  const city = request.body.city;
  const country = request.body.country;

  if (!name) {
    response.status(400).send("Please enter a valid name.");
  } else if (!address) {
    response.status(400).send("Please enter a valid address.");
  } else if (!city) {
    response.status(400).send("Please enter a valid City.");
  } else if (!country) {
    response.status(400).send("Please enter a valid Country.");
  }

  pool
    .query("SELECT * FROM customers WHERE name=$1;", [name])
    .then((result) => {
      if (result.rows.length > 0) {
        return response.status(400).send("Customer already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4);";
        pool
          .query(query, [name, address, city, country])
          .then(() => response.send("Customer Added!").json(result.rows))
          .catch((error) => console.error(error));
      }
    });
});

// Task 5. POST to create a new product from the endpoint `/products`.

app.post("/products", (request, response) => {
  const product_name = request.body.product_name;

  if (!product_name) {
    response.status(400).send("Please enter a valid product name.");
  }

  pool
    .query("SELECT product_name FROM products WHERE product_name=$1;", [
      product_name,
    ])
    .then((result) => {
      if (result.rows.length > 0) {
        return response.status(400).send("Product already exists!");
      } else {
        const query = "INSERT INTO products (product_name) VALUES ($1);";
        pool
          .query(query, [product_name])
          .then(() => response.send("Product Added!"))
          .catch((error) => console.error(error));
      }
    });
});

// Task 6. POST to create a new product availability (with a price and a supplier id) from the endpoint `/availability`.

app.post("/availability", async (request, response) => {
  const prod_id = request.body.prod_id;
  const supp_id = request.body.supp_id;
  const unit_price = request.body.unit_price;

  const checkProductId = await pool.query(
    "SELECT * FROM products WHERE id = $1;",
    [prod_id]
  );
  const checkSupplierId = await pool.query(
    "SELECT * FROM suppliers WHERE id = $1;",
    [supp_id]
  );

  if (!Number.isInteger(unit_price) || unit_price <= 0) {
    response.status(400).send("Unit price should be a positive number");
  } else if (checkProductId.rows.length <= 0) {
    response.status(400).send("Product does not exist");
  } else if (checkSupplierId.rows.length <= 0) {
    response.status(400).send("Supplier does not exist");
  }

  const query =
    "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3);";
  pool
    .query(query, [prod_id, supp_id, unit_price])
    .then(() => response.send("New product availability created!"))
    .catch((error) => console.error(error));
});

// Task 7. POST to create a new order (including an order date, and an order reference) for a customer from the endpoint `/customers/:customerId/orders`.

app.post("/customers/:customerId/orders", async (request, response) => {
  const customerId = request.params.customerId;
  const order_date = request.body.order_date;
  const order_reference = request.body.order_reference;
  const customerIdInput = customerId;
  const checkCustomerId = await pool.query(
    "SELECT * FROM customers WHERE id = $1;",
    [customerId]
  );

  if (checkCustomerId.rows.length <= 0) {
    response.status(400).send(`Customer Id ${customerId} does not exist`);
  } else if (!order_date || !order_reference || !customerIdInput) {
    response.status(400).send("Please provide valid inputs in all fields.");
  }

  const query =
    "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3);";
  pool
    .query(query, [order_date, order_reference, customerIdInput])
    .then(() => response.send("New order created!"))
    .catch((error) => console.error(error));
});

// Task 8. PUT to update an existing customer (name, address, city and country) from the endpoint `/customers/:customerId`.

app.put("/customers/:customerId", async (request, response) => {
  const customerId = request.params.customerId;
  const { name, address, city, country } = request.body;
  const checkCustomerId = await pool.query(
    "SELECT * FROM customers WHERE id = $1;",
    [customerId]
  );

  if (checkCustomerId.rows.length <= 0) {
    response.status(400).send(`Customer Id ${customerId} does not exist`);
  } else if (!name || !address || !city || !country) {
    res.status(400).send("Please provide valid inputs in all fields!");
  }

  const query =
    "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id = $5;";
  pool
    .query(query, [name, address, city, country, customerId])
    .then(response.send("Customer Updated!"))
    .catch((error) => console.error(error));
});

// Task 9. DELETE an existing order along with all the associated order items from the endpoint `/orders/:orderId`.

app.delete("/orders/:orderId", async (request, response) => {
  const orderId = request.params.orderId;
  const checkOrderId = await pool.query("SELECT * FROM orders WHERE id = $1;", [
    orderId,
  ]);
  if (checkOrderId.rows.length <= 0) {
    response.status(400).send("Order does not exist!");
  }

  const query = "DELETE FROM orders WHERE id = $1;";
  pool
    .query(query, [orderId])
    .then(() => response.send("Order has been deleted!"))
    .catch((error) => console.error(error));
});

// Task 10. DELETE an existing customer only if this customer doesn't have orders from the endpoint `/customers/:customerId`.

app.delete("/customers/:customerId", async (request, response) => {
  const customerId = request.params.customerId;
  const checkCustomerId = await pool.query(
    "SELECT * FROM customers WHERE id = $1;",
    [customerId]
  );
  const checkCustomerOrder = await pool.query(
    "SELECT * FROM orders WHERE customer_id = $1;",
    [customerId]
  );

  if (checkCustomerId.rows.length <= 0) {
    response
      .status(400)
      .send(`Customer with the Id ${customerId} does not exist!`);
  }
  if (checkCustomerOrder.rows.length <= 0) {
    const query = "DELETE FROM customers WHERE id = $1;";
    pool
      .query(query, [customerId])
      .then(response.send("Customer deleted"))
      .catch((error) => console.error(error));
  } else {
    response
      .status(400)
      .send("Customers that have an order cannot be deleted!");
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
