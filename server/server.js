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
  const { rows } = await pool.query("SELECT * FROM customers", []);
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

//- GET endpoint `/customers/:customerId` to load a single customer by ID.

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

//- GET endpoint `/products` to filter the list of products by name using a query parameter, for example `/products?name=Cup`. This endpoint should still work even if you don't use the `name` query parameter!

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

//-POST endpoint `/customers` to create a new customer with name, address, city and country.

app.post("/customers", (req, res) => {
  const customer = {
    id: 8,
    name: req.body.name,
    address: req.body.address,
    city: req.body.city,
    country: req.body.country,
  };

  pool
    .query("INSERT INTO customers VALUES($1,$2,$3,$4,$5)", [
      customer.id,
      customer.name,
      customer.address,
      customer.city,
      customer.country,
    ])
    .then((result) =>
      res.json({ message: "Record saved successfully", data: customer })
    )
    .catch((err) => {
      console.log(err);
      res.status(500).json("Failed to save record.");
    });
});

//- POST endpoint `/products` to create a new product.

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

//- POST endpoint `/availability` to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.

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

//- POST endpoint `/customers/:customerId/orders` to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.

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

//- PUT endpoint `/customers/:customerId` to update an existing customer (name, address, city and country).

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

//- DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items.

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

//- DELETE endpoint `/customers/:customerId` to delete an existing customer only if this customer doesn't have orders.

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

//- GET endpoint `/customers/:customerId/orders` to load all the orders along with the items in the orders of a specific customer. Especially, the following information should be returned: order references, order dates, product names, unit prices, suppliers and quantities.

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
