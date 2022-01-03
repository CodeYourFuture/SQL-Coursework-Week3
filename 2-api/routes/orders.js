const express = require("express");
const router = express.Router();
const pool = require("../utils/pool");

// DELETE endpoint `/orders/:orderId` to delete an existing order along with all the associated order items
router.delete("/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  const orderIdExistsQuery = "SELECT EXISTS(SELECT 1 FROM orders WHERE id=$1)";

  // check if the orderId is a valid id in orders table, if not return 400
  pool.query(orderIdExistsQuery, [orderId]).then((result) => {
    if (result.rows[0].exists === false) {
      return res
        .status(400)
        .send(`There is no order with the id of ${orderId} in orders table.`);
    } else {
      // order id is a valid id in orders table so delete orders from order items first(foreign key constraint) and then delete order itself from the orders table
      const deleteOrderIdFromOrdersQuery = "DELETE FROM orders WHERE id=$1";
      const deleteOrdersFromOrderItemsQuery =
        "DELETE FROM order_items WHERE order_id=$1";

      pool.query(deleteOrdersFromOrderItemsQuery, [orderId]).then(() =>
        pool.query(deleteOrderIdFromOrdersQuery, [orderId]).then(() => {
          res.send(
            `Order with the id of ${orderId} and order items related to the order with the id of ${orderId} has been deleted.`
          );
        })
      );
    }
  });
});


module.exports = router;