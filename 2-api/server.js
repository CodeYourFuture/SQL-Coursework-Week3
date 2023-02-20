const express = require("express");
const { Pool } = require("pg");
const app = express();

app.use(express.json());

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "rebwar",
  password: "",
  database: "ecommerce",
});

app.get("/products", async (req, res) => {
  const { name } = req.query;
  try {
    if (name) {
      const products = await pool.query(
        `SELECT products.product_name,
        product_availability.unit_price,
        suppliers.supplier_name
        FROM products
        JOIN product_availability
        ON products.id = product_availability.prod_id
        JOIN suppliers
        ON product_availability.supp_id = suppliers.id
        WHERE products.product_name LIKE $1`,
        [name + "%"]
      );
      res.json(products.rows);
    } else {
      const products = await pool.query(
        `
        SELECT products.product_name,
        product_availability.unit_price,
        suppliers.supplier_name
        FROM products
        JOIN product_availability
        ON products.id = product_availability.prod_id
        JOIN suppliers
        ON product_availability.supp_id = suppliers.id
        `
      );
      res.json(products.rows);
    }
  } catch (err) {
    console.error(err.message);
  }
});

//🌧
app.get("/customers", async (req, res) => {
  try {
    const allCustomers = await pool.query("SELECT * FROM customers");
    res.json(allCustomers.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/customers/:customerId", async (req, res) => {
  const { customerId } = req.params;
  try {
    const customer = await pool.query("SELECT * FROM customers WHERE id = $1", [
      customerId,
    ]);
    res.json(customer.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});
//🌧

app.post("/customers", async (req, res) => {
  try {
    const { name, address, city, country } = req.body;
    const newCustomer = await pool.query(
      "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, address, city, country]
    );
    res.json(newCustomer.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/products", async (req, res) => {
  try {
    const { product_name } = req.body;
    const newProduct = await pool.query(
      "INSERT INTO products (product_name) VALUES ($1) RETURNING *",
      [product_name]
    );
    res.json(newProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

// CREATE TABLE customers (
//   id       SERIAL PRIMARY KEY,
//   name     VARCHAR(50) NOT NULL,
//   address  VARCHAR(120),
//   city     VARCHAR(30),
//   country  VARCHAR(20)
// );

// CREATE TABLE suppliers (
//     id              SERIAL PRIMARY KEY,
//     supplier_name   VARCHAR(100) NOT NULL,
//     country         VARCHAR(20) NOT NULL
// );

// CREATE TABLE products (
//     id             SERIAL PRIMARY KEY,
//     product_name   VARCHAR(100) NOT NULL
// );

// create table product_availability (
//   prod_id       integer references products(id),
//   supp_id       integer references suppliers(id),
//   unit_price    integer not null,
//   primary key (prod_id, supp_id)
// );

// CREATE TABLE orders (
//     id              SERIAL PRIMARY KEY,
//     order_date      DATE NOT NULL,
//     order_reference VARCHAR(10) NOT NULL,
//     customer_id     INT REFERENCES customers(id)
// );

// CREATE TABLE order_items (
//     id          SERIAL PRIMARY KEY,
//     order_id    INT NOT NULL REFERENCES orders(id),
//     product_id  INT NOT NULL,
//     supplier_id INT NOT NULL,
//     quantity    INT NOT NULL,
//     FOREIGN KEY (product_id, supplier_id)
//         REFERENCES product_availability (prod_id, supp_id)
// );

// INSERT INTO customers (name, address, city, country) VALUES ('Guy Crawford','770-2839 Ligula Road','Paris','France');
// INSERT INTO customers (name, address, city, country) VALUES ('Hope Crosby','P.O. Box 276, 4976 Sit Rd.','Steyr','United Kingdom');
// INSERT INTO customers (name, address, city, country) VALUES ('Britanney Kirkland','P.O. Box 577, 5601 Sem, St.','Little Rock','United Kingdom');
// INSERT INTO customers (name, address, city, country) VALUES ('Amber Tran','6967 Ac Road','Villafranca Asti','United States');
// INSERT INTO customers (name, address, city, country) VALUES ('Edan Higgins','Ap #840-3255 Tincidunt St.','Arles','United States');
// INSERT INTO customers (name, address, city, country) VALUES ('Quintessa Austin','597-2737 Nunc Rd.','Saint-Marc','United Kingdom');

// INSERT INTO suppliers (supplier_name, country) VALUES ('Amazon', 'United States');
// INSERT INTO suppliers (supplier_name, country) VALUES ('Taobao', 'China');
// INSERT INTO suppliers (supplier_name, country) VALUES ('Argos', 'United Kingdom');
// INSERT INTO suppliers (supplier_name, country) VALUES ('Sainsburys', 'United Kingdom');

// INSERT INTO products (product_name) VALUES ('Mobile Phone X');
// INSERT INTO products (product_name) VALUES ('Javascript Book');
// INSERT INTO products (product_name) VALUES ('Le Petit Prince');
// INSERT INTO products (product_name) VALUES ('Super warm socks');
// INSERT INTO products (product_name) VALUES ('Coffee Cup');
// INSERT INTO products (product_name) VALUES ('Ball');
// INSERT INTO products (product_name) VALUES ('Tee Shirt Olympic Games');

// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (1, 4, 249);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (1, 1, 299);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (2, 2, 41);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (2, 3, 39);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (2, 1, 40);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (3, 4, 10);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (3, 1, 10);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (4, 4, 10);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (4, 3, 8);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (4, 2, 5);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (4, 1, 10);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (5, 4, 5);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (5, 3, 4);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (5, 2, 4);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (5, 1, 3);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (6, 2, 20);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (6, 4, 15);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (6, 1, 14);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (7, 3, 21);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (7, 2, 18);
// INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES (7, 1, 20);

// INSERT INTO orders (order_date, order_reference, customer_id) VALUES ('2019-06-01', 'ORD001', 1);
// INSERT INTO orders (order_date, order_reference, customer_id) VALUES ('2019-07-15', 'ORD002', 1);
// INSERT INTO orders (order_date, order_reference, customer_id) VALUES ('2019-07-11', 'ORD003', 1);
// INSERT INTO orders (order_date, order_reference, customer_id) VALUES ('2019-05-24', 'ORD004', 2);
// INSERT INTO orders (order_date, order_reference, customer_id) VALUES ('2019-05-30', 'ORD005', 3);
// INSERT INTO orders (order_date, order_reference, customer_id) VALUES ('2019-07-05', 'ORD006', 4);
// INSERT INTO orders (order_date, order_reference, customer_id) VALUES ('2019-04-05', 'ORD007', 4);
// INSERT INTO orders (order_date, order_reference, customer_id) VALUES ('2019-07-23', 'ORD008', 5);
// INSERT INTO orders (order_date, order_reference, customer_id) VALUES ('2019-07-24', 'ORD009', 5);
// INSERT INTO orders (order_date, order_reference, customer_id) VALUES ('2019-05-10', 'ORD010', 5);

// INSERT INTO order_items VALUES (1, 1, 7, 2, 1);
// INSERT INTO order_items VALUES (2, 1, 4, 2, 5);
// INSERT INTO order_items VALUES (3, 2, 4, 3, 4);
// INSERT INTO order_items VALUES (4, 2, 3, 4, 1);
// INSERT INTO order_items VALUES (5, 3, 5, 3, 10);
// INSERT INTO order_items VALUES (6, 3, 6, 2, 2);
// INSERT INTO order_items VALUES (7, 4, 1, 1, 1);
// INSERT INTO order_items VALUES (8, 5, 2, 3, 2);
// INSERT INTO order_items VALUES (9, 5, 3, 1, 1);
// INSERT INTO order_items VALUES (10, 6, 5, 2, 3);
// INSERT INTO order_items VALUES (11, 6, 2, 2, 1);
// INSERT INTO order_items VALUES (12, 6, 3, 4, 1);
// INSERT INTO order_items VALUES (13, 6, 4, 4, 3);
// INSERT INTO order_items VALUES (14, 7, 4, 3, 15);
// INSERT INTO order_items VALUES (15, 8, 7, 1, 1);
// INSERT INTO order_items VALUES (16, 8, 1, 4, 1);
// INSERT INTO order_items VALUES (17, 9, 6, 4, 2);
// INSERT INTO order_items VALUES (18, 10, 6, 2, 1);
// INSERT INTO order_items VALUES (19, 10, 4, 1, 5);

app.post("/availability", async (req, res) => {
  const { prod_id, supp_id, unit_price } = req.body;

  try {
    const product = await pool.query("SELECT * FROM products WHERE id = $1", [
      prod_id,
    ]);
    if (product.rows.length === 0) {
      res.status(400).send("Product not found");
    } else {
      const supplier = await pool.query(
        "SELECT * FROM suppliers WHERE id = $1",
        [supp_id]
      );
      if (supplier.rows.length === 0) {
        res.status(400).send("Supplier not found");
      } else {
        if (unit_price > 0) {
          const newAvailability = await pool.query(
            "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3) RETURNING *",
            [prod_id, supp_id, unit_price]
          );
          res.json(newAvailability.rows[0]);
        } else {
          res.status(400).send("Price must be a positive integer");
        }
      }
    }
  } catch (err) {
    console.error(err.message);
  }
});

//🍉🍉🍉🍉🍉🍉🍉🍉
app.post("/customers/:customerId/orders", async (req, res) => {
  const customerId = req.params.customerId;
  const { order_date, order_reference } = req.body;
  try {
    const customer = await pool.query("SELECT * FROM customers WHERE id = $1", [
      customerId,
    ]);
    if (customer.rows.length === 0) {
      res.status(400).send("Customer not found");
    } else {
      const newOrder = await pool.query(
        "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3) RETURNING *",
        [order_date, order_reference, customerId]
      );
      res.json(newOrder.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
  }
});

app.put("/customers/:customerId", async (req, res) => {
  const customerId = req.params.customerId;
  const { name, address, city, country } = req.body;
  try {
    const customer = await pool.query("SELECT * FROM customers WHERE id = $1", [
      customerId,
    ]);
    if (customer.rows.length === 0) {
      res.status(400).send("Customer not found");
    } else {
      const updatedCustomer = await pool.query(
        "UPDATE customers SET name = $1, address = $2, city = $3, country = $4 WHERE id = $5 RETURNING *",
        [name, address, city, country, customerId]
      );
      res.json(updatedCustomer.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
  }
});

app.delete("/orders/:orderId", async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const order = await pool.query("SELECT * FROM orders WHERE id = $1", [
      orderId,
    ]);
    if (order.rows.length === 0) {
      res.status(400).send("Order not found");
    } else {
      const deletedOrder = await pool.query(
        "DELETE FROM orders WHERE id = $1",
        [orderId]
      );
      res.send("Order deleted");
    }
  } catch (err) {
    console.error(err.message);
  }
});

app.delete("/customers/:customerId", async (req, res) => {
  const customerId = req.params.customerId;
  try {
    const customer = await pool.query("SELECT * FROM customers WHERE id = $1", [
      customerId,
    ]);
    if (customer.rows.length === 0) {
      res.status(400).send("Customer not found");
    } else {
      const order = await pool.query(
        "SELECT * FROM orders WHERE customer_id = $1",
        [customerId]
      );
      if (order.rows.length === 0) {
        const deletedCustomer = await pool.query(
          "DELETE FROM customers WHERE id = $1",
          [customerId]
        );
        res.send("Customer deleted");
      } else {
        res.status(400).send("Customer has orders");
      }
    }
  } catch (err) {
    console.error(err.message);
  }
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
