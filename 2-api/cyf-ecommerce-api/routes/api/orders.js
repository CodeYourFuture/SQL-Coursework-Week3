const express = require("express");
const router = express.Router();
const pool = require("../../pool");

// Deletes an order
router.delete("/:orderId", (req, res) => {
  const { orderId } = req.params;

  pool
    .query("DELETE FROM orders WHERE id = $1", [orderId])
    .then(() => res.send("Delete successful"))
    .catch((error) => console.log(error));
});

module.exports = router;
