const express = require("express");
const app = express();
app.use(express.json());

app.listen(4000, function () {
  console.log("Server is listening on port 4000. Ready to accept requests!");
});

const { Pool } = require("pg");

const pool = new Pool({
  user: "codeyourfuture", // my computer username
  host: "localhost",
  database: "cyf_ecommerce",
  password: "CYFStudent123", //  my password
  port: 5432,
});

app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/products", function (req, res) {
  const query =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM product_availability INNER JOIN suppliers ON product_availability.supp_id = suppliers.id INNER JOIN products ON product_availability.prod_id = products.id WHERE products.product_name = $1";
  const productName = req.query.name;
  if (req.query.name) {
    pool
      .query(query, [productName])
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  }
  if (Object.keys(req.query).length === 0) {
    pool
      .query(
        "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM product_availability INNER JOIN suppliers ON product_availability.supp_id = suppliers.id INNER JOIN products ON product_availability.prod_id = products.id"
      )
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  }
});

//Add a new GET endpoint `/customers/:customerId` to load a single customer by ID.
app.get("/customers/:id", function (req, res) {
  const id = req.params.id;
  pool
    .query("SELECT * FROM customers WHERE id = $1", [id])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// Add a new POST endpoint `/customers` to create a new customer with name, address, city and country.

app.post("/customers", function (req, res) {
  const name = req.body.name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;

  const Query =
    "INSERT INTO customers (name, address, city,country) VALUES ($1, $2, $3, $4)";
  pool
    .query(Query, [name, address, city, country])
    .then(() => res.send("A new customer added"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// Add a new POST endpoint `/products` to create a new product.

app.post("/products", function (req, res) {
  const name = req.body.product_name;

  const Query = "INSERT INTO products (product_name) VALUES ($1)";
  pool
    .query(Query, [name])
    .then(() => res.send("A new product added"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//Add a new POST endpoint `/availability` to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.

app.post("/availability", function (req, res) {
  const supp = req.body.supp_id;
  const price = req.body.unit_price;
  if (price < 0) {
    return res.status(400).send(" The price should be a positive number.");
  }
  pool
    .query("SELECT prod_id,supp_id FROM product_availability")
    .then((result) => {
      if (result.rows.length > 0) {
        pool
          .query(
            "INSERT INTO product_availability (supp_id,unit_price) VALUES ($1,$2)",
            [supp, price]
          )
          .then(() => res.send("A new product availability added"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      } else {
        console.log("");
        return res.status(400).send(" Product or supplier not available");
      }
    });
});

//  Add a new POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.

app.post("/customers/:customerId/orders", function (req, res) {
  const ID = req.params.customerId;
  const id = req.body.customer_id;
  const date = req.body.order_date;
  const ref = req.body.order_reference;
  const Query =
    "INSERT INTO orders (order_date,order_reference,customer_id) VALUES ($1,$2,$3)";
  if (ID == id) {
    pool
      .query(Query, [date, ref, id])
      .then((result) => res.send("order added"))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  } else {
    return res.status(400).send("Wrong customer id");
  }
});

// Add a new PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).

app.put("/customers/:customerId", function (req, res) {
  const name = req.body.name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;
  const id = req.params.customerId;
  pool
    .query(
      "UPDATE customers SET name = $1,address = $2, city = $3 , country= $4 WHERE id = $5 ",
      [name, address, city, country, id]
    )
    .then((result) => res.send(`Customer ${id} updated!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//Add a new DELETE endpoint  to delete an existing order along with all the associated order items.

app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
    .then(() => pool.query("DELETE FROM orders WHERE id=$1", [orderId]))
    .then(() => res.send(`Order ${orderId} deleted!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

//Add a new DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.

app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  pool
    .query("SELECT customer_id FROM orders WHERE customer_id = $1", [
      customerId,
    ])
    .then((result) => {
      if (result.rows.length !== 0) {
        return res.send("This customer has placed an order");
      } else {
        const query =
          "DELETE FROM customers WHERE id NOT IN (SELECT customer_id FROM orders)";
        pool
          .query(query)
          .then(() => res.send("Customer deleted"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// Add a new GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer. Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.

app.get("/customers/:customerId/orders", function (req, res) {
  const Id = req.params.customerId;
  const Query =
    "SELECT orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity FROM orders INNER JOIN order_items ON order_items.order_id = orders.id INNER JOIN suppliers ON suppliers.id= order_items.supplier_id INNER JOIN product_availability ON suppliers.id= product_availability.supp_id INNER JOIN customers ON customers.id = orders.customer_id INNER JOIN products ON products.id = product_availability.prod_id WHERE customers.id=$1";
  pool
    .query(Query, [Id])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
