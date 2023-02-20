const express = require("express");
const app = express();
const { Pool } = require("pg");

const bodyParser = require("body-parser");
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Database Project");
});

const db = new Pool({
  user: "miladebrahimpour", // replace with you username
  host: "localhost",
  database: "cyf_ecommerce",
  password: process.env.USER_PASS,
  port: 5432,
});

app.get("/customers", function (req, res) {
  db.query("SELECT * FROM customers", (error, result) => {
    res.json(result.rows);
  });
});

app.get("/customers/:id", function (req, res) {
  const custId = parseInt(req.params.id);
  db.query(
    "SELECT * FROM customers WHERE id = $1",
    [custId],
    function (err, result) {
      if (err) {
        console.error(err);
        res.status(500).send("Error retrieving customer from database");
      } else {
        res.json(result.rows[0]);
        console.log(result.rows[0]);
      }
    }
  );
});

app.post("/customers", function (req, res) {
  const newName = req.body.name;
  const nweAddress = req.body.address;
  const newCity = req.body.city;
  const newCountry = req.body.country;

  if (!newName || !nweAddress || !newCity || !newCountry) {
    return res.status(400).send("Missing required field(s).");
  }

  const query =
    "INSERT INTO customers (name, address, city, country) " +
    "VALUES ($1, $2, $3, $4) returning id";

  db.query(query, [newName, nweAddress, newCity, newCountry], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error creating customer.");
    }
    const newID = result.rows[0].id;
    res.send(`New customer added. New Id = ${newID}`);
  });
});

app.put("/customers/:customerId", (req, res) => {
  const { name, address, city, country } = req.body;
  const custId = Number(req.params.customerId);

  if (!name || !address || !city || !country) {
    return res.status(400).send("Missing required field(s).");
  }

  db.query(
    "UPDATE customers SET name=$1, address=$2, city=$3, country=$4 WHERE id=$5",
    [name, address, city, country, custId],
    (error, result) => {
      if (error) {
        console.error(error);
        res.status(500).send("Error retrieving products from database");
      } else {
        res.status(200).json(`Customer with id:${custId} updated.`);
      }
    }
  );
});

app.get("/products", function (req, res) {
  const productName = req.query.name;

  db.query(
    "SELECT * FROM products WHERE product_name LIKE CONCAT('%', $1::text, '%')",
    [productName],
    (error, result) => {
      if (error) {
        console.error(error);
        res.status(500).send("Error retrieving products from database");
      } else {
        res.json(result.rows);
      }
    }
  );
});

app.post("/products", (req, res) => {
  const newProduct = req.body.product_name;

  if (!newProduct) {
    return res.status(400).send("Missing required field(s).");
  }

  const query =
    "INSERT INTO products (product_name) " + "VALUES ($1) RETURNING id";

  db.query(query, [newProduct], (error, result) => {
    if (error) {
      console.error(err);
      return res.status(500).send("Error creating customer.");
    }
    const newID = result.rows[0].id;
    res.status(200).send(`New product added. New Id = ${newID}`);
  });
});

app.post("/availability", (req, res) => {
  const { price, supId, prodId } = req.body;

  if (!prodId || !supId || !price) {
    return res.status(400).send("Missing required field(s).");
  }

  if (!Number.isInteger(price) || price < 0) {
    return res.status(400).send("Price must be a positive integer.");
  }

  const checkProductQuery = "SELECT COUNT(*) FROM products WHERE id = $1";
  db.query(checkProductQuery, [prodId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error checking product ID.");
    }

    const productCount = result.rows[0].count;
    if (productCount === 0) {
      return res.status(400).send("Invalid product ID.");
    }

    const checkSupplierQuery = "SELECT COUNT(*) FROM suppliers WHERE id = $1";
    db.query(checkSupplierQuery, [supId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error checking supplier ID.");
      }

      const supplierCount = result.rows[0].count;
      if (supplierCount === 0) {
        return res.status(400).send("Invalid supplier ID.");
      }

      const query =
        "INSERT INTO product_availability (prod_id, supp_id, unit_price) " +
        "VALUES ($1, $2, $3)";

      db.query(query, [prodId, supId, price], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error creating availability record.");
        }
        res.status(200).send("New availability record created.");
      });
    });
  });
});

app.post("/customers/:customerId/orders", (req, res) => {
  const { order_date, order_reference } = req.body;
  const customerId = req.params.customerId;

  if (!order_date || !order_reference || !customerId) {
    return res.status(400).send("Missing required field(s).");
  }

  const checkCustomerQuery = "SELECT COUNT(*) FROM customers WHERE id = $1";
  db.query(checkCustomerQuery, [customerId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error checking customer ID.");
    }

    const customerCount = result.rows[0].count;
    if (customerCount === 0) {
      return res.status(400).send("Invalid customer ID.");
    }

    const query =
      "INSERT INTO orders (order_date, order_reference, customer_id) " +
      "VALUES ($1, $2, $3)";

    db.query(
      query,
      [order_date, order_reference, customerId],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error creating order.");
        }
        res.status(200).send("New order created.");
      }
    );
  });
});

app.listen(5000, function () {
  console.log("Server is listening on port 5000. Ready to accept requests!");
});
