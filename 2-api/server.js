const express = require("express");
const app = express();
const { Pool } = require("pg");
const PORT = process.env.PORT || 3000;
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});

app.get("/", (req, res) => {
  res.send("It's ready to GET");
}); 
app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers", (error, result) => {
      res.json(result.rows);
  });
});

app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  pool
    .query("SELECT * FROM customers WHERE customers.id=$1",
      [customerId],
      (error, result) => {
        res.json(result.rows);
    }
  );
});

app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers", (error, result) => {
      res.json(result.rows);
    });
});

app.get("/products", (req, res) => {
  pool
    .query(
      "SELECT p.product_name, pa.unit_price, s.supplier_name FROM products p JOIN product_availability pa ON p.id = pa.prod_id JOIN suppliers s ON pa.supp_id = s.id",
      (error, result) => {
        res.json(result.rows);
      })
});

app.post("/availability", function (req, res) {
  const productId = req.body.prod_id;
  const supplierId = req.body.supp_id;
  const unitPrice = req.body.unit_price;

  if (unitPrice <= 0) {
    return res.status(400).send("Invalid price");
  }

  pool
    .query(
      "SELECT p.id, s.id FROM  products p, suppliers s  WHERE p.id=$1 AND s.id=$2",
      [productId, supplierId]
    )
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(400).send("Check product id or supplier id");
      } else {
        const query =
          "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";

        pool
          .query(query, [productId, supplierId, unitPrice])
          .then(() => res.send("Successfully added new product availability"))
          .catch((e) => console.error(e.detail));
      }
    });
});

app.post("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;
  const orderDate = req.body.order_date;
  const orderRef = req.body.order_reference;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(400).send("No customer with this id");
      } else {
        const query =
          "INSERT INTO orders (order_date, order_reference, customer_id)VALUES ($1, $2, $3)";
        pool
          .query(query, [orderDate, orderRef, customerId])
          .then(() => res.send("Order received"))
          .catch((e) => console.error(e.detail));
      }
    });
});

app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const newName = req.body.name;
  const newAdd = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(400).send("No customer with this id");
      } else {
        const query =
          "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5";

        pool
          .query(query, [newName, newAdd, newCity, newCountry, customerId])
          .then(() => res.send(`Successfully updated customer ${customerId}`))
          .catch((e) => console.error(e.detail));
      }
    });
});

app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query("DELETE FROM orders WHERE customer_id=$1", [orderId])
    .then(() => {
      pool
        .query("DELETE FROM customers WHERE id=$1", [orderId])
        .then(() => res.send(`customer ${customerId} deleted`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e.detail));
});

app.listen(PORT, function () {
  console.log(`Server is listening on port ${PORT}. Ready to accept requests!`);
});
