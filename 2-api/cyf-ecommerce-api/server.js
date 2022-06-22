const express = require("express");
const { Pool } = require("pg");
const app = express();
app.use(express.json());

const pool = new Pool({
  user: "tenny",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});
const PORT = 3001;

app.get("/customers", (req, res) => {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.send(result.rows))
    .catch((error) => {
      console.log("an error just occurred");
      res.status(500).send("a problem occurred");
    });
});

app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  pool
    .query("SELECT * FROM customers WHERE id = $1", [customerId])
    .then((result) => res.send(result.rows))
    .catch((error) => {
      console.log("an error just occurred");
      res.status(500).send("a problem occurred");
    });
});

app.get("/suppliers", (req, res) => {
  return pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.send(result.rows))
    .catch((error) => {
      console.log("an error just occurred");
      res.status(500).send("a problem occurred");
    });
});

app.get("/products", (req, res) => {
  const productName = req.query.name;

  let query =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id";
  let params = [];
  if (productName) {
    query =
      "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id where products.product_name like $1 ";
    params.push(`%${productName}%`);
  }
  pool
    .query(query, params)
    .then((result) => res.send(result.rows))
    .catch((error) => {
      console.log("an error just occurred");
      res.status(500).send("a problem occurred");
    });
});

app.post("/customers", (req, res) => {
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  const query =
    "INSERT INTO customers (name, address, city, country) VALUES($1, $2, $3, $4)";

  pool
    .query(query, [
      newCustomerName,
      newCustomerAddress,
      newCustomerCity,
      newCustomerCountry,
    ])
    .then(() => res.send("New Customer Created!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.post("/products", (req, res) => {
  const newProductName = req.body.name;

  const query = "INSERT INTO products (product_name) VALUES ($1)";

  pool
    .query(query, [newProductName])
    .then(() => res.send("New product name Added!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.post("/availability", (req, res) => {
  const newProductId = req.body.prod_id;
  const newSupplierId = req.body.supp_id;
  const newPrice = req.body.unit_price;

  const query =
    "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";

  pool
    .query(query, [newProductId, newSupplierId, newPrice])
    .then(() => res.send("New product name Added!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.post("/customers/:customerId/orders", (req, res) => {
  const newOrderDate = req.body.order_date;
  const newOrderReference = req.body.order_reference;
  const customerId = req.params.customerId;

  //customer id validation
  //let customerIdQuery = "select id from customers"
  //if(customerId )
  // return res
  //   .status(400)
  //   .send("customer id does not exist.");
  let query =
    "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";

  pool
    .query(query, [newOrderDate, newOrderReference, customerId])
    .then(() => res.send("New order Added!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.put("/customers/:customerId", (req, res) => {
  console.log(req.body.city);
  const customerId = req.params.customerId;
  const { email, address, city, postcode, country } = req.body;
  const customerDetails = {};

  if (email) customerDetails.email = email;
  if (address) customerDetails.address = address;
  if (city) customerDetails.city = city;
  if (postcode) customerDetails.postcode = postcode;
  if (country) customerDetails.country = country;

  const { query, variables } = Object.entries(customerDetails).reduce(
    (acc, [key, value], index) => {
      if (index === Object.keys(customerDetails).length - 1) {
        acc.query += ` ${key} = $${index + 2}`;
      } else {
        acc.query += ` ${key} = $${index + 2},`;
      }
      acc.variables.push(value);
      return acc;
    },
    { query: "UPDATE customers SET", variables: [] }
  );

  pool
    .query(`${query}  WHERE id=$1`, [customerId, ...variables])
    .then(() => res.send(`Customer ${customerId} updated!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// app.get("/orders", (req, res) => {
//   pool
//     .query("SELECT * FROM orders")
//     .then((result) => res.send(result.rows))
//     .catch((error) => {
//       console.log("an error just occurred");
//       res.status(500).send("a problem occurred");
//     });
// });

app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  console.log(req.params);

  pool
    .query("DELETE FROM orders WHERE id=$1", [orderId])
    .then(() => res.send(`Order ${orderId} deleted`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.delete("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;

  pool
    .query("DELETE FROM customers WHERE id=$1", [customerId])
    .then(() => res.send(`customer ${customerId} deleted`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;

  let query =
    "SELECT customers.id AS customer_id, orders.order_reference, orders.order_date, products.product_name, product_availability.unit_price, suppliers.supplier_name, order_items.quantity FROM orders INNER JOIN order_items ON orders.id = order_items.order_id INNER JOIN customers ON orders.customer_id = customers.id INNER JOIN products ON order_items.product_id = products.id INNER JOIN suppliers ON order_items.supplier_id = suppliers.id INNER JOIN product_availability ON order_items.product_id = product_availability.prod_id WHERE customers.id = $1";
  pool
    .query(query, [customerId])
    .then((result) => res.send(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.listen(PORT, () => {
  console.log("Hey we are listening!");
});
