const express = require("express");

const dotenv = require("dotenv");
dotenv.config();
const app = express();
app.use(express.json());
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.PG_CONNECT,
});

// GET ALL THE CUSTOMERS
app.get("/customers", function (req, res) {
  pool
    .query("SELECT * FROM customers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// for getting suppliers
app.get("/suppliers", function (req, res) {
  pool
    .query("SELECT * FROM suppliers")
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});
//  GET PRODUCTS
app.get("/products", function (req, res) {
  pool

    .query(
      `SELECT products.product_name AS product, product_availability.unit_price AS price, suppliers.supplier_name AS supplier
        FROM product_availability
        JOIN products
        ON products.id = product_availability.prod_id
        JOIN suppliers
        ON suppliers.id = product_availability.supp_id`
    )
    .then((result) => res.json(result.rows))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// GET CUSTOMER WITH AN ID

app.get("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  pool
    .query("SELECT * FROM customers WHERE id = $1", [customerId])
    .then((result) => {
      if (result.rows.length) {
        return res.json(result.rows[0]);
      } else {
        return res
          .status(404)
          .send({ msg: `Customer ${customerId} doesn't exist` });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
});

// ADDING A CUSTOMER
app.post("/customers", function (req, res) {
  let customerName = req.body.name;
  let customerAddress = req.body.address;
  let customerCity = req.body.city;
  let customerCountry = req.body.country;

  if (!customerName || !customerAddress || !customerCity || !customerCountry) {
    return res.status(400).send({ msg: "Please fill in the required fields." });
  }
  pool
    .query("SELECT * FROM customers WHERE name = $1", [customerName])
    .then((result) => {
      if (result.rows.length) {
        return res
          .status(404)
          .send({ msg: `Customer ${customerName} already exists` });
      } else {
        pool
          .query(
            `INSERT INTO customers (name, address, city, country) Values($1, $2, $3, $4)`,
            [customerName, customerAddress, customerCity, customerCountry]
          )
          .then(() =>
            res.send({ msg: `Customer ${customerName} added successfully.` })
          )
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// ADDING A PRODUCT
app.post("/products", function (req, res) {
  const productName = req.body.product;

  if (!productName) {
    return res.status(404).send({
      msg: `Product name is required !`,
    });
  }
  pool
    .query("SELECT * FROM products WHERE product_name = $1", [productName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res.status(400).send({
          msg: `A product with similar name:${productName} already exists !`,
        });
      } else {
        pool
          .query(`INSERT INTO products(product_name) VALUES($1)`, [productName])
          .then(() =>
            res.send({ msg: `Product ${productName} added successfully ` })
          )
          .catch((error) => {
            console.error(error);
            res.status(500).json(error);
          });
      }
    });
});

// ADDING PRODUCT AVAILABILITY
app.post("/availability", function (req, res) {
  let productId = req.body.prod_id;
  let productPrice = req.body.unit_price;
  let supplierId = req.body.supp_id;
  if (!Number.isNumber(productPrice) || productPrice < 0) {
    return res.status(400).send({ msg: "Enter a Valid Price!" });
  }
  if (!supplierId) {
    return res.status(400).send({ msg: "Supplier id is missing!" });
  }
  pool
    .query("SELECT * FROM products WHERE id =$1", [productId])
    .then((result) => {
      // if (result.rows.length === 0) {
      //   return res
      //     .status(400)
      //     .send({ msg: `Product id:${productId} does not exist` });
      // } else

      // IT CAN WORK WITHOUT ABOVE CODE
      if (result.rows.length > 0) {
        pool
          .query("SELECT * FROM suppliers WHERE id =$1", [supplierId])
          .then((result) => {
            if (result.rows.length === 0) {
              return res
                .status(400)
                .send({ msg: `Product id:${supplierId} does not exist` });
            }
          });
      } else {
        pool
          .query(
            `INSERT INTO product_availability (prod_id,unit_price,supp_id ) VALUES($1,$2,$3)`,
            [productId, productPrice, supplierId]
          )
          .then(() => res.send({ msg: `Product:${productId} added` }))
          .catch((error) => {
            console.log(error);
            res.json(error);
          });
      }
    });
});

app.listen(5000, function () {
  console.log("Server is listening on port 5000. Ready to accept requests!");
});
