const express = require("express");
const router = express.Router();
const pool = require("../../pool");

// Gets all products
router.get("/", (req, res) => {
  const { name } = req.query;

  pool
    .query(
      "SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name  FROM products INNER JOIN product_availability ON product_availability.prod_id = products.id INNER JOIN suppliers ON suppliers.id = product_availability.supp_id WHERE LOWER(product_name) LIKE $1",
      [`%${name}%`]
    )
    .then((result) => res.send(result.rows))
    .catch((error) => console.log(error));
});

// Post a new product
router.post("/", (req, res) => {
  const { name } = req.body;

  pool
    .query("INSERT INTO products (product_name) VALUES ($1)", [name])
    .then(() => res.send("Successful"))
    .catch((error) => console.log(error));
});

module.exports = router;
