const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const port = process.env.PORT || 5000;
const cors = require("cors");
const fs = require("fs");
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "CYFStudent123",
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
  const name = req.query.name;

  if (name) {
    pool
      .query(
        `SELECT  product_name, unit_price, supplier_name FROM product_availability JOIN products ON product_availability.prod_id = products.id JOIN suppliers ON product_availability.supp_id = suppliers.id WHERE product_name= '${name}'`
      )
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  } else {
    pool
      .query(
        `SELECT  product_name, unit_price, supplier_name FROM product_availability JOIN products ON product_availability.prod_id = products.id JOIN suppliers ON product_availability.supp_id = suppliers.id`
      )
      .then((result) => res.json(result.rows))
      .catch((error) => {
        console.error(error);
        res.status(500).json(error);
      });
  }
});

app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query(`SELECT * FROM customers WHERE id = '${customerId}'`)
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/customers/:customerId/orders", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query(
      `SELECT  order_reference, order_date, product_name, unit_price, supplier_name, quantity
FROM orders
JOIN order_items
ON orders.id = order_items.order_id
JOIN products
ON order_items.product_id = products.id
JOIN product_availability
ON order_items.product_id = product_availability.prod_id
JOIN suppliers
ON order_items.supplier_id = suppliers.id
WHERE orders.customer_id = '${customerId}'`
    )
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.post("/customers", function (req, res) {
  const name = req.body.name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;

  pool
    .query(
      `INSERT INTO customers(name, address, city, country) VALUES($1,$2,$3,$4)`,
      [name, address, city, country]
    )
    .then(() => res.send("Info added!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.post("/products", function (req, res) {
  const product_name = req.body.product_name;

  pool
    .query(`INSERT INTO products(product_name) VALUES($1)`, [product_name])
    .then(() => res.send("Product added!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.post("/availability", function (req, res) {
  const unit_price = req.body.unit_price;

  pool
    .query(
      `INSERT INTO product_availability(supp_id, unit_price) VALUES($1, $2)`,
      [unit_price]
    )
    .then(() => res.send(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// app.post("/products", function (req, res) {
//   const product_name = req.body.product_name;
//   const unit_price = req.body.unit_price;
//   const supplier_name = req.body.supplier_name;

//   pool.connect((err, client, release) => {
//     if (err) {
//       return res.status(500).json({ error: err });
//     }

//     client.query("BEGIN", (error) => {
//       if (error) {
//         release().then(() => res.status(500).json({ error }));
//       }

//       client.query(
//         `INSERT INTO products(product_name, supplier_name) VALUES($1,$2)`,
//         [product_name, supplier_name],
//         (error, result) => {
//           if (!result) {
//             return client.query("ROLLBACK", (err) => {
//               release().then(() => {
//                 res.json({ message: "Data inserted" });
//               });
//             });
//           }
//           if (error) {
//             client.query("ROLLBACK", (err) => {
//               release().then(() => res.status(500).json({ error }));
//             });
//           }

//           const insertedId = result.rows[0].id;

//           client.query(
//             `INSERT INTO product_availability(unit_price, prod_id) VALUES($1)`,
//             [unit_price, insertedId],
//             (error, result) => {
//               if (error) {
//                 return client.query("ROLLBACK", (err) => {
//                   release().then(() => res.status(500).json({ error }));
//                 });
//               }
//               client.query("COMMIT", (err) => {
//                 if (err) {
//                   return client.query("ROLLBACK", (error) => {
//                     release().then(() => res.status(500).json({ error }));
//                   });
//                 }

//                 release().then(() => res.json({ message: "Data inserted" }));
//               });
//             }
//           );
//         }
//       );
//     });
//   });
// });

app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const name = req.body.product_name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;

  pool
    .query(
      ` UPDATE customers
       SET name = '${name}', address = '${address}', city = '${city}', country = '${country}'
       WHERE id = '${customerId}'`
    )
    .then((result) => res.json("Customer info updated!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/orders", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query(
      `SELECT * FROM orders JOIN order_items ON orders.id = order_items.order_id`
    )
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.delete("/orders/:orderId", function (req, res) {
  const orderId = req.params.orderId;

  pool
    .query(
      `DELETE FROM orders
      USING order_items WHERE orders.id = order_items.order_id AND order_id = '${orderId}' AND orders.id = '${orderId}'`
    )
    .then((result) => res.json("Deleted!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query(
      ` DELETE FROM customers
        WHERE EXISTS (SELECT *
        FROM orders
        WHERE orders.customer_id = customers.id
        AND orders.customer_id ='${customerId}')`
    )
    .then((result) => res.json("Deleted!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.listen(port, () => console.log(`Listening on port ${port}`));
