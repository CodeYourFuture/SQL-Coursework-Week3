const express = require("express");
const app = express();

const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "",
  port: 5432,
});
app.get("/", (req, res) => {
  res.send("hello");
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
  pool
    .query("SELECT p.product_name, pa.unit_price,
   s.supplier_name
   FROM products p
   INNER JOIN product_availability pa ON (p.id = pa.prod_id) 
   INNER JOIN suppliers s ON (s.id = pa.supp_id)")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);5
    })
});
app.put("/products/:productId", function (req, res) {
  const productId = req.params.productId;
  const newProduct = req.body.product;
  pool
    .query("UPDATE products SET email=$1 WHERE id=$2", [newProduct, productId])
    .then(() => res.send(`Product ${productId} updated!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  const orderDate = req.body.order_date;
  const orderRef = req.body.order_reference;
  db.query("SELECT * FROM customers WHERE id = $1", [customerId]).then(
    (result) => {
      if (result.rows.length === 0) {
        return res.status(400).send("An customer does not exist!");
      } else {
        const query =
          "INSERT INTO orders (order_date,order_reference,customer_id) VALUES ($1, $2, $3)";
        db.query(query, [orderDate, orderRef, customerId])
          .then(() => res.send("orders added successfully!"))
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    }
  );
});
app.get("/customers/:customerId", function (req, res) {
  let id = parseInt(req.params.customerId);
  pool
    .query("SELECT * FROM customers WHERE id = $1", [id])
    .then((result) => res.status(200).json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;

  const query = `SELECT o.order_reference, o.order_date, p.product_name, pa.unit_price, s.supplier_name, i.quantity
               FROM orders o
               INNER JOIN order_items i
               ON o.id = i.order_id
               INNER JOIN products p
               ON i.product_id = p.id
               INNER JOIN suppliers s
               ON i.supplier_id = s.id
               INNER JOIN product_availability pa
               ON i.product_id = pa.prod_id AND i.supplier_id = pa.supp_id
               WHERE o.customer_id = $1`;

  db.query(query, [customerId])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.delete("/orders/:orderId", (req, res) =>{
  const orderId = req.params.orderId;

  db.query("DELETE FROM orders WHERE id=$1", [orderId])
    .then(() => res.send(`order ${orderId} deleted!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.delete("/customers/:customersId",(req, res) =>{
  let id = parseInt(req.params.customersId); 
  pool
    .query("DELETE FROM customers WHERE id=$1", [id])
    .then(() => res.status(200).json(`customer ${id} deleted!`))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});


app.listen(3000, function () {
  console.log("Server is listening on port 3000. Ready to accept requests!");
});
