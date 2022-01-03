const express = require('express');
const router = express.Router();
const pool = require('../utils/pool');

// return all the product names along with their prices and supplier names
router.get("/", (req, res) => {
  const productQueryName = req.query.name;
  const queryForAllProducts =
    "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id ORDER BY products.product_name";

  const queryWhereProductNameIsQueryName =
    "SELECT * FROM (SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products INNER JOIN product_availability ON products.id = product_availability.prod_id INNER JOIN suppliers ON product_availability.supp_id = suppliers.id ORDER BY products.product_name) AS results WHERE product_name=$1";

  if (productQueryName) {
    pool
      .query(queryWhereProductNameIsQueryName, [productQueryName])
      .then((result) => {
        if (result.rows.length === 0) {
          return res
            .status(200)
            .send(`There is no product with the name of ${productQueryName}.`);
        } else {
          return res.send(result.rows);
        }
      })
      .catch((error) => {
        console.error(error);
        res.send(`Something went wrong`);
      });
  } else {
    pool
      .query(queryForAllProducts)
      .then((result) => {
        return res.send(result.rows);
      })
      .catch((error) => {
        console.error(error);
        res.send(`Something went wrong!`);
      });
  }
});

// POST endpoint `/products` to create a new product.
router.post("/", (req, res) => {
  const { product_name } = req.body; // get the product name req object with object destructuring
  if (!product_name) {
    // check if the client all the data needed, if not send status 400
    return res
      .status(400)
      .send(
        `Please fill everything in the form including product name, unit price and supplier name.`
      );
  }
  pool
    .query("SELECT * FROM products WHERE product_name=$1", [product_name])
    .then((result) => {
      // if product already in products, send status 400
      if (result.rows.length > 0) {
        res.status(400).send(`This product is already in the products.`);
      } else {
        // if product not in products table add it to the products table with the value sent by the client
        pool
          .query("INSERT INTO products (product_name) VALUES ($1)", [
            product_name,
          ])
          .then(() => {
            res.status(200).send(`The product has been added to the products.`);
          });
      }
    });
});






module.exports = router;