const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;
const { Pool } = require("pg");
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf_ecommerce",
  password: "Pa55w0rd123!",
  port: 5432,
});

app.get("/", (req, res) => {
  res.json("Welcome to the server!");
});

app.get("/customers", (req, res) => {
  pool.query("SELECT * FROM customers", (error, result) => {
    if (!error) {
      res.json(result.rows);
    } else {
      console.log(error);
    }
  });
});

app.get("/suppliers", (req, res) => {
  pool.query("SELECT * FROM suppliers", (error, result) => {
    if (!error) {
      res.json(result.rows);
    } else {
      console.log(error);
    }
  });
});

//! 1.  GET ENDPOINT "/products"
//If you don't have it already, add a new GET endpoint /products to load all the product names along with their prices and supplier names.

// app.get("/products", (req, res) => {
//   pool.query(
//     "SELECT product_name, unit_price, supplier_name FROM product_availability INNER JOIN products ON prod_id = products.id INNER JOIN suppliers ON supp_id = suppliers.id",
//     (error, result) => {
//       if (!error) {
//         res.json(result.rows);
//       } else {
//         console.log(error);
//       }
//     }
//   );
// });

//! 2. GET ENDPOINT WITH QUERY PARAMS
// Update the previous GET endpoint /products to filter the list of products by name using a query parameter, for example /products?name=Cup. This endpoint should still work even if you don't use the name query parameter!

app.get("/products", (req, res) => {
  const name = req.query.name;
  console.log(name);
  pool.query(
    `SELECT product_name, unit_price, supplier_name FROM product_availability INNER JOIN products ON prod_id = products.id INNER JOIN suppliers ON supp_id = suppliers.id ${
      name ? "WHERE product_name ILIKE $1" : ""
    }`,
    name ? [`%${name}%`] : [],
    (err, result) => {
      if (!err) {
        res.json(result.rows);
      } else {
        console.log(err);
      }
    }
  );
});

//! 3. GET ENDPOINT SINGLE CUSTOMER BY ID
// Add a new GET endpoint /customers/:customerId to load a single customer by ID.

app.get("/customers/:customerId", (req, res) => {
  const customerId = req.params.customerId;
  pool.query(
    "SELECT * FROM customers  WHERE id=$1",
    [customerId],
    (err, result) => {
      if (!err) {
        res.json(result.rows);
      } else {
        console.log(err);
      }
    }
  );
});

//! POST ENDPOINT TO CREATE NEW CUSTOMER
// Add a new POST endpoint /customers to create a new customer with name, address, city and country.

app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerAdd = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  if (!newCustomerName) {
    return res.status(400).send("Please enter customer name");
  }
  pool
    .query("SELECT name FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send("Customer name is already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES ($1,$2,$3,$4)";
        pool
          .query(query, [
            newCustomerName,
            newCustomerAdd,
            newCustomerCity,
            newCustomerCountry,
          ])
          .then(() => res.send("customer added"))
          .catch((e) => console.error(e));
      }
    });
});

//! POST ENDPOINT TO CREATE NEW PRODUCT
// Add a new POST endpoint /products to create a new product.

app.post("/products", function (req, res) {
  const newProductName = req.body.name;

  if (!newProductName) {
    return res.status(400).send("Please enter product name");
  }

  pool
    .query("SELECT product_name FROM products WHERE product_name=$1", [
      newProductName,
    ])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send("PRODUCT already exists!");
      } else {
        const query = "INSERT INTO products (product_name) VALUES ($1)";
        pool
          .query(query, [newProductName])
          .then(() => res.send("Product created!"))
          .catch((e) => console.error(e));
      }
    });
});

//! POST AVAILABILITY WITH PRICE AND AVAILABILITY
//Add a new POST endpoint /availability to create a new product availability (with a price and a supplier id). Check that the price is a positive integer and that both the product and supplier ID's exist in the database, otherwise return an error.
app.post("/availability", function (req, res) {
  const productId = req.body.prod_id;
  const supplierId = req.body.supp_id;
  const unitPrice = req.body.unit_price;

  if (!supplierId || !productId || !unitPrice || unitPrice < 0) {
    return res.status(400).send("ERROR, please insert correct data");
  }
  pool
    .query(
      "SELECT products.id, suppliers.id FROM suppliers WHERE product_id=$1 AND suppliers_id=$2",
      [productId, supplierId]
    )
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(400).send("Product or Supplier is not Exists");
      } else {
        const query =
          "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)";

        pool
          .query(query, [productId, supplierId, unitPrice])
          .then(() => res.send("New product availability added"))
          .catch((e) => console.error(e));
      }
    });
});

//! POST ENDPOINT TO CREATE NEW CUSTOMER
// Add a new POST endpoint /customers/:customerId/orders to create a new order (including an order date, and an order reference) for a customer. Check that the customerId corresponds to an existing customer or return an error.

app.post("/customers/:customerId/orders", (req, res) => {
  const customerId = req.params.customerId;
  const newOrderDate = req.body.orderDate;
  const newOrderRef = req.body.orderRef;
  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
      if (result.rowCount === 0) {
        return res.status(400);
      }
    })
    .query(
      "INSERT INTO orders(customer_id, order_date, order_reference) VALUES ($1, $2, $3)",
      [customerId, newOrderDate, newOrderRef],
      (err, result) => {
        if (!err) {
          res.status(200).json(result.rows);
        } else {
          res.status(400);
          console.log(err);
        }
      }
    );
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}. Ready to accept requests!`);
});
