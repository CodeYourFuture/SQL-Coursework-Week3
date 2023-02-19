const express = require("express");
const app = express();
const { Pool } = require("pg");

app.use(express.json());

const db = new Pool({
  user: "nabwa",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.get("/customers", function (req, res) {
  db.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/customers/:id", function (req, res) {
  const customerId = req.params.id;
  db.query("select * from customers where id = $1", [customerId], (error, result) => {
    res.json(result.rows);
  });
});

// POST METHOD customers
app.post("/customers", function (req, res) {
  const { name, address, city, country } = req.body;
  if (name && address && city && country) {
    db.query("INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4) RETURNING *", [name, address, city, country], (error, results) => {
      if (error) {
        throw error;
      }
      res.status(201).send(`User added with ID: ${results.rows[0].id}`);
    });
  }
});

// POST METHOD products
app.post("/products", function (req, res) {
  const { name } = req.body;

  db.query("INSERT INTO products (product_name) VALUES ($1) RETURNING *", [name], (error, results) => {
    if (error) {
      throw error;
    }
    res.status(201).send(`User added with ID: ${results.rows[0].id}`);
  });
});

// post method product availability
app.post("/availability", async (req, res) => {
  const { price, supId, prodId } = req.body;

  const proIdCheck = await db.query("SELECT * FROM products WHERE id = $1", [prodId]).then((data) => data.rowCount > 0);

  const supIdCheck = await db.query("SELECT * FROM suppliers WHERE id = $1", [supId]).then((data) => data.rowCount > 0);

  const duplicateCheck = await db.query("SELECT * FROM product_availability WHERE prod_id = $1 and supp_id = $2", [prodId, supId]).then((data) => data.rowCount === 0);

  if (proIdCheck && supIdCheck && Number.isInteger(price) && price > 0 && duplicateCheck) {
    const result = await db.query("INSERT INTO product_availability (unit_price, supp_id, prod_id) VALUES ($1, $2, $3) RETURNING *", [price, supId, prodId]);

    res.status(201).json(result.rows);
  } else {
    res.status(400).send("missing info or duplicated row");
  }
});

// post method customer and order
app.post("/customers/:customerId/orders", async function (req, res) {
  const customerId = req.params.customerId;
  const { orderDate, reference } = req.body;
  const customerIdCheck = await db.query("SELECT * FROM customers WHERE id = $1", [customerId]).then((data) => data.rowCount > 0);
  if (orderDate && reference && customerId && customerIdCheck) {
    db.query("INSERT INTO orders (order_date, order_reference,customer_id) VALUES ($1, $2, $3)", [orderDate, reference, customerId], (error, results) => {
      if (error) {
        throw error;
      }
      res.status(201).send(`Order added with ref: ${reference}`);
    });
  } else {
    res.status(400).send("wrong information");
  }
});

// PUT method
app.put("/customers/:customerId", async function (req, res) {
  const customerID = +req.params.customerId;
  const { name, address, city, country } = req.body;

  const checkId = await db.query("SELECT * FROM customers WHERE id = $1", [customerID]).then((data) => data.rowCount > 0);
  if (checkId) {
    db.query("UPDATE customers SET name = $1, address = $2, city = $3, country = $4 WHERE id = $5", [name, address, city, country, customerID], (error, results) => {
      if (error) {
        throw error;
      }
      res.status(202).send(`Customer modified with ID: ${customerID}`);
    });
  } else {
    res.status(400).send(`ID not available`);
  }
});

// DELETE method orders
app.delete("/orders/:orderId", async function (req, res) {
  const orderId = +req.params.orderId;
  const orderItemIdCheck = await db.query("SELECT * FROM orders WHERE id = $1", [orderId]).then((data) => data.rowCount > 0);
  const ordersIdCheck = await db.query("SELECT * FROM order_items WHERE order_id = $1", [orderId]).then((data) => data.rowCount > 0);
  if (ordersIdCheck && orderItemIdCheck) {
    db.query("DELETE FROM order_items WHERE order_id = $1", [orderId], (error, results) => {
      if (error) {
        throw error;
      }
    });

    db.query("DELETE FROM orders WHERE id = $1", [orderId], (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).send(`User deleted with ID: ${orderId}`);
    });
  } else {
    res.status(400).send(`Delete id not available`);
  }
});

// DELETE method customers
app.delete("/customers/:customerId", async function (req, res) {
  const customerId = +req.params.customerId;
  const customerIdCheck = await db.query("SELECT * FROM customers WHERE id = $1", [customerId]).then((data) => data.rowCount > 0);
  const customerIdInordersCheck = await db.query("SELECT * FROM orders WHERE customer_id = $1", [customerId]).then((data) => data.rowCount === 0);
  if (customerIdCheck && customerIdInordersCheck) {
    db.query("DELETE FROM customers WHERE id = $1", [customerId], (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).send(`Customer deleted with ID: ${customerId}`);
    });
  } else {
    res.status(400).send(`Delete id not available or customer has orders`);
  }
});

//
app.get("/suppliers", function (req, res) {
  db.query("SELECT * FROM suppliers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/products", (req, res) => {
  const searchKey = req.query.name;
  let query = "select * from products";

  let params = [];
  if (searchKey) {
    query =
      "select p.product_name, p_a.unit_price,s.supplier_name from products p join product_availability p_a on (p.id = p_a.prod_id) join suppliers s on (s.id = p_a.supp_id) WHERE p.product_name LIKE $1";
    params.push(`%${searchKey}%`);
  }

  db.query(query, params)
    .then((result) => res.json(result.rows))
    .catch((err) => {
      console.error(err);
      res.status(500).json(err);
    });
});

// get method customer and order
app.get("/customers/:customerId/orders", async function (req, res) {
  const customerId = req.params.customerId;
  const customerIdCheck = await db.query("SELECT * FROM customers WHERE id = $1", [customerId]).then((data) => data.rowCount > 0);
  if (customerId && customerIdCheck) {
    db.query(
      "SELECT o.order_reference, o.order_date, p.product_name, pa.unit_price, s.supplier_name, oi.quantity FROM product_availability pa INNER JOIN products p ON (pa.prod_id = p.id ) INNER JOIN suppliers s ON s.id = pa.supp_id INNER JOIN order_items oi ON oi.product_id = p.id INNER JOIN orders o ON o.id = oi.order_id INNER JOIN customers c ON c.id = o.customer_id WHERE c.id = $1",
      [customerId],
      (error, results) => {
        if (error) {
          throw error;
        }
        res.status(200).json(results.rows);
      }
    );
  } else {
    res.status(400).send("wrong information");
  }
});

app.listen(8080, function () {
  console.log("Server is listening on port 8080.");
});
