const express = require("express");
const router = express.Router();
const pool = require("../../pool");

// Product availability
router.post("/", (req, res) => {
  const { productId, supplierId, price } = req.body;

  // Rejects if the price
  if (price < 0) {
    return res.status(400).send("Price is a negative number");
  }

  // 1st pool to check if product exists
  pool
    .query("SELECT * FROM products WHERE id = $1", [productId])
    .then((products) => {
      if (products.rows.length <= 0) {
        return res.status(400).send("Product not found");
      } else {
        // 2nd pool to check if suppler exists
        pool
          .query("SELECT * FROM suppliers WHERE id = $1", [supplierId])
          .then((suppliers) => {
            if (suppliers.rows.length <= 0) {
              return res.status(400).send("Supplier not found");
            } else {
              // Final pool which inserts the product availability
              pool
                .query(
                  "INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3)",
                  [productId, supplierId, price]
                )
                .then(() => res.send("Successful"))
                .catch((error) => console.log(error));
            }
          })
          .catch((error) => console.log(error));
      }
    })
    .catch((error) => console.log(error));
});

module.exports = router;
