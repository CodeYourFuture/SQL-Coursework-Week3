const express = require("express");
const app = express();
const { Pool } = require("pg");
const moment = require("moment");
const { response } = require("express");

app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "omid",
  port: 5432,
});

app.get("/customers", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM customers WHERE id = 5 ",
    []
  );
  res.json(rows);

  //   const { rows } = await pool.query(`SELECT * FROM customers`);
  //   console.log(rows);
  //   pool
  //     .query(`SELECT * FROM customers`)
  //     .then((result) => res.json(result.rows))
  //     .catch((error) => {
  //       console.error(error);
  //       res.status(500).json(error);
  //     });
});

app.get("/customers/:customerId", (req, res) => {
  const customerID = req.params.customerId;

  pool
    .query(`SELECT * FROM customers WHERE id::text = $1`, [customerID])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/suppliers", (req, res) => {
  pool
    .query(`SELECT * FROM suppliers`)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/products", (req, res) => {
  const name = req.query.name.toLowerCase();

  pool
    .query(`SELECT * FROM products WHERE LOWER(product_name) LIKE $1`, [
      `%${name}%`,
    ])
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.post("/products", (req, res) => {
  const id = req.body.id;
  const name = req.body.name;

  pool
    .query("INSERT INTO products VALUES($1,$2)", [id, name])
    .then((result) =>
      res.json({ message: `Product ID ${id} Saved into successfully. ` })
    )
    .catch((err) => {
      console.log(err);
      res.status(500).json("Request denied, server issue");
    });
});

app.post("/availability", (req, res) => {
  const productId = req.body.prodID;
  const supplierId = req.body.supID;
  const unitPrice = req.body.price;

  pool
    .query("INSERT INTO product_availability VALUES($1,$2,$3)", [
      productId,
      supplierId,
      unitPrice,
    ])
    .then((result) => res.json({ message: "Product saved successfully" }))
    .catch((err) => {
      console.error(err);
      res.status(500).json("Request denied, server issues");
    });
});

app.post("/customers/:customerId/orders", (req, res) => {
  const id = 11;
  const customerId = req.params.customerId;
  const date = moment().format("YYYY-MM-DD");
  const ref = `ORD0${id}`;

  pool
    .query("INSERT INTO orders VALUES($1,$2,$3,$4)", [
      id,
      date,
      ref,
      customerId,
    ])
    .then((result) => res.json({ message: "Product saved successfully" }))
    .catch((err) => {
      console.error(err);
      res.status(500).json("Request denied, server issues");
    });
});

app.put("/customers/:customerId", (req, res) => {
  const customerID = req.params.customerId;
  const name = req.body.name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;
  pool
    .query(
      "UPDATE customers SET name = $1, address = $2, city = $3, country = $4 WHERE id = $5",
      [name, address, city, country, customerID]
    )
    .then((result) =>
      res.json({ message: `Customer ID ${customerID} updated successfully.` })
    )
    .catch((err) => {
      console.error(err);
      res.status(500).json("Request denied, action failed");
    });

  console.log("data updated");
});

app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;

  pool
    .query("DELETE FROM orders WHERE id = $1", [orderId])
    .then((result) =>
      res.json({ messsage: `Order ${orderId} deleted successfully.` })
    )
    .catch((err) => {
      console.log(err);
      res.status(500).json("Access denied, failed to delete record.");
    });
});

app.delete("/customers/:customerId", async (req, res) => {
  const customerId = req.params.customerId;
  const { rows } = await pool.query(
    "SELECT id,(SELECT  COUNT(customer_id) FROM orders WHERE customer_id = $1) AS orders FROM customers WHERE id =$1",
    [customerId]
  );

  if (rows.length > 0 && rows[0].orders == "0") {
    pool
      .query("DELETE FROM customers WHERE id = $1", [customerId])
      .then((result) =>
        res.json({
          message: `Customer ID ${customerId} deleted successfully.`,
        })
      )
      .catch((err) => {
        console.log(err);
        res
          .status(500)
          .json(
            `unable to delete customer ID ${customerId}, contact your system admin`
          );
      });
  } else
    res
      .status(500)
      .json(
        `unable to delete customer because customer has got order(s) or customer ${customerId} not found.`
      );
});

app.get("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;

  pool
    .query(
      "SELECT o.order_reference, o.order_date, p.product_name, pa.unit_price,s.supplier_name, oi.quantity FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN product_availability pa ON oi.product_id = pa.prod_id JOIN products p ON pa.prod_id = p.id JOIN suppliers s ON pa.supp_id = s.id WHERE o.customer_id = $1",
      [customerId]
    )
    .then((result) => res.json(result.rows))
    .catch((err) => {
      console.error(err);
      res.status(500).json("Unable to process your request. try again later");
    });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("server is up");
});
