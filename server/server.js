const express = require("express");
const { Pool } = require("pg");
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
// const pool = new Pool({
//   user: "ali",
//   database: "cyf_ecommerce",
//   host: "localhost",
//   password: "admin",
//   port: 5432,
// });
const pg = require("pg");
const ClientClass = pg.Client;
const pgUrl =
  "postgres://oqmvbphg:CjrsKtqK8OrwH-8kiJKGGWZtidjiEJq6@tyke.db.elephantsql.com/oqmvbphg";
const client = new ClientClass(pgUrl);

async function connect(client) {
  try {
    await client.connect();
    console.log(`Client connected.`);

    const sql = `SELECT * FROM products `;
    console.log(sql + "\n" + sql.length / 1024 + "kb");
    const { rows } = await client.query(sql);
    console.table(rows);
  } catch (ex) {
    console.log("Some error" + ex);
  } finally {
    await client.end();
  }
}

connect(client);
const pool = new Pool({
  user: "oqmvbphg",
  host: "tyke.db.elephantsql.com",
  database: "oqmvbphg",
  password: "CjrsKtqK8OrwH-8kiJKGGWZtidjiEJq6",
  port: 5432,
});
app.get("/customers/:customerId", (req, res) => {
  const { customerId } = req.params;

  pool
    .query("SELECT * FROM customers WHERE id = $1;", [customerId])
    .then((result) => res.send(result.rows))
    .catch((error) => console.log(error));
});
app.post("/customers", (req, res) => {
  const name = req.body.name;
  const address = req.body.address;
  const city = req.body.city;
  const country = req.body.country;
  const query =
    "INSERT INTO customers ( name, address, city, country) VALUES ($1, $2, $3 ,$4)";

  console.log(name, address, city, country);
  return pool
    .query(query, [name, address, city, country])
    .then((result) => res.status(200).send("Customer Added"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.post("/products", (req, res) => {
  const productName = req.body.product_name;

  const query = "INSERT INTO products ( product_name) VALUES ($1)";

  return pool
    .query(query, [productName])
    .then(() => res.status(200).send("Product Added"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.post("availability", (req, res) => {
  const prod_id = req.body.prod_id;
  const supp_id = req.body.supp_id;
  const unit_price = req.body.unit_price;

  const query =
    "INSERT INTO products (prod_id ,supp_id, unit_price) VALUES ($1 ,$2,$3)";
  if (
    !Number.isInteger(prod_id) ||
    unit_price <= 0 ||
    prod_id <= 0 ||
    prod_id <= 0
  ) {
    return res.status(400).send("The numbers should be a positive integer.");
  }
  return pool
    .query(query, [prod_id, supp_id, unit_price])
    .then(() => res.status(200).send(""))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.post("/customers/:customerId/orders", (req, res) => {
  const productName = req.body.product_name;

  const query = "INSERT INTO products ( product_name) VALUES ($1)";

  return pool
    .query(query, [productName])
    .then(() => res.status(200).send("Product Added"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.put("/customers/:customerId", (req, res) => {
  const productName = req.body.product_name;

  const query = "INSERT INTO products ( product_name) VALUES ($1)";

  return pool
    .query(query, [productName])
    .then(() => res.status(200).send("Product Added"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.delete("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;

  const query = "DELETE FROM orders WHERE id = $1";

  return pool
    .query(query, [orderId])
    .then(() => res.status(200).send("Order Deleted!"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.delete("/customers/:customerId", (req, res) => {
  const { customerId } = req.params;

  const query = "DELETE FROM customers WHERE id = $1";
  pool
    .query("SELECT * FROM orders WHERE customer_id = $1", [customerId])
    .then((data) => {
      if (data.rows.length > 0) {
        res.status(500).send("Error has order");
      } else {
        pool
          .query("SELECT * FROM customers WHERE id = $1", [customerId])
          .then((data) => {
            if (data.rows.length) {
              pool
                .query(query, [customerId])
                .then(() => res.status(200).send("Customer Deleted!"))
                .catch((error) => {
                  console.error(error);
                  res.status(500).json(error);
                });
            } else {
              res.status(500).send("Error Customer not Exist");
            }
          });
      }
    });
});
app.get("/customers/:customerId/orders", (req, res) => {
  const productName = req.body.product_name;

  const query = "INSERT INTO products ( product_name) VALUES ($1)";

  return pool
    .query(query, [productName])
    .then(() => res.status(200).send("Product Added"))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.get("/customers", (req, res) => {
  return pool
    .query("SELECT * FROM customers")
    .then((result) => res.send(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.get("/product_availability", (req, res) => {
  return pool
    .query("SELECT * FROM product_availability;")
    .then((result) => res.send(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.get("/suppliers", (req, res) => {
  return pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.send(result))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.get("/products", (req, res) => {
  return pool
    .query(
      "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name  FROM products INNER JOIN product_availability ON product_availability.prod_id = products.id INNER JOIN suppliers ON suppliers.id = product_availability.supp_id"
    )
    .then((result) => res.send(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.get("/products", (req, res) => {
  return pool
    .query(
      "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name  FROM products INNER JOIN product_availability ON product_availability.prod_id = products.id INNER JOIN suppliers ON suppliers.id = product_availability.supp_id"
    )
    .then((result) => res.send(result))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.get("/orders", (req, res) => {
  return pool
    .query("SELECT * FROM orders")
    .then((result) => res.send(result))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
app.get("/order_items", (req, res) => {
  return pool
    .query("SELECT * FROM order_items")
    .then((result) => res.send(result))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

app.listen(3000, () => {
  console.log(`Server running on port: 3000`);
});
