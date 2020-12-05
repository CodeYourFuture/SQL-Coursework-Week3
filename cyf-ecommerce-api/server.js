const express = require("express");
const app = express();

app.use(express.json());

const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "billy2wash",
  port: 5432,
});
//Get customers
app.get("/customers", function (req, res) {
  pool.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});
app.get("/suppliers", function (req, res) {
  pool.query("SELECT * FROM suppliers", (error, result) => {
    res.json(result.rows);
  });
});

//Get only product name and supplier name.
app.get("/products", function (req, res) {
  pool.query(
    "SELECT product_name, supplier_name FROM products INNER JOIN suppliers ON products.supplier_id=suppliers.id",
    (error, result) => {
      res.json(result.rows);
    },
  );
});
//Get products limiting by product name.
app.get("/products", (req, res) => {
  const productNameQuery = req.query.product_name;
  let query = `SELECT * FROM products ORDER BY products.product_name`;

  if (productNameQuery) {
    query = `SELECT * FROM products WHERE products.product_name LIKE '%${productNameQuery}%' ORDER BY products.product_name`;
  }

  pool
    .query(query)
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});
//Get a customer using it's id
app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  pool.query(
    "SELECT * FROM customers WHERE id=$1",
    [customerId],
    (error, result) => {
      error ? console.error(error.stack) : res.json(result.rows);
    },
  );
});

//Create new customers
app.post("/customers", function (req, res) {
  if (!req.body) {
    return res.status(400).send("Body not found");
  }
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;
  pool
    .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("An Customer with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
        pool
          .query(query, [
            newCustomerName,
            newCustomerAddress,
            newCustomerCity,
            newCustomerCountry,
          ])
          .then(() => res.send("Customer created!"))
          .catch((e) => console.error(e));
      }
    });
});

// Create a new product
app.post("/products", function (req, res) {
  if (!req.body) {
    return res.status(400).send("Body not found");
  }
  const newProductName = req.body.product_name;
  const newProductUnitPrice = req.body.unit_price;
  const newProductSupplierId = req.body.supplier_id;

  // const validateEmail = /^[^@]+@[^@]+\.[^@]+$/;
  if (!Number.isInteger(newProductUnitPrice) || newProductUnitPrice <= 0) {
    return res.status(400).send("Price should be a positive integer.");
  }

  pool
    .query("SELECT * FROM products WHERE supplier_id=$1", [
      newProductSupplierId,
    ])
    .then((result) => {
      if (result.rows.length === 0) {
        return res
          .status(400)
          .send("The supplier with this supplierId does not exist!");
      } else {
        const query =
          "INSERT INTO products (product_name, unit_price, supplier_id) VALUES ($1, $2, $3)";
        pool
          .query(query, [
            newProductName,
            newProductUnitPrice,
            newProductSupplierId,
          ])
          .then(() => res.send("Product created!"))
          .catch((e) => console.error(e));
      }
    });
});

//Post a new Customer related to a particular order.
app.post("/customers/:customerId/orders", function (req, res) {
  const newOrderDate = req.body.order_date;
  const newOrderReference = req.body.order_reference;
  const customerId = req.params.customer_id;

  pool
    .query("SELECT * FROM customers WHERE id = $1", [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(400).send("Sorry customer does not exist.");
      } else {
        const query =
          "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";

        pool
          .query(query, [newOrderDate, newOrderReference, customerId])
          .then(() => res.send("Thanks, order created!"))
          .catch((e) => console.error(e));
      }
    });
});

//Update  customers by id
app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const newName = req.body.name;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;
  pool
    .query("SELECT * FROM customers WHERE id = $1", [customerId])
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(400).send("The customer ID does not exist.");
      } else {
        const query =
          "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5";
        pool
          .query(query, [newName, newAddress, newCity, newCountry, customerId])
          .then(() => res.send(`Customer ${customerId} updated!`))
          .catch((e) => console.error(e));
      }
    });
});

//Delete individual order by Id
app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query("DELETE FROM orders WHERE id=$1", [orderId])
    .then(() => res.send(`Order ${orderId} deleted!`))
    .catch((e) => console.error(e));
});

//Delete indiual customers by id
app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM orders WHERE customer_id=$1", [customerId])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("Can't delete this customer. Has existing orders.");
      } else {
        pool
          .query("DELETE FROM customers WHERE id=$1", [customerId])
          .then(() => res.send(`Customer ${customerId} deleted!`))
          .catch((e) => console.error(e));
      }
    });
});

//load all the orders along with the items in the orders of a specific customer
app.get("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;
  const query =
    "SELECT orders.order_reference, orders.order_date, products.product_name, products.unit_price, suppliers.supplier_name, order_items.quantity FROM orders INNER JOIN order_items ON orders.id = order_items.order_id INNER JOIN products ON order_items.product_id = products.id INNER JOIN suppliers ON suppliers.id = products.supplier_id WHERE customer_id = $1";
  pool
    .query(query, [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
