const express = require("express");
const router = express.Router();
router.use(express.json());
// pg Pool object
const pool = require("../config");

// GET "/orders"
router.get("/", (req, res) => {
  pool
    .query(`SELECT * FROM orders`)
    .then((result) => res.json(result.rows))
    .catch((e) => res.send(e));
});

// DELETE ("/orders/{orderId}")
router.delete("/:orderId", (req, res) => {
  const orderId = Number(req.params.orderId);
  pool
    .query("DELETE FROM order_items WHERE order_id = $1;", [orderId])
    .then(() => {
      pool
        .query("DELETE FROM orders WHERE id = $1", [orderId])
        .then(() => res.status(204).send(`Order ${orderId} deleted!`))
        .catch((error) => res.send(error));
    })
    .catch((e) => res.send(e));
});

module.exports = router;
